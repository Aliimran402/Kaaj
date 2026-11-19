package app.kaaj.identity.internal;

import java.io.IOException;
import java.util.Map;
import java.util.UUID;

import app.kaaj.identity.Role;
import app.kaaj.identity.UserStatus;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
class AuthController {

    record RegisterRequest(@NotBlank @Email String email,
                           @NotBlank @Size(min = 8, max = 64) String password,
                           @NotNull Role role) {}
    record VerifyRequest(@NotBlank @Email String email, @NotBlank @Pattern(regexp = "\\d{6}") String code) {}
    record LoginRequest(@NotBlank @Email String email, @NotBlank String password) {}
    record EmailRequest(@NotBlank @Email String email) {}
    record MeResponse(UUID id, String email, Role role, String locale, UserStatus status) {
        static MeResponse of(AppUser u) {
            return new MeResponse(u.getId(), u.getEmail(), u.getRole(), u.getLocale(), u.getStatus());
        }
    }

    private final AuthService auth;
    private final SessionSignIn sessions;

    AuthController(AuthService auth, SessionSignIn sessions) {
        this.auth = auth;
        this.sessions = sessions;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.ACCEPTED)
    Map<String, String> register(@Valid @RequestBody RegisterRequest body) {
        auth.register(body.email(), body.password(), body.role());
        return Map.of("status", "CODE_SENT");
    }

    @PostMapping("/verify-email")
    MeResponse verify(@Valid @RequestBody VerifyRequest body, HttpServletRequest req, HttpServletResponse res) {
        AppUser user = auth.verifyEmail(body.email(), body.code());
        sessions.signIn(user, req, res);
        return MeResponse.of(user);
    }

    @PostMapping("/resend-code")
    @ResponseStatus(HttpStatus.ACCEPTED)
    Map<String, String> resend(@Valid @RequestBody EmailRequest body) {
        auth.resendCode(body.email());
        return Map.of("status", "CODE_SENT");
    }

    @PostMapping("/login")
    MeResponse login(@Valid @RequestBody LoginRequest body, HttpServletRequest req, HttpServletResponse res) {
        AppUser user = auth.login(body.email(), body.password());
        sessions.signIn(user, req, res);
        return MeResponse.of(user);
    }

    /** Sign-up page: /api/v1/auth/google?role=SEEKER  ·  Login page: /api/v1/auth/google */
    @GetMapping("/google")
    void google(@RequestParam(required = false) Role role, HttpServletRequest req, HttpServletResponse res)
            throws IOException {
        if (role != null && role != Role.ADMIN) {
            req.getSession(true).setAttribute(GoogleLoginSuccessHandler.ROLE_ATTRIBUTE, role);
        }
        res.sendRedirect("/oauth2/authorization/google");
    }
}