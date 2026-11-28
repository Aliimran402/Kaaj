package app.kaaj.shared.internal;

import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.util.Arrays;
import java.util.Iterator;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import javax.imageio.ImageIO;
import javax.imageio.ImageReader;
import javax.imageio.stream.ImageInputStream;

import app.kaaj.shared.ApiException;
import app.kaaj.shared.FileKind;
import app.kaaj.shared.FileStore;
import app.kaaj.shared.UuidV7;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Saves files on the server's disk under {@code kaaj.files.dir} (default {@code data/uploads}, git-ignored),
 * one folder per {@link FileKind}. A key looks like {@code document-0193c8b0-....pdf}.
 */
@Component
class DiskFileStore implements FileStore {

    private static final Pattern KEY = Pattern.compile(
            "^(document)-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\\.(jpg|png|pdf)$");

    private static final Map<String, String> TYPE_BY_EXTENSION = Map.of(
            "jpg", "image/jpeg",
            "png", "image/png",
            "pdf", "application/pdf");

    /** Images larger than this many pixels are refused before decoding them (protects the server's memory). */
    private static final long MAX_PIXELS = 40_000_000L;

    private final Path root;

    DiskFileStore(@Value("${kaaj.files.dir:data/uploads}") String dir) {
        this.root = Path.of(dir).toAbsolutePath().normalize();
    }

    @Override
    public StoredFile store(FileKind kind, byte[] content, String originalName) {
        if (content == null || content.length == 0) throw ApiException.badRequest("file.empty");
        if (content.length > kind.maxBytes()) throw ApiException.tooLarge("file.too-large", kind.maxMegabytes());
        String mediaType = detect(content);   // from the file's first bytes, never from its name
        if (mediaType == null || !kind.allows(mediaType)) throw ApiException.badRequest("file.wrong-type");

        byte[] toSave = mediaType.startsWith("image/") ? reencode(content, mediaType) : content;
        String key = kind.folder() + "-" + UuidV7.next() + "." + kind.extensionFor(mediaType);
        try {
            Path folder = Files.createDirectories(root.resolve(kind.folder()));
            Files.write(folder.resolve(key), toSave, StandardOpenOption.CREATE_NEW, StandardOpenOption.WRITE);
        } catch (IOException e) {
            throw new UncheckedIOException("Could not save the file", e);
        }
        return new StoredFile(key, mediaType, toSave.length, cleanName(originalName));
    }

    @Override
    public Optional<FileContent> open(String key) {
        return pathOf(key).filter(Files::isRegularFile).map(path -> {
            try {
                String extension = key.substring(key.lastIndexOf('.') + 1);
                return new FileContent(key, TYPE_BY_EXTENSION.get(extension), Files.readAllBytes(path));
            } catch (IOException e) {
                throw new UncheckedIOException("Could not read the file", e);
            }
        });
    }

    @Override
    public void delete(String key) {
        pathOf(key).ifPresent(path -> {
            try {
                Files.deleteIfExists(path);
            } catch (IOException e) {
                throw new UncheckedIOException("Could not delete the file", e);
            }
        });
    }

    /** Only well-formed keys map to a path, so a key can never point outside the store (no "../"). */
    private Optional<Path> pathOf(String key) {
        if (key == null) return Optional.empty();
        Matcher matcher = KEY.matcher(key);
        if (!matcher.matches()) return Optional.empty();
        return Optional.of(root.resolve(matcher.group(1)).resolve(key));
    }

    private static final byte[] PDF = {'%', 'P', 'D', 'F', '-'};
    private static final byte[] PNG = {(byte) 0x89, 'P', 'N', 'G', '\r', '\n', 0x1A, '\n'};
    private static final byte[] JPEG = {(byte) 0xFF, (byte) 0xD8, (byte) 0xFF};

    /** The file's real type from its "magic bytes", or null when it is none of the types Kaaj stores. */
    static String detect(byte[] content) {
        if (startsWith(content, PDF)) return "application/pdf";
        if (startsWith(content, PNG)) return "image/png";
        if (startsWith(content, JPEG)) return "image/jpeg";
        return null;
    }

    private static boolean startsWith(byte[] content, byte[] prefix) {
        return content.length >= prefix.length && Arrays.equals(content, 0, prefix.length, prefix, 0, prefix.length);
    }

    /**
     * Decodes and re-encodes an image. That keeps only the pixels, so hidden data such as the GPS location where a
     * phone photo was taken is not stored, and a file that only pretends to be an image is refused.
     */
    static byte[] reencode(byte[] content, String mediaType) {
        try (ImageInputStream input = ImageIO.createImageInputStream(new ByteArrayInputStream(content))) {
            Iterator<ImageReader> readers = input == null ? null : ImageIO.getImageReaders(input);
            if (readers == null || !readers.hasNext()) throw ApiException.badRequest("file.unreadable-image");
            ImageReader reader = readers.next();
            BufferedImage image;
            try {
                reader.setInput(input, true, true);
                if ((long) reader.getWidth(0) * reader.getHeight(0) > MAX_PIXELS) {
                    throw ApiException.badRequest("file.image-too-large");
                }
                image = reader.read(0);
            } finally {
                reader.dispose();
            }
            String format = "image/png".equals(mediaType) ? "png" : "jpg";
            if ("jpg".equals(format) && image.getColorModel().hasAlpha()) {
                BufferedImage rgb = new BufferedImage(image.getWidth(), image.getHeight(), BufferedImage.TYPE_INT_RGB);
                Graphics2D graphics = rgb.createGraphics();
                graphics.drawImage(image, 0, 0, Color.WHITE, null);
                graphics.dispose();
                image = rgb;
            }
            ByteArrayOutputStream out = new ByteArrayOutputStream(content.length);
            if (!ImageIO.write(image, format, out)) throw ApiException.badRequest("file.unreadable-image");
            return out.toByteArray();
        } catch (IOException e) {
            // Broken or unusual images (for example CMYK JPEGs) are refused rather than stored as they are.
            throw ApiException.badRequest("file.unreadable-image");
        }
    }

    /** "C:\\Users\\me\\licence.pdf" → "licence.pdf", without characters that break a download header. */
    static String cleanName(String name) {
        if (name == null || name.isBlank()) return "file";
        String base = name.replace('\\', '/');
        base = base.substring(base.lastIndexOf('/') + 1).replaceAll("[\\p{Cntrl}\"<>|*?:;]", "_").strip();
        if (base.isEmpty()) return "file";
        return base.length() > 120 ? base.substring(base.length() - 120) : base;
    }
}
