package app.kaaj.identity.internal;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Component;

@Component
class CodeMailer {
    private static final Logger log = LoggerFactory.getLogger(CodeMailer.class);
    private final ObjectProvider<JavaMailSender> mail;
    private final boolean logOnly;
    private final String from;

    CodeMailer(ObjectProvider<JavaMailSender> mail,
               @Value("${kaaj.mail.log-only:false}") boolean logOnly,
               @Value("${spring.mail.username:}") String from) {
        this.mail = mail; this.logOnly = logOnly; this.from = from;
    }

    void sendCode(String to, String code) {
        if (logOnly) {
            log.info("[DEV EMAIL] code for {}: {}", to, code);
            return;
        }
        SimpleMailMessage m = new SimpleMailMessage();
        m.setFrom(from);
        m.setTo(to);
        m.setSubject("Kaaj: আপনার কোড / your code " + code);
        m.setText("আপনার Kaaj কোড: " + code + " (১০ মিনিট কাজ করবে)\n\nYour Kaaj code: " + code + " (valid for 10 minutes)");
        mail.getObject().send(m);
    }
}