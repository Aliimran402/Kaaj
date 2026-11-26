package app.kaaj.identity.internal;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.*;

@Entity
@Table(name = "email_code")
class EmailCode {
    @Id private UUID id;
    private String email;
    private String purpose;
    private String codeHash;
    private Instant expiresAt;
    private int attempts;
    private Instant usedAt;
    private Instant createdAt;

    protected EmailCode() {}

    EmailCode(UUID id, String email, String purpose, String codeHash, Instant expiresAt, Instant createdAt) {
        this.id = id; this.email = email; this.purpose = purpose;
        this.codeHash = codeHash; this.expiresAt = expiresAt; this.createdAt = createdAt;
    }

    void addAttempt() { attempts++; }
    void markUsed(Instant when) { usedAt = when; }
    String codeHash() { return codeHash; }
    Instant expiresAt() { return expiresAt; }
    int attempts() { return attempts; }
    Instant usedAt() { return usedAt; }
    Instant createdAt() { return createdAt; }
}