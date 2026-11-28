package app.kaaj.employer.internal;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import app.kaaj.employer.VerificationStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/** Model (data access) for the {@code employer} table. */
interface EmployerRepository extends JpaRepository<Employer, UUID> {

    Optional<Employer> findByOwnerId(UUID ownerId);

    long countByVerificationStatus(VerificationStatus status);

    /**
     * Reads and locks the row (SELECT … FOR UPDATE) until the transaction ends. Two admins deciding at once, or an
     * admin deciding while the employer edits, then run one after the other, and the second sees the new status.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select e from Employer e where e.id = :id")
    Optional<Employer> lockById(@Param("id") UUID id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select e from Employer e where e.ownerId = :ownerId")
    Optional<Employer> lockByOwnerId(@Param("ownerId") UUID ownerId);

    /** The admin queue, first page: oldest submission first. */
    @Query("""
            select e from Employer e
            where e.verificationStatus = :status
            order by e.submittedAt asc, e.id asc
            """)
    List<Employer> queueFirstPage(@Param("status") VerificationStatus status, Pageable page);

    /** The admin queue after a cursor (keyset pagination on submitted_at, id: no rows skipped or repeated). */
    @Query("""
            select e from Employer e
            where e.verificationStatus = :status
              and (e.submittedAt > :at or (e.submittedAt = :at and e.id > :id))
            order by e.submittedAt asc, e.id asc
            """)
    List<Employer> queueAfter(@Param("status") VerificationStatus status, @Param("at") Instant at,
                              @Param("id") UUID id, Pageable page);
}
