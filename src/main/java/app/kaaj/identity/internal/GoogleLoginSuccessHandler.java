package app.kaaj.identity.internal;

import java.io.IOException;

import app.kaaj.identity.Role;
import app.kaaj.shared.ApiException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

@Component
class GoogleLoginSuccessHandler implements AuthenticationSuccessHandler {
    static final String ROLE_ATTRIBUTE = "kaaj.signup.role";

    private final AuthService auth;
    private final SessionSignIn sessions;
    private final String afterLoginUrl;
    private final String loginUrl;

    GoogleLoginSuccessHandler(AuthService auth, SessionSignIn sessions,
                              @Value("${kaaj.web.after-login-url}") String afterLoginUrl,
                              @Value("${kaaj.web.login-url}") String loginUrl) {
        this.auth = auth; this.sessions = sessions;
        this.afterLoginUrl = afterLoginUrl; this.loginUrl = loginUrl;
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest req, HttpServletResponse res, Authentication authentication)
            throws IOException {
        OAuth2User google = (OAuth2User) authentication.getPrincipal();
        boolean verified = Boolean.TRUE.equals(google.getAttribute("email_verified"));
        HttpSession session = req.getSession(false);
        Role role = session == null ? null : (Role) session.getAttribute(ROLE_ATTRIBUTE);
        try {
            AppUser user = auth.signInWithGoogle(google.getAttribute("sub"), google.getAttribute("email"), verified, role);
            sessions.signIn(user, req, res);   // replace Google's login with a normal Kaaj session
            res.sendRedirect(afterLoginUrl);
        } catch (ApiException e) {
            SecurityContextHolder.clearContext();
            if (req.getSession(false) != null) req.getSession(false).invalidate();
            res.sendRedirect(loginUrl + "?error=" + e.code());
        }
    }
}