package app.kaaj.shared.internal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;

import javax.imageio.ImageIO;

import app.kaaj.shared.ApiException;
import app.kaaj.shared.FileKind;
import app.kaaj.shared.FileStore;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.http.HttpStatus;

class DiskFileStoreTest {
    @TempDir Path dir;

    static byte[] png() throws IOException {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        ImageIO.write(new BufferedImage(40, 30, BufferedImage.TYPE_INT_RGB), "png", out);
        return out.toByteArray();
    }

    static final byte[] PDF = "%PDF-1.7\n1 0 obj << >> endobj\n%%EOF\n".getBytes(StandardCharsets.US_ASCII);

    @Test
    void theTypeComesFromTheFileNotFromItsName() throws IOException {
        assertThat(DiskFileStore.detect(png())).isEqualTo("image/png");
        assertThat(DiskFileStore.detect(PDF)).isEqualTo("application/pdf");
        assertThat(DiskFileStore.detect(new byte[] {(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, 0})).isEqualTo("image/jpeg");
        assertThat(DiskFileStore.detect("hello".getBytes(StandardCharsets.UTF_8))).isNull();
    }

    @Test
    void storesOpensAndDeletesADocument() throws IOException {
        DiskFileStore store = new DiskFileStore(dir.toString());
        FileStore.StoredFile stored = store.store(FileKind.DOCUMENT, PDF, "C:\\Users\\me\\licence.pdf");

        assertThat(stored.key()).matches("document-[0-9a-f-]{36}\\.pdf");
        assertThat(stored.mediaType()).isEqualTo("application/pdf");
        assertThat(stored.originalName()).isEqualTo("licence.pdf");
        assertThat(dir.resolve("document").resolve(stored.key())).exists();

        FileStore.FileContent content = store.open(stored.key()).orElseThrow();
        assertThat(content.mediaType()).isEqualTo("application/pdf");
        assertThat(content.bytes()).isEqualTo(PDF);

        store.delete(stored.key());
        assertThat(store.open(stored.key())).isEmpty();
    }

    @Test
    void imagesAreReencodedSoHiddenDataIsNotKept() throws IOException {
        DiskFileStore store = new DiskFileStore(dir.toString());
        byte[] original = png();
        FileStore.StoredFile stored = store.store(FileKind.DOCUMENT, original, "nid.png");
        byte[] saved = Files.readAllBytes(dir.resolve("document").resolve(stored.key()));
        assertThat(DiskFileStore.detect(saved)).isEqualTo("image/png");
        assertThat(ImageIO.read(new java.io.ByteArrayInputStream(saved)).getWidth()).isEqualTo(40);
    }

    @Test
    void refusesOtherTypesEmptyFilesAndFilesThatAreTooLarge() {
        DiskFileStore store = new DiskFileStore(dir.toString());
        assertThatThrownBy(() -> store.store(FileKind.DOCUMENT, "MZ fake exe".getBytes(StandardCharsets.UTF_8), "licence.png"))
                .isInstanceOf(ApiException.class).hasMessage("file.wrong-type");
        assertThatThrownBy(() -> store.store(FileKind.DOCUMENT, new byte[0], "x.pdf")).hasMessage("file.empty");

        byte[] big = new byte[(int) FileKind.DOCUMENT.maxBytes() + 1];
        System.arraycopy(PDF, 0, big, 0, PDF.length);
        assertThatThrownBy(() -> store.store(FileKind.DOCUMENT, big, "big.pdf"))
                .isInstanceOfSatisfying(ApiException.class, e -> {
                    assertThat(e.code()).isEqualTo("file.too-large");
                    assertThat(e.status()).isEqualTo(HttpStatus.CONTENT_TOO_LARGE);
                    assertThat(e.args()).containsExactly(3L);
                });
    }

    @Test
    void aFileThatOnlyStartsLikeAnImageIsRefused() {
        DiskFileStore store = new DiskFileStore(dir.toString());
        byte[] fakePng = {(byte) 0x89, 'P', 'N', 'G', '\r', '\n', 0x1A, '\n', 1, 2, 3};
        assertThatThrownBy(() -> store.store(FileKind.DOCUMENT, fakePng, "x.png")).hasMessage("file.unreadable-image");
    }

    @Test
    void keysCanNeverLeaveTheStoreFolder() {
        DiskFileStore store = new DiskFileStore(dir.toString());
        assertThat(store.open("../../etc/passwd")).isEmpty();
        assertThat(store.open("document-../../x.pdf")).isEmpty();
        assertThat(store.open(null)).isEmpty();
    }

    @Test
    void cleansUploadNames() {
        assertThat(DiskFileStore.cleanName("/tmp/a\"b;c.pdf")).isEqualTo("a_b_c.pdf");
        assertThat(DiskFileStore.cleanName("  ")).isEqualTo("file");
        assertThat(DiskFileStore.cleanName(null)).isEqualTo("file");
    }
}
