package app.kaaj.identity;

import java.util.Collection;
import java.util.Map;
import java.util.UUID;

/** What other modules may read about user accounts. */
public interface UserDirectory {

    /** The email of each of these accounts, by user id. Unknown ids are left out. */
    Map<UUID, String> emailsOf(Collection<UUID> userIds);
}
