package app.kaaj.identity.internal;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

interface EmailCodeRepository extends JpaRepository<EmailCode, UUID> {
    Optional<EmailCode> findFirstByEmailAndPurposeOrderByCreatedAtDesc(String email, String purpose);
    long countByEmailAndCreatedAtAfter(String email, Instant after);
}