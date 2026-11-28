package app.kaaj.employer.internal;

import java.time.Instant;
import java.util.Collection;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

import app.kaaj.employer.EmployerDirectory;
import app.kaaj.employer.EmployerSummary;
import app.kaaj.shared.ApiException;
import app.kaaj.shared.FileKind;
import app.kaaj.shared.FileStore;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

/** Model: the employer's own business profile and document, and the public {@link EmployerDirectory}. */
@Service
@Transactional
class EmployerProfileService implements EmployerDirectory {
    private final EmployerRepository employers;
    private final FileStore files;

    EmployerProfileService(EmployerRepository employers, FileStore files) {
        this.employers = employers;
        this.files = files;
    }

    @Transactional(readOnly = true)
    Optional<Employer> findOwn(UUID ownerId) {
        return employers.findByOwnerId(ownerId);
    }

    /** Creates the profile the first time, and updates it after that. */
    Employer save(UUID ownerId, Employer.Details details) {
        Instant now = Instant.now();
        Optional<Employer> existing = employers.lockByOwnerId(ownerId);
        if (existing.isPresent()) {
            existing.get().updateDetails(details, now);
            return existing.get();
        }
        return employers.save(Employer.create(ownerId, details, now));
    }

    /** Stores the trade licence or NID and sends the profile for review. */
    Employer uploadDocument(UUID ownerId, byte[] content, String originalName, Employer.DocumentType type) {
        Employer employer = employers.lockByOwnerId(ownerId)
                .orElseThrow(() -> ApiException.conflict("employer.profile.missing"));
        FileStore.StoredFile stored = files.store(FileKind.DOCUMENT, content, originalName);
        String replaced;
        try {
            replaced = employer.attachDocument(stored.key(), stored.originalName(), type, Instant.now());
        } catch (RuntimeException e) {
            files.delete(stored.key());
            throw e;
        }
        deleteUnusedFileAfterTransaction(stored.key(), replaced);
        return employer;
    }

    /** Sends the profile for review again, for example after a rejection. */
    Employer submit(UUID ownerId) {
        Employer employer = employers.lockByOwnerId(ownerId)
                .orElseThrow(() -> ApiException.notFound("employer.profile.missing"));
        employer.submit(Instant.now());
        return employer;
    }

    // ---- EmployerDirectory: the public API for other modules

    @Override
    @Transactional(readOnly = true)
    public Optional<EmployerSummary> findById(UUID employerId) {
        return employers.findById(employerId).map(Employer::toSummary);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<EmployerSummary> findByOwner(UUID ownerUserId) {
        return employers.findByOwnerId(ownerUserId).map(Employer::toSummary);
    }

    @Override
    @Transactional(readOnly = true)
    public Map<UUID, EmployerSummary> findAllById(Collection<UUID> employerIds) {
        return employers.findAllById(employerIds).stream()
                .map(Employer::toSummary)
                .collect(Collectors.toMap(EmployerSummary::id, Function.identity()));
    }

    /** Saved: remove the document it replaced. Not saved (rolled back): remove the new file again. */
    private void deleteUnusedFileAfterTransaction(String newKey, String replacedKey) {
        if (!TransactionSynchronizationManager.isSynchronizationActive()) return;
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCompletion(int status) {
                if (status == STATUS_COMMITTED) {
                    if (replacedKey != null) files.delete(replacedKey);
                } else {
                    files.delete(newKey);
                }
            }
        });
    }
}
