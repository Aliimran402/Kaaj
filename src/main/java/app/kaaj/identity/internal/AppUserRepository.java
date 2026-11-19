package app.kaaj.identity.internal;

import java.util.Optional;
import java.util.UUID;

import app.kaaj.identity.Role;
import org.springframework.data.jpa.repository.JpaRepository;

interface AppUserRepository extends JpaRepository<AppUser, UUID> {
    Optional<AppUser> findByEmail(String email);
    Optional<AppUser> findByGoogleSub(String googleSub);
    boolean existsByRole(Role role);
}