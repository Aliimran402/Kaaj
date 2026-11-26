package app.kaaj.identity.internal;

import java.time.Instant;
import java.util.UUID;

import app.kaaj.identity.KaajUser;
import app.kaaj.identity.Role;
import app.kaaj.identity.UserStatus;
import app.kaaj.shared.UuidV7;
import jakarta.persistence.*;

@Entity
@Table(name = "app_user")
class AppUser {
    @Id private UUID id;
    private String email;
    private boolean emailVerified;
    private String passwordHash;
    private String googleSub;
    @Enumerated(EnumType.STRING) private Role role;
    private String locale;
    @Enumerated(EnumType.STRING) private UserStatus status;
    private Instant createdAt;

    protected AppUser() {}

    static AppUser create(String email, Role role) {
        AppUser u = new AppUser();
        u.id = UuidV7.next();
        u.email = email;
        u.role = role;
        u.locale = "bn";
        u.status = UserStatus.ACTIVE;
        u.createdAt = Instant.now();
        return u;
    }

    KaajUser toPrincipal() { return new KaajUser(id, email, role); }
    void markEmailVerified() { emailVerified = true; }
    void linkGoogle(String sub) { googleSub = sub; emailVerified = true; }
    void changePassword(String hash) { passwordHash = hash; }
    void changeRole(Role r) { role = r; }
    boolean isActive() { return status == UserStatus.ACTIVE; }

    UUID getId() { return id; }
    String getEmail() { return email; }
    boolean isEmailVerified() { return emailVerified; }
    String getPasswordHash() { return passwordHash; }
    Role getRole() { return role; }
    String getLocale() { return locale; }
    UserStatus getStatus() { return status; }
}