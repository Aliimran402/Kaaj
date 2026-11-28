package app.kaaj.employer.internal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.Instant;
import java.util.UUID;

import app.kaaj.employer.EmployerKind;
import app.kaaj.employer.VerificationStatus;
import app.kaaj.shared.ApiException;
import org.junit.jupiter.api.Test;

/** The verification status flow, one test per move. Plain Java: no database, no Spring. */
class EmployerTest {
    static final Instant NOW = Instant.parse("2026-11-27T09:00:00Z");
    static final UUID ADMIN = UUID.randomUUID();

    static Employer.Details details(String name) {
        return new Employer.Details(name, EmployerKind.SME, "Station Road, Tongi", 23.89, 90.40,
                "Karim Uddin", "01712-345 678", null);
    }

    static Employer pending() {
        Employer employer = Employer.create(UUID.randomUUID(), details("Karim Transport"), NOW);
        employer.attachDocument("document-a.pdf", "licence.pdf", Employer.DocumentType.TRADE_LICENCE, NOW);
        return employer;
    }

    @Test
    void aNewProfileIsUnverifiedAndOnlyMissesTheDocument() {
        Employer employer = Employer.create(UUID.randomUUID(), details("  Karim Transport "), NOW);
        assertThat(employer.getVerificationStatus()).isEqualTo(VerificationStatus.UNVERIFIED);
        assertThat(employer.missingForReview()).containsExactly("document");
        assertThat(employer.getName()).isEqualTo("Karim Transport");
        assertThat(employer.getContactPhone()).isEqualTo("01712345678");
        assertThat(employer.getTrustScore()).isEqualTo(Employer.TRUST_UNVERIFIED);
        assertThat(employer.toSummary().verified()).isFalse();
    }

    @Test
    void uploadingTheDocumentSendsTheProfileForReview() {
        Employer employer = pending();
        assertThat(employer.getVerificationStatus()).isEqualTo(VerificationStatus.PENDING);
        assertThat(employer.getSubmittedAt()).isEqualTo(NOW);
        assertThat(employer.missingForReview()).isEmpty();
    }

    @Test
    void anAdminApprovesAPendingProfileAndTheEmployerGetsTheBadge() {
        Employer employer = pending();
        employer.approve(ADMIN, "All good", NOW);
        assertThat(employer.getVerificationStatus()).isEqualTo(VerificationStatus.VERIFIED);
        assertThat(employer.getVerifiedBy()).isEqualTo(ADMIN);
        assertThat(employer.getVerifiedAt()).isEqualTo(NOW);
        assertThat(employer.getVerificationNote()).isEqualTo("All good");
        assertThat(employer.getTrustScore()).isEqualTo(Employer.TRUST_VERIFIED);
        assertThat(employer.toSummary().verified()).isTrue();
    }

    @Test
    void aRejectionNeedsAReasonThatTheEmployerSees() {
        Employer employer = pending();
        assertThatThrownBy(() -> employer.reject(ADMIN, "  ", NOW))
                .isInstanceOf(ApiException.class).hasMessage("employer.reject.reason-required");
        assertThat(employer.getVerificationStatus()).isEqualTo(VerificationStatus.PENDING);

        employer.reject(ADMIN, "The licence is not readable", NOW);
        assertThat(employer.getVerificationStatus()).isEqualTo(VerificationStatus.REJECTED);
        assertThat(employer.getVerificationNote()).isEqualTo("The licence is not readable");
        assertThat(employer.toSummary().verified()).isFalse();
    }

    @Test
    void aRejectedEmployerFixesTheProfileAndGoesBackToPending() {
        Employer employer = pending();
        employer.reject(ADMIN, "Address incomplete", NOW);
        employer.updateDetails(details("Karim Transport"), NOW.plusSeconds(60));
        assertThat(employer.getVerificationStatus()).isEqualTo(VerificationStatus.PENDING);
        assertThat(employer.getVerificationNote()).isNull();
        assertThat(employer.getSubmittedAt()).isEqualTo(NOW.plusSeconds(60));
    }

    @Test
    void changingTheBusinessNameAfterApprovalNeedsAnotherReview() {
        Employer employer = pending();
        employer.approve(ADMIN, null, NOW);
        employer.updateDetails(details("Karim Transport"), NOW);   // same name: stays verified
        assertThat(employer.getVerificationStatus()).isEqualTo(VerificationStatus.VERIFIED);
        employer.updateDetails(details("Karim Logistics"), NOW);   // new name: back to review, badge gone
        assertThat(employer.getVerificationStatus()).isEqualTo(VerificationStatus.PENDING);
        assertThat(employer.getTrustScore()).isEqualTo(Employer.TRUST_UNVERIFIED);
        assertThat(employer.toSummary().verified()).isFalse();
    }

    @Test
    void aNewDocumentAfterApprovalNeedsAnotherReviewAndReturnsTheOldKey() {
        Employer employer = pending();
        employer.approve(ADMIN, null, NOW);
        String replaced = employer.attachDocument("document-b.pdf", "nid.pdf", Employer.DocumentType.NATIONAL_ID, NOW);
        assertThat(replaced).isEqualTo("document-a.pdf");
        assertThat(employer.getVerificationStatus()).isEqualTo(VerificationStatus.PENDING);
        assertThat(employer.getDocumentType()).isEqualTo(Employer.DocumentType.NATIONAL_ID);
    }

    @Test
    void refusedMoves() {
        Employer unverified = Employer.create(UUID.randomUUID(), details("Karim Transport"), NOW);
        assertThatThrownBy(() -> unverified.approve(ADMIN, null, NOW)).hasMessage("employer.status.invalid-move");
        assertThatThrownBy(() -> unverified.submit(NOW)).hasMessage("employer.incomplete");   // no document yet

        Employer pending = pending();
        assertThatThrownBy(() -> pending.submit(NOW)).hasMessage("employer.already-pending");

        Employer verified = pending();
        verified.approve(ADMIN, null, NOW);
        assertThatThrownBy(() -> verified.approve(ADMIN, null, NOW)).hasMessage("employer.status.invalid-move");
        assertThatThrownBy(() -> verified.reject(ADMIN, "late", NOW)).hasMessage("employer.status.invalid-move");
        assertThatThrownBy(() -> verified.submit(NOW)).hasMessage("employer.already-verified");
    }

    @Test
    void theStatusTableMatchesTheFlow() {
        assertThat(VerificationStatus.UNVERIFIED.canMoveTo(VerificationStatus.PENDING)).isTrue();
        assertThat(VerificationStatus.UNVERIFIED.canMoveTo(VerificationStatus.VERIFIED)).isFalse();
        assertThat(VerificationStatus.PENDING.canMoveTo(VerificationStatus.VERIFIED)).isTrue();
        assertThat(VerificationStatus.PENDING.canMoveTo(VerificationStatus.REJECTED)).isTrue();
        assertThat(VerificationStatus.REJECTED.canMoveTo(VerificationStatus.VERIFIED)).isFalse();
        assertThat(VerificationStatus.VERIFIED.canMoveTo(VerificationStatus.REJECTED)).isFalse();
    }
}
