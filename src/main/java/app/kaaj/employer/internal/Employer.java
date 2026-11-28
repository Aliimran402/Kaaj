package app.kaaj.employer.internal;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

import app.kaaj.employer.EmployerKind;
import app.kaaj.employer.EmployerSummary;
import app.kaaj.employer.VerificationStatus;
import app.kaaj.shared.ApiException;
import app.kaaj.shared.UuidV7;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.PostLoad;
import jakarta.persistence.PostPersist;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import org.springframework.data.domain.Persistable;

/**
 * Model: an employer's business profile and its verification (table {@code employer}, migration V130).
 * Every status change goes through this class, so the rules in {@link VerificationStatus} always hold.
 */
@Entity
@Table(name = "employer")
class Employer implements Persistable<UUID> {
    static final float TRUST_UNVERIFIED = 0.5f;
    static final float TRUST_VERIFIED = 0.8f;

    /** Which document the employer uploaded. */
    enum DocumentType { TRADE_LICENCE, NATIONAL_ID }

    /** The business details the employer fills in. */
    record Details(String name, EmployerKind kind, String address, Double latitude, Double longitude,
                   String contactPerson, String contactPhone, String contactEmail) {}

    @Id private UUID id;
    private UUID ownerId;
    private String name;
    @Enumerated(EnumType.STRING) private EmployerKind kind;
    private String address;
    private Double latitude;
    private Double longitude;
    private String contactPerson;
    private String contactPhone;
    private String contactEmail;
    private String documentKey;
    private String documentName;
    @Enumerated(EnumType.STRING) private DocumentType documentType;
    @Enumerated(EnumType.STRING) private VerificationStatus verificationStatus;
    private String verificationNote;
    private Instant submittedAt;
    private UUID verifiedBy;
    private Instant verifiedAt;
    private float trustScore;
    private Instant createdAt;
    private Instant updatedAt;

    // The id is set here, not by the database, so tell Spring Data whether the row exists yet (insert vs update).
    @Transient private boolean isNew = true;

    protected Employer() {}

    static Employer create(UUID ownerId, Details details, Instant now) {
        Employer e = new Employer();
        e.id = UuidV7.next();
        e.ownerId = ownerId;
        e.verificationStatus = VerificationStatus.UNVERIFIED;
        e.trustScore = TRUST_UNVERIFIED;
        e.createdAt = now;
        e.apply(details, now);
        return e;
    }

    /**
     * Saves new business details. A verified employer who changes the business name goes back to PENDING (the
     * document must match the name); a rejected employer who has a document is sent for review again.
     */
    void updateDetails(Details details, Instant now) {
        boolean nameChanged = !Objects.equals(clean(details.name()), name);
        apply(details, now);
        if (verificationStatus == VerificationStatus.VERIFIED && nameChanged) {
            sendForReview(now);
        } else if (verificationStatus == VerificationStatus.REJECTED && documentKey != null) {
            sendForReview(now);
        }
    }

    /**
     * Attaches the trade licence or NID and sends the profile for review.
     *
     * @return the key of the document it replaces (so the caller can delete that file), or null
     */
    String attachDocument(String key, String originalName, DocumentType type, Instant now) {
        String previous = documentKey;
        documentKey = key;
        documentName = originalName;
        documentType = type;
        updatedAt = now;
        if (verificationStatus != VerificationStatus.PENDING) sendForReview(now);
        return previous;
    }

    /** Sends the profile for review again without a new document, for example after fixing the address. */
    void submit(Instant now) {
        if (verificationStatus == VerificationStatus.PENDING) throw ApiException.conflict("employer.already-pending");
        if (verificationStatus == VerificationStatus.VERIFIED) throw ApiException.conflict("employer.already-verified");
        sendForReview(now);
    }

    void approve(UUID adminId, String note, Instant now) {
        moveTo(VerificationStatus.VERIFIED, now);
        verificationNote = clean(note);
        verifiedBy = adminId;
        verifiedAt = now;
        trustScore = TRUST_VERIFIED;
    }

    void reject(UUID adminId, String reason, Instant now) {
        String cleanReason = clean(reason);
        if (cleanReason == null) throw ApiException.badRequest("employer.reject.reason-required");
        moveTo(VerificationStatus.REJECTED, now);
        verificationNote = cleanReason;
        verifiedBy = adminId;
        verifiedAt = null;
        trustScore = TRUST_UNVERIFIED;
    }

    /** What is still missing before the profile can be reviewed (field names; the web app translates them). */
    List<String> missingForReview() {
        List<String> missing = new ArrayList<>();
        if (name == null) missing.add("name");
        if (kind == null) missing.add("kind");
        if (address == null) missing.add("address");
        if (contactPerson == null) missing.add("contactPerson");
        if (contactPhone == null) missing.add("contactPhone");
        if (documentKey == null) missing.add("document");
        return missing;
    }

    boolean isVerified() { return verificationStatus == VerificationStatus.VERIFIED; }

    EmployerSummary toSummary() {
        return new EmployerSummary(id, ownerId, name, kind, address, verificationStatus, trustScore);
    }

    private void sendForReview(Instant now) {
        if (!missingForReview().isEmpty()) throw ApiException.conflict("employer.incomplete");
        moveTo(VerificationStatus.PENDING, now);
        submittedAt = now;
        verifiedAt = null;
        verifiedBy = null;
        verificationNote = null;
        trustScore = TRUST_UNVERIFIED;
    }

    private void moveTo(VerificationStatus next, Instant now) {
        if (!verificationStatus.canMoveTo(next)) throw ApiException.conflict("employer.status.invalid-move");
        verificationStatus = next;
        updatedAt = now;
    }

    private void apply(Details details, Instant now) {
        name = clean(details.name());
        kind = details.kind();
        address = clean(details.address());
        latitude = details.latitude();
        longitude = details.longitude();
        contactPerson = clean(details.contactPerson());
        contactPhone = phone(details.contactPhone());
        contactEmail = clean(details.contactEmail());
        updatedAt = now;
    }

    /** "01712-345 678" → "01712345678": one way of writing a number, so admins can compare and call it. */
    static String phone(String text) {
        String cleaned = clean(text);
        return cleaned == null ? null : cleaned.replaceAll("[\\s-]", "");
    }

    private static String clean(String text) {
        if (text == null) return null;
        String stripped = text.strip();
        return stripped.isEmpty() ? null : stripped;
    }

    @Override public UUID getId() { return id; }
    @Override public boolean isNew() { return isNew; }

    @PostLoad
    @PostPersist
    void markNotNew() { isNew = false; }

    UUID getOwnerId() { return ownerId; }
    String getName() { return name; }
    EmployerKind getKind() { return kind; }
    String getAddress() { return address; }
    Double getLatitude() { return latitude; }
    Double getLongitude() { return longitude; }
    String getContactPerson() { return contactPerson; }
    String getContactPhone() { return contactPhone; }
    String getContactEmail() { return contactEmail; }
    String getDocumentKey() { return documentKey; }
    String getDocumentName() { return documentName; }
    DocumentType getDocumentType() { return documentType; }
    VerificationStatus getVerificationStatus() { return verificationStatus; }
    String getVerificationNote() { return verificationNote; }
    Instant getSubmittedAt() { return submittedAt; }
    UUID getVerifiedBy() { return verifiedBy; }
    Instant getVerifiedAt() { return verifiedAt; }
    float getTrustScore() { return trustScore; }
    Instant getCreatedAt() { return createdAt; }
}
