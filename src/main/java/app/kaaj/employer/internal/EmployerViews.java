package app.kaaj.employer.internal;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import app.kaaj.employer.EmployerKind;
import app.kaaj.employer.VerificationStatus;

/** View: the JSON the employer module sends. Controllers turn the model into these records and nothing else. */
final class EmployerViews {
    private EmployerViews() {}

    /** What the employer sees of their own profile. The document itself is never sent back, only its name. */
    record ProfileView(
            UUID id, String name, EmployerKind kind, String address, Double latitude, Double longitude,
            String contactPerson, String contactPhone, String contactEmail,
            boolean hasDocument, String documentName, Employer.DocumentType documentType,
            VerificationStatus status, String verificationNote, Instant submittedAt, Instant verifiedAt,
            Instant createdAt, boolean verified, List<String> missing) {

        static ProfileView of(Employer e) {
            return new ProfileView(e.getId(), e.getName(), e.getKind(), e.getAddress(), e.getLatitude(),
                    e.getLongitude(), e.getContactPerson(), e.getContactPhone(), e.getContactEmail(),
                    e.getDocumentKey() != null, e.getDocumentName(), e.getDocumentType(),
                    e.getVerificationStatus(), e.getVerificationNote(), e.getSubmittedAt(), e.getVerifiedAt(),
                    e.getCreatedAt(), e.isVerified(), e.missingForReview());
        }
    }

    /**
     * An employer in the admin's verification queue, with a link to the uploaded document. {@code documentIsPdf}
     * comes from the stored file's real type (its key), not from the name it was uploaded with.
     */
    record AdminEmployerView(
            UUID id, String name, EmployerKind kind, String address, Double latitude, Double longitude,
            String contactPerson, String contactPhone, String contactEmail, String ownerEmail,
            String documentName, Employer.DocumentType documentType, String documentUrl, boolean documentIsPdf,
            VerificationStatus status, String verificationNote, Instant submittedAt, Instant verifiedAt,
            Instant createdAt) {

        static AdminEmployerView of(EmployerVerificationService.Review review) {
            Employer e = review.employer();
            String key = e.getDocumentKey();
            String documentUrl = key == null ? null : "/api/v1/admin/employers/" + e.getId() + "/document";
            return new AdminEmployerView(e.getId(), e.getName(), e.getKind(), e.getAddress(), e.getLatitude(),
                    e.getLongitude(), e.getContactPerson(), e.getContactPhone(), e.getContactEmail(),
                    review.ownerEmail(), e.getDocumentName(), e.getDocumentType(), documentUrl,
                    key != null && key.endsWith(".pdf"), e.getVerificationStatus(), e.getVerificationNote(),
                    e.getSubmittedAt(), e.getVerifiedAt(), e.getCreatedAt());
        }
    }
}
