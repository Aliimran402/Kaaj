package app.kaaj.identity.internal;

import app.kaaj.identity.Role;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
class AdminBootstrap implements ApplicationRunner {
    private final AppUserRepository users;
    private final PasswordEncoder encoder;
    private final String email;
    private final String password;

    AdminBootstrap(AppUserRepository users, PasswordEncoder encoder,
                   @Value("${kaaj.admin.email}") String email, @Value("${kaaj.admin.password}") String password) {
        this.users = users; this.encoder = encoder; this.email = email; this.password = password;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (users.existsByRole(Role.ADMIN) || email.isBlank() || password.length() < 8) return;
        AppUser admin = AppUser.create(AuthService.normalize(email), Role.ADMIN);
        admin.changePassword(encoder.encode(password));
        admin.markEmailVerified();
        users.save(admin);
    }
}