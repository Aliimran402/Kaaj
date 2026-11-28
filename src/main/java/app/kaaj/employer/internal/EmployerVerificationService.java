package app.kaaj.employer.internal;

import java.time.Instant;
import java.util.EnumMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import app.kaaj.employer.EmployerRejected;
import app.kaaj.employer.EmployerVerified;
import app.kaaj.employer.VerificationStatus;
import app.kaaj.identity.AuditLog;
import app.kaaj.identity.UserDirectory;
import app.kaaj.shared.ApiException;
import app.kaaj.shared.Cursor;
import app.kaaj.shared.CursorPage;
import app.kaaj.shared.FileStore;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Model: the admin side of verification, the queue and the decisions. Every decision is written to the audit log in
 * the same transaction, and an {@link EmployerVerified} or {@link EmployerRejected} event is published.
 */
@Service
@Transactional
class EmployerVerificationService {
    private static final List<VerificationStatus> QUEUE_STATUSES =
            List.of(VerificationStatus.PENDING, VerificationStatus.VERIFIED, VerificationStatus.REJECTED);

    /** An employer as the admin reviews it: the profile and the email of the account that owns it. */
    record Review(Employer employer, String ownerEmail) {}

    /** The uploaded document, for the admin to look at. */
    record Document(String name, String mediaType, byte[] bytes) {}

    private final EmployerRepository employers;
    private final UserDirectory users;
    private final FileStore files;
    private final AuditLog auditLog;
    private final ApplicationEventPublisher events;

    EmployerVerificationService(EmployerRepository employers, UserDirectory users, FileStore files,
                                AuditLog auditLog, ApplicationEventPublisher events) {
        this.employers = employers;
        this.users = users;
        this.files = files;
        this.auditLog = auditLog;
        this.events = events;
    }

    /** One page of employers in a status, oldest submission first. */
    @Transactional(readOnly = true)
    CursorPage<Review> queue(VerificationStatus status, String cursor, int size) {
        if (!QUEUE_STATUSES.contains(status)) throw ApiException.badRequest("employer.queue.bad-status");
        int pageSize = Math.clamp(size, 1, 100);
        PageRequest page = PageRequest.of(0, pageSize + 1);   // one extra row tells us whether there is a next page
        List<Employer> rows;
        if (cursor == null || cursor.isBlank()) {
            rows = employers.queueFirstPage(status, page);
        } else {
            Cursor after = Cursor.decode(cursor);
            rows = employers.queueAfter(status, after.at(), after.id(), page);
        }
        boolean more = rows.size() > pageSize;
        List<Employer> items = more ? rows.subList(0, pageSize) : rows;
        String next = more ? new Cursor(items.getLast().getSubmittedAt(), items.getLast().getId()).encode() : null;
        Map<UUID, String> emails = users.emailsOf(items.stream().map(Employer::getOwnerId).distinct().toList());
        return new CursorPage<>(items.stream().map(e -> new Review(e, emails.get(e.getOwnerId()))).toList(), next);
    }

    @Transactional(readOnly = true)
    Map<VerificationStatus, Long> counts() {
        Map<VerificationStatus, Long> counts = new EnumMap<>(VerificationStatus.class);
        for (VerificationStatus status : VerificationStatus.values()) {
            counts.put(status, employers.countByVerificationStatus(status));
        }
        return counts;
    }

    @Transactional(readOnly = true)
    Review get(UUID employerId) {
        return review(employers.findById(employerId).orElseThrow(() -> ApiException.notFound("employer.not-found")));
    }

    @Transactional(readOnly = true)
    Document document(UUID employerId) {
        Employer employer = employers.findById(employerId)
                .orElseThrow(() -> ApiException.notFound("employer.not-found"));
        FileStore.FileContent file = files.open(employer.getDocumentKey())
                .orElseThrow(() -> ApiException.notFound("employer.document.missing"));
        return new Document(employer.getDocumentName(), file.mediaType(), file.bytes());
    }

    Review approve(UUID adminId, UUID employerId, String note) {
        Employer employer = lock(employerId);
        Instant now = Instant.now();
        employer.approve(adminId, note, now);
        Map<String, Object> details = new LinkedHashMap<>();
        details.put("name", employer.getName());
        details.put("note", employer.getVerificationNote());
        auditLog.record(adminId, "EMPLOYER_VERIFIED", "employer:" + employerId, details);
        events.publishEvent(new EmployerVerified(employerId, employer.getOwnerId(), now));
        return review(employer);
    }

    Review reject(UUID adminId, UUID employerId, String reason) {
        Employer employer = lock(employerId);
        Instant now = Instant.now();
        employer.reject(adminId, reason, now);
        Map<String, Object> details = new LinkedHashMap<>();
        details.put("name", employer.getName());
        details.put("reason", employer.getVerificationNote());
        auditLog.record(adminId, "EMPLOYER_REJECTED", "employer:" + employerId, details);
        events.publishEvent(new EmployerRejected(employerId, employer.getOwnerId(), employer.getVerificationNote(), now));
        return review(employer);
    }

    private Employer lock(UUID employerId) {
        return employers.lockById(employerId).orElseThrow(() -> ApiException.notFound("employer.not-found"));
    }

    private Review review(Employer employer) {
        return new Review(employer, users.emailsOf(List.of(employer.getOwnerId())).get(employer.getOwnerId()));
    }
}
