package app.kaaj.employer.internal;

import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.UUID;

import app.kaaj.employer.VerificationStatus;
import app.kaaj.employer.internal.EmployerViews.AdminEmployerView;
import app.kaaj.identity.CurrentUser;
import app.kaaj.shared.CursorPage;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/** Controller: the admin's verification queue and decisions. Only ADMIN accounts reach /api/v1/admin/**. */
@RestController
@RequestMapping("/api/v1/admin/employers")
class AdminEmployerController {

    enum Decision { APPROVE, REJECT }

    /** {@code reason} is required for REJECT (the employer sees it) and an optional note for APPROVE. */
    record DecisionRequest(@NotNull Decision decision, @Size(max = 500) String reason) {}

    private final EmployerVerificationService verification;
    private final CurrentUser currentUser;

    AdminEmployerController(EmployerVerificationService verification, CurrentUser currentUser) {
        this.verification = verification;
        this.currentUser = currentUser;
    }

    /** ?status=PENDING (default), VERIFIED or REJECTED; then ?cursor= from the previous page's nextCursor. */
    @GetMapping
    CursorPage<AdminEmployerView> queue(@RequestParam(defaultValue = "PENDING") VerificationStatus status,
                                        @RequestParam(required = false) String cursor,
                                        @RequestParam(defaultValue = "20") int size) {
        return verification.queue(status, cursor, size).map(AdminEmployerView::of);
    }

    /** How many employers are in each status, for the tab labels. */
    @GetMapping("/counts")
    Map<VerificationStatus, Long> counts() {
        return verification.counts();
    }

    @GetMapping("/{id}")
    AdminEmployerView one(@PathVariable UUID id) {
        return AdminEmployerView.of(verification.get(id));
    }

    /** The uploaded trade licence or NID, shown inline in the browser (admins only). */
    @GetMapping("/{id}/document")
    ResponseEntity<byte[]> document(@PathVariable UUID id) {
        EmployerVerificationService.Document document = verification.document(id);
        String name = document.name() == null ? "document" : document.name();
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(document.mediaType()))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.inline().filename(name, StandardCharsets.UTF_8).build().toString())
                .body(document.bytes());
    }

    @PostMapping("/{id}/verification")
    AdminEmployerView decide(@PathVariable UUID id, @Valid @RequestBody DecisionRequest body) {
        UUID adminId = currentUser.id();
        return AdminEmployerView.of(switch (body.decision()) {
            case APPROVE -> verification.approve(adminId, id, body.reason());
            case REJECT -> verification.reject(adminId, id, body.reason());
        });
    }
}
