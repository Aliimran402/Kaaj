package app.kaaj.shared;

import java.security.SecureRandom;
import java.util.UUID;

public final class UuidV7 {
    private static final SecureRandom RANDOM = new SecureRandom();
    private UuidV7() {}

    public static UUID next() {
        long millis = System.currentTimeMillis();
        long msb = (millis << 16) | (0x7L << 12) | RANDOM.nextInt(1 << 12);
        long lsb = (RANDOM.nextLong() & 0x3FFF_FFFF_FFFF_FFFFL) | 0x8000_0000_0000_0000L;
        return new UUID(msb, lsb);
    }
}