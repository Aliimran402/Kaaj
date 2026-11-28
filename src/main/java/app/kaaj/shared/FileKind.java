package app.kaaj.shared;

import java.util.Map;

/**
 * The kinds of file Kaaj stores, with the types they allow (checked by content, not by name) and their size limit.
 * The map value is the file extension used in the key. Add a kind here when a feature needs a new one.
 */
public enum FileKind {

    /** Verification documents: trade licences, national IDs, certificates. */
    DOCUMENT("document", 3 * 1024 * 1024, Map.of(
            "image/jpeg", "jpg",
            "image/png", "png",
            "application/pdf", "pdf"));

    private final String folder;
    private final long maxBytes;
    private final Map<String, String> extensionByType;

    FileKind(String folder, long maxBytes, Map<String, String> extensionByType) {
        this.folder = folder;
        this.maxBytes = maxBytes;
        this.extensionByType = extensionByType;
    }

    public String folder() { return folder; }
    public long maxBytes() { return maxBytes; }
    public long maxMegabytes() { return maxBytes / (1024 * 1024); }
    public boolean allows(String mediaType) { return extensionByType.containsKey(mediaType); }
    public String extensionFor(String mediaType) { return extensionByType.get(mediaType); }
}
