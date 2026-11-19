package app.kaaj.identity.internal;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.HexFormat;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

import app.kaaj.shared.ApiException;
import app.kaaj.shared.UuidV7;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
class EmailCodeService {
    static final String VERIFY_EMAIL = "VERIFY_EMAIL";
    private static final int MAX_ATTEMPTS = 5;

    private final SecureRandom random = new SecureRandom();
    private final EmailCodeRepository codes;
    private final CodeMailer mailer;
    private final byte[] secret;

    EmailCodeService(EmailCodeRepository codes, CodeMailer mailer, @Value("${kaaj.codes.secret}") String secret) {
        if (secret == null || secret.length() < 16) {
            throw new IllegalStateException("Set KAAJ_CODE_SECRET in .env (16+ characters)");
        }
        this.codes = codes;
        this.mailer = mailer;
        this.secret = secret.getBytes(StandardCharsets.UTF_8);
    }

    @Transactional
    void send(String email, String purpose) {
        Instant now = Instant.now();
        codes.findFirstByEmailAndPurposeOrderByCreatedAtDesc(email, purpose).ifPresent(last -> {
            long wait = Duration.between(now, last.createdAt().plusSeconds(60)).toSeconds();
            if (wait > 0) throw ApiException.tooMany("auth.code.too-soon", wait);
        });
        if (codes.countByEmailAndCreatedAtAfter(email, now.minus(Duration.ofHours(1))) >= 5) {
            throw ApiException.tooMany("auth.code.too-many");
        }
        String code = "%06d".formatted(random.nextInt(1_000_000));
        codes.save(new EmailCode(UuidV7.next(), email, purpose, hash(email, purpose, code),
                now.plus(Duration.ofMinutes(10)), now));
        mailer.sendCode(email, code);
    }

    // noRollbackFor: a wrong try must still be counted even though we throw an error
    @Transactional(noRollbackFor = ApiException.class)
    void verify(String email, String purpose, String code) {
        Instant now = Instant.now();
        EmailCode c = codes.findFirstByEmailAndPurposeOrderByCreatedAtDesc(email, purpose)
                .orElseThrow(() -> ApiException.badRequest("auth.code.invalid"));
        if (c.usedAt() != null) throw ApiException.badRequest("auth.code.invalid");
        if (!c.expiresAt().isAfter(now)) throw ApiException.badRequest("auth.code.expired");
        if (c.attempts() >= MAX_ATTEMPTS) throw ApiException.badRequest("auth.code.locked");
        c.addAttempt();
        boolean same = MessageDigest.isEqual(
                c.codeHash().getBytes(StandardCharsets.UTF_8),
                hash(email, purpose, code).getBytes(StandardCharsets.UTF_8));
        if (!same) {
            int left = MAX_ATTEMPTS - c.attempts();
            throw left > 0 ? ApiException.badRequest("auth.code.wrong", left) : ApiException.badRequest("auth.code.locked");
        }
        c.markUsed(now);
    }

    String hash(String email, String purpose, String code) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret, "HmacSHA256"));
            return HexFormat.of().formatHex(mac.doFinal((email + "|" + purpose + "|" + code).getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }
}