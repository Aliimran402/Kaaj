package app.kaaj.shared;

import java.util.Optional;

/**
 * Private file storage for uploads. Files are kept under random keys; tables store only the key, never a path.
 * Files are never served directly: the module that owns a file decides who may read it and serves it itself
 * (for example only admins see an employer's trade licence).
 */
public interface FileStore {

    /**
     * Checks the real file type (from its first bytes) and size for {@code kind}, re-encodes images (which also
     * drops hidden metadata such as the GPS location of a phone photo) and saves the file.
     *
     * @throws ApiException 400 when the type isn't allowed, 413 when the file is too large
     */
    StoredFile store(FileKind kind, byte[] content, String originalName);

    Optional<FileContent> open(String key);

    void delete(String key);

    /** A stored file's key, detected type, size and the (cleaned) name it was uploaded with. */
    record StoredFile(String key, String mediaType, long size, String originalName) {}

    /** A file read back from the store. Documents are at most a few MB, so they are read whole. */
    record FileContent(String key, String mediaType, byte[] bytes) {}
}
