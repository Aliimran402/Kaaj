package app.kaaj.identity;

import java.util.Map;
import java.util.UUID;

/** Writes {@code audit_log} rows (table from V1) for admin actions, for example employer approvals and rejections. */
public interface AuditLog {

    /**
     * Records the action in the caller's transaction, so the action and its log row are saved together.
     *
     * @param actorId the admin (or user) who acted
     * @param action  for example {@code EMPLOYER_VERIFIED}
     * @param target  what was acted on, for example {@code employer:0193...}
     * @param details a few extra facts, stored as JSON
     */
    void record(UUID actorId, String action, String target, Map<String, ?> details);
}
