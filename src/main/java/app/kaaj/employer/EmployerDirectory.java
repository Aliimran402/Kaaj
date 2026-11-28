package app.kaaj.employer;

import java.util.Collection;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

/**
 * The employer module's public API. Job posts (M1-4) read the employer through it, so every post can show the
 * employer's name and, when {@link EmployerSummary#verified()}, the "Verified" badge; search and matching use it too.
 */
public interface EmployerDirectory {

    Optional<EmployerSummary> findById(UUID employerId);

    /** The business profile of a user account with the EMPLOYER role, if they have created one. */
    Optional<EmployerSummary> findByOwner(UUID ownerUserId);

    /** Many at once, for a page of job posts: one query instead of one per post. */
    Map<UUID, EmployerSummary> findAllById(Collection<UUID> employerIds);
}
