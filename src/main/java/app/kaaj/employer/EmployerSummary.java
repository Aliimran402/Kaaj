package app.kaaj.employer;

import java.util.UUID;

/** What other modules may know about an employer: enough for a job card, the badge and matching. */
public record EmployerSummary(
        UUID id,
        UUID ownerId,
        String name,
        EmployerKind kind,
        String address,
        VerificationStatus status,
        float trustScore) {

    /** Shows the "Verified" badge on the employer's job posts. */
    public boolean verified() {
        return status == VerificationStatus.VERIFIED;
    }
}
