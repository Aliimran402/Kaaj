package app.kaaj.employer;

import java.time.Instant;
import java.util.UUID;

/** Published when an admin approves an employer (for example, the job module can then publish waiting drafts). */
public record EmployerVerified(UUID employerId, UUID ownerId, Instant at) {}
