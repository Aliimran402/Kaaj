package app.kaaj.identity.internal;

import java.util.Collection;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import app.kaaj.identity.UserDirectory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
class JpaUserDirectory implements UserDirectory {
    private final AppUserRepository users;

    JpaUserDirectory(AppUserRepository users) { this.users = users; }

    @Override
    public Map<UUID, String> emailsOf(Collection<UUID> userIds) {
        if (userIds.isEmpty()) return Map.of();
        return users.findAllById(userIds).stream().collect(Collectors.toMap(AppUser::getId, AppUser::getEmail));
    }
}
