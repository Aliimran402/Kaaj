package app.kaaj.employer;

import java.time.Instant;
import java.util.UUID;

/** Published when an admin rejects an employer; {@code reason} is what the employer sees. */
public record EmployerRejected(UUID employerId, UUID ownerId, String reason, Instant at) {}
