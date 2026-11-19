package app.kaaj.identity;

import java.util.Optional;
import java.util.UUID;

import app.kaaj.shared.ApiException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
public class CurrentUser {
    public Optional<KaajUser> get() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null && auth.getPrincipal() instanceof KaajUser u ? Optional.of(u) : Optional.empty();
    }

    public UUID id() {
        return get().orElseThrow(() -> ApiException.unauthorized("auth.required")).id();
    }

    public boolean has(Role role) {
        return get().map(u -> u.role() == role).orElse(false);
    }
}