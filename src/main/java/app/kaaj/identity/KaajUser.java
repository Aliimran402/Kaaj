package app.kaaj.identity;

import java.io.Serializable;
import java.security.Principal;
import java.util.UUID;

public record KaajUser(UUID id, String email, Role role) implements Principal, Serializable {
    @Override
    public String getName() { return id.toString(); }
}