package app.kaaj.identity.internal;

import java.util.Locale;
import java.util.Optional;

import app.kaaj.identity.Role;
import app.kaaj.shared.ApiException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(noRollbackFor = ApiException.class)
class AuthService {
    private final AppUserRepository users;
    private final EmailCodeService codes;
    private final PasswordEncoder encoder;

    AuthService(AppUserRepository users, EmailCodeService codes, PasswordEncoder encoder) {
        this.users = users; this.codes = codes; this.encoder = encoder;
    }

    static String normalize(String email) { return email.trim().toLowerCase(Locale.ROOT); }

    void register(String rawEmail, String password, Role role) {
        if (role == null || role == Role.ADMIN) throw ApiException.badRequest("auth.role.invalid");
        String email = normalize(rawEmail);
        Optional<AppUser> existing = users.findByEmail(email);
        if (existing.isPresent() && existing.get().isEmailVerified()) {
            return; // already registered: say nothing, so nobody learns which emails have accounts
        }
        AppUser user = existing.orElseGet(() -> AppUser.create(email, role));
        user.changePassword(encoder.encode(password));
        user.changeRole(role);
        users.save(user);
        codes.send(email, EmailCodeService.VERIFY_EMAIL);
    }

    AppUser verifyEmail(String rawEmail, String code) {
        String email = normalize(rawEmail);
        codes.verify(email, EmailCodeService.VERIFY_EMAIL, code);
        AppUser user = users.findByEmail(email).orElseThrow(() -> ApiException.badRequest("auth.code.invalid"));
        user.markEmailVerified();
        if (!user.isActive()) throw ApiException.forbidden("auth.suspended");
        return user;
    }

    void resendCode(String rawEmail) {
        String email = normalize(rawEmail);
        users.findByEmail(email).filter(u -> !u.isEmailVerified())
                .ifPresent(u -> codes.send(email, EmailCodeService.VERIFY_EMAIL));
    }

    @Transactional(readOnly = true)
    AppUser login(String rawEmail, String password) {
        AppUser user = users.findByEmail(normalize(rawEmail)).orElse(null);
        if (user == null || user.getPasswordHash() == null || !encoder.matches(password, user.getPasswordHash())) {
            throw ApiException.unauthorized("auth.login.failed");
        }
        if (!user.isEmailVerified()) throw ApiException.forbidden("auth.login.unverified");
        if (!user.isActive()) throw ApiException.forbidden("auth.suspended");
        return user;
    }

    /** Find by Google ID, else by email (link Google), else create with the role chosen at sign-up. */
    AppUser signInWithGoogle(String sub, String rawEmail, boolean verified, Role chosenRole) {
        if (sub == null || rawEmail == null || !verified) throw ApiException.badRequest("auth.google.email-not-verified");
        String email = normalize(rawEmail);
        AppUser user = users.findByGoogleSub(sub).or(() -> users.findByEmail(email)).orElse(null);
        if (user == null) {
            if (chosenRole == null || chosenRole == Role.ADMIN) throw ApiException.badRequest("auth.google.choose-role");
            user = users.save(AppUser.create(email, chosenRole));
        }
        user.linkGoogle(sub);
        if (!user.isActive()) throw ApiException.forbidden("auth.suspended");
        return user;
    }
}