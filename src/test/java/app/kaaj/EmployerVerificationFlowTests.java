package app.kaaj;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.nullValue;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import javax.imageio.ImageIO;

import app.kaaj.employer.EmployerDirectory;
import app.kaaj.employer.EmployerSummary;
import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.testcontainers.junit.jupiter.Testcontainers;

/**
 * Feature M1-3 end to end: the real HTTP API (sessions, CSRF, roles) on a real PostgreSQL started from
 * docker/db/Dockerfile (see {@link TestDatabase}), then a look at the rows in the database.
 * Needs Docker Desktop running; without Docker these tests are skipped, not failed.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Import(TestDatabase.class)
@Testcontainers(disabledWithoutDocker = true)
@TestPropertySource(properties = {
        "DB_PASSWORD=unused-the-test-database-has-its-own",
        "kaaj.codes.secret=test-secret-0123456789abcdef",
        "kaaj.admin.email=" + EmployerVerificationFlowTests.ADMIN_EMAIL,
        "kaaj.admin.password=" + EmployerVerificationFlowTests.ADMIN_PASSWORD,
        "kaaj.mail.log-only=true",
        "kaaj.files.dir=target/test-uploads",
        "spring.docker.compose.enabled=false"
})
class EmployerVerificationFlowTests {
    static final String ADMIN_EMAIL = "admin@test.kaaj";
    static final String ADMIN_PASSWORD = "Admin@12345";
    static final String PASSWORD = "Secret@123";
    static final String PASSWORD_HASH = new BCryptPasswordEncoder().encode(PASSWORD);
    static final String PROFILE = "/api/v1/employer/profile";
    static final String ADMIN = "/api/v1/admin/employers";
    static final Path UPLOADS = Path.of("target/test-uploads/document");

    record Account(UUID id, String email, MockHttpSession session) {}

    @Autowired MockMvc mvc;
    @Autowired JdbcClient jdbc;
    @Autowired EmployerDirectory employers;

    // ------------------------------------------------------------------ the whole feature

    @Test
    void anAdminApprovesAnEmployerAndTheDatabaseShowsIt() throws Exception {
        Account karim = account("EMPLOYER");
        Account admin = signIn(ADMIN_EMAIL, ADMIN_PASSWORD);

        mvc.perform(get(PROFILE).session(karim.session()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("employer.profile.missing"));

        // 1. The business profile: saved, but not verified until an admin has checked a document
        mvc.perform(saveProfile(karim, "Karim Transport"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UNVERIFIED"))
                .andExpect(jsonPath("$.kind").value("SME"))
                .andExpect(jsonPath("$.contactPhone").value("01712345678"))
                .andExpect(jsonPath("$.missing[0]").value("document"))
                .andExpect(jsonPath("$.verified").value(false));

        // 2. The trade licence: the profile goes to the admin's queue
        String uploaded = upload(karim, png("licence.png"), "TRADE_LICENCE")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andExpect(jsonPath("$.hasDocument").value(true))
                .andExpect(jsonPath("$.documentName").value("licence.png"))
                .andReturn().getResponse().getContentAsString();
        UUID employerId = UUID.fromString(JsonPath.read(uploaded, "$.id"));
        String documentUrl = ADMIN + "/" + employerId + "/document";

        mvc.perform(get(ADMIN).param("status", "PENDING").param("size", "100").session(admin.session()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[*].id", hasItem(employerId.toString())));
        mvc.perform(get(ADMIN + "/" + employerId).session(admin.session()))
                .andExpect(jsonPath("$.name").value("Karim Transport"))
                .andExpect(jsonPath("$.ownerEmail").value(karim.email()))
                .andExpect(jsonPath("$.documentType").value("TRADE_LICENCE"))
                .andExpect(jsonPath("$.documentUrl").value(documentUrl));

        // 3. Only admins can open the document
        mvc.perform(get(documentUrl).session(admin.session()))
                .andExpect(status().isOk())
                .andExpect(content().contentType("image/png"));
        mvc.perform(get(documentUrl).session(karim.session())).andExpect(status().isForbidden());

        // 4. The admin approves
        mvc.perform(decide(admin, employerId, "{\"decision\":\"APPROVE\",\"reason\":\"All good\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("VERIFIED"));
        mvc.perform(get(PROFILE).session(karim.session()))
                .andExpect(jsonPath("$.status").value("VERIFIED"))
                .andExpect(jsonPath("$.verified").value(true))
                .andExpect(jsonPath("$.verificationNote").value("All good"));

        // 5. The rows in the database
        Map<String, Object> row = jdbc.sql("""
                        SELECT verification_status, verified_by, verified_at, trust_score, contact_phone, document_key
                        FROM employer WHERE id = :id""")
                .param("id", employerId).query().singleRow();
        assertThat(row).containsEntry("verification_status", "VERIFIED")
                .containsEntry("verified_by", admin.id())
                .containsEntry("contact_phone", "01712345678");
        assertThat(row.get("verified_at")).isNotNull();
        assertThat(((Number) row.get("trust_score")).floatValue()).isEqualTo(0.8f);
        String key = (String) row.get("document_key");
        assertThat(key).matches("document-[0-9a-f-]{36}\\.png");
        assertThat(UPLOADS.resolve(key)).exists();

        List<Map<String, Object>> audit = jdbc.sql("""
                        SELECT actor_id, action, details->>'note' AS note FROM audit_log WHERE target = :target""")
                .param("target", "employer:" + employerId).query().listOfRows();
        assertThat(audit).singleElement().satisfies(entry -> assertThat(entry)
                .containsEntry("action", "EMPLOYER_VERIFIED")
                .containsEntry("actor_id", admin.id())
                .containsEntry("note", "All good"));

        // 6. The "Verified" badge: job posts read it from the employer module's public API
        assertThat(employers.findByOwner(karim.id())).get().extracting(EmployerSummary::verified).isEqualTo(true);
        assertThat(employers.findAllById(List.of(employerId))).containsKey(employerId);
    }

    @Test
    void aRejectedEmployerSeesTheReasonFixesItAndIsReviewedAgain() throws Exception {
        Account shop = account("EMPLOYER");
        Account admin = signIn(ADMIN_EMAIL, ADMIN_PASSWORD);
        mvc.perform(saveProfile(shop, "Tongi Store")).andExpect(status().isOk());
        UUID employerId = idOf(upload(shop, png("blurry.png"), "NATIONAL_ID").andExpect(status().isOk()));
        String firstKey = documentKey(employerId);

        // A rejection needs a reason, and the error comes in the user's language
        mvc.perform(decide(admin, employerId, "{\"decision\":\"REJECT\"}").header(HttpHeaders.ACCEPT_LANGUAGE, "bn"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("employer.reject.reason-required"))
                .andExpect(jsonPath("$.detail").value("বাতিলের কারণ লিখুন।"));
        assertThat(verificationStatus(employerId)).isEqualTo("PENDING");   // nothing was saved

        mvc.perform(decide(admin, employerId, "{\"decision\":\"REJECT\",\"reason\":\"The NID is not readable\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("REJECTED"));
        mvc.perform(get(PROFILE).session(shop.session()))
                .andExpect(jsonPath("$.status").value("REJECTED"))
                .andExpect(jsonPath("$.verificationNote").value("The NID is not readable"))
                .andExpect(jsonPath("$.verified").value(false));

        // A clearer document: back in the queue, the reason is cleared and the old file deleted
        upload(shop, pdf(), "TRADE_LICENCE")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andExpect(jsonPath("$.verificationNote").value(nullValue()));
        assertThat(UPLOADS.resolve(firstKey)).doesNotExist();
        assertThat(UPLOADS.resolve(documentKey(employerId))).exists();

        // Approved once; a second decision on the same profile is refused
        mvc.perform(decide(admin, employerId, "{\"decision\":\"APPROVE\"}")).andExpect(status().isOk());
        mvc.perform(decide(admin, employerId, "{\"decision\":\"APPROVE\"}"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("employer.status.invalid-move"));

        List<String> actions = jdbc.sql("SELECT action FROM audit_log WHERE target = :target ORDER BY id")
                .param("target", "employer:" + employerId).query(String.class).list();
        assertThat(actions).containsExactly("EMPLOYER_REJECTED", "EMPLOYER_VERIFIED");
    }

    // ------------------------------------------------------------------ rules

    @Test
    void onlyRealPdfJpgOrPngFilesUpToThreeMegabytesAreKept() throws Exception {
        Account employer = account("EMPLOYER");

        upload(employer, png("licence.png"), "TRADE_LICENCE")
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("employer.profile.missing"));

        UUID employerId = idOf(mvc.perform(saveProfile(employer, "Rahman Electric")).andExpect(status().isOk()));
        MockMultipartFile textAsPng = new MockMultipartFile("file", "licence.png", "image/png",
                "just some text".getBytes(StandardCharsets.UTF_8));
        upload(employer, textAsPng, "TRADE_LICENCE")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("file.wrong-type"));

        byte[] big = new byte[3 * 1024 * 1024 + 10];
        System.arraycopy("%PDF-1.7".getBytes(StandardCharsets.US_ASCII), 0, big, 0, 8);
        upload(employer, new MockMultipartFile("file", "big.pdf", "application/pdf", big), "TRADE_LICENCE")
                .andExpect(status().isContentTooLarge())
                .andExpect(jsonPath("$.code").value("file.too-large"));

        assertThat(verificationStatus(employerId)).isEqualTo("UNVERIFIED");   // nothing was stored
        assertThat(documentKey(employerId)).isNull();

        upload(employer, pdf(), "TRADE_LICENCE").andExpect(status().isOk());
        mvc.perform(get(ADMIN + "/" + employerId + "/document").session(signIn(ADMIN_EMAIL, ADMIN_PASSWORD).session()))
                .andExpect(status().isOk())
                .andExpect(content().contentType("application/pdf"))
                .andExpect(header().string(HttpHeaders.CONTENT_DISPOSITION, containsString("inline")))
                .andExpect(header().string(HttpHeaders.CONTENT_DISPOSITION, containsString("licence.pdf")));
    }

    @Test
    void eachRoleOnlyReachesItsOwnPages() throws Exception {
        Account seeker = account("SEEKER");
        Account employer = account("EMPLOYER");

        mvc.perform(get(PROFILE)).andExpect(status().isUnauthorized());
        mvc.perform(get(PROFILE).session(seeker.session())).andExpect(status().isForbidden());
        mvc.perform(get(ADMIN).session(employer.session())).andExpect(status().isForbidden());
        mvc.perform(put(PROFILE).session(employer.session())   // no CSRF token
                        .contentType(MediaType.APPLICATION_JSON).content(profileJson("No Token Ltd")))
                .andExpect(status().isForbidden());

        mvc.perform(put(PROFILE).session(employer.session()).with(csrf()).contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name": "K", "kind": "SME", "address": "", "contactPerson": "Md. Karim",
                                 "contactPhone": "12345"}"""))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("error.validation"))
                .andExpect(jsonPath("$.errors.name").exists())
                .andExpect(jsonPath("$.errors.address").exists())
                .andExpect(jsonPath("$.errors.contactPhone").exists());
    }

    @Test
    void theQueueIsPagedOldestFirstWithoutRepeats() throws Exception {
        Account admin = signIn(ADMIN_EMAIL, ADMIN_PASSWORD);
        List<String> mine = new ArrayList<>();
        for (int i = 0; i < 3; i++) {
            Account employer = account("EMPLOYER");
            mvc.perform(saveProfile(employer, "Queue Shop " + i)).andExpect(status().isOk());
            mine.add(idOf(upload(employer, png("licence.png"), "TRADE_LICENCE")).toString());
        }

        List<String> seen = new ArrayList<>();
        String cursor = null;
        do {
            MockHttpServletRequestBuilder request = get(ADMIN).param("status", "PENDING").param("size", "2")
                    .session(admin.session());
            if (cursor != null) request.param("cursor", cursor);
            String page = mvc.perform(request).andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
            List<String> ids = JsonPath.read(page, "$.items[*].id");
            seen.addAll(ids);
            cursor = JsonPath.read(page, "$.nextCursor");
        } while (cursor != null);

        assertThat(seen).doesNotHaveDuplicates().containsSubsequence(mine);
        String counts = mvc.perform(get(ADMIN + "/counts").session(admin.session()))
                .andReturn().getResponse().getContentAsString();
        assertThat((Integer) JsonPath.read(counts, "$.PENDING")).isEqualTo(seen.size());
    }

    @Test
    void theDatabaseItselfRefusesBrokenRows() {
        assertThat(jdbc.sql("SELECT success FROM flyway_schema_history WHERE version = '130'")
                .query(Boolean.class).single()).isTrue();

        UUID owner = createUser("EMPLOYER").id();
        // a rejection without a reason
        assertThatThrownBy(() -> jdbc.sql("""
                        INSERT INTO employer (owner_id, name, kind, verification_status, submitted_at)
                        VALUES (:owner, 'Broken Ltd', 'SME', 'REJECTED', now())""")
                .param("owner", owner).update()).isInstanceOf(DataIntegrityViolationException.class);
        // a business type that doesn't exist
        assertThatThrownBy(() -> jdbc.sql("INSERT INTO employer (owner_id, name, kind) VALUES (:owner, 'Casino', 'CASINO')")
                .param("owner", owner).update()).isInstanceOf(DataIntegrityViolationException.class);
        // verified without an admin
        assertThatThrownBy(() -> jdbc.sql("""
                        INSERT INTO employer (owner_id, name, kind, verification_status, submitted_at, document_key)
                        VALUES (:owner, 'Self Approved', 'SME', 'VERIFIED', now(), 'document-x.pdf')""")
                .param("owner", owner).update()).isInstanceOf(DataIntegrityViolationException.class);
        // one business profile per account
        jdbc.sql("INSERT INTO employer (owner_id, name, kind) VALUES (:owner, 'First Ltd', 'SME')").param("owner", owner).update();
        assertThatThrownBy(() -> jdbc.sql("INSERT INTO employer (owner_id, name, kind) VALUES (:owner, 'Second Ltd', 'SME')")
                .param("owner", owner).update()).isInstanceOf(DataIntegrityViolationException.class);
    }

    // ------------------------------------------------------------------ helpers

    /** A confirmed account made straight in the database (sign-up's email code is tested by the identity module). */
    private Account createUser(String role) {
        String email = role.toLowerCase() + "-" + UUID.randomUUID() + "@test.kaaj";
        UUID id = jdbc.sql("""
                        INSERT INTO app_user (email, email_verified, password_hash, role)
                        VALUES (:email, true, :hash, :role) RETURNING id""")
                .param("email", email).param("hash", PASSWORD_HASH).param("role", role)
                .query(UUID.class).single();
        return new Account(id, email, null);
    }

    private Account account(String role) throws Exception {
        Account created = createUser(role);
        return signIn(created.email(), PASSWORD);
    }

    private Account signIn(String email, String password) throws Exception {
        MockHttpSession session = new MockHttpSession();
        mvc.perform(post("/api/v1/auth/login").session(session).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"%s\",\"password\":\"%s\"}".formatted(email, password)))
                .andExpect(status().isOk());
        UUID id = jdbc.sql("SELECT id FROM app_user WHERE email = :email").param("email", email).query(UUID.class).single();
        return new Account(id, email, session);
    }

    private MockHttpServletRequestBuilder saveProfile(Account account, String name) {
        return put(PROFILE).session(account.session()).with(csrf())
                .contentType(MediaType.APPLICATION_JSON).content(profileJson(name));
    }

    private ResultActions upload(Account account, MockMultipartFile file, String documentType) throws Exception {
        return mvc.perform(multipart(PROFILE + "/document").file(file).param("documentType", documentType)
                .session(account.session()).with(csrf()));
    }

    private MockHttpServletRequestBuilder decide(Account admin, UUID employerId, String json) {
        return post(ADMIN + "/" + employerId + "/verification").session(admin.session()).with(csrf())
                .contentType(MediaType.APPLICATION_JSON).content(json);
    }

    private static UUID idOf(ResultActions result) throws Exception {
        return UUID.fromString(JsonPath.read(result.andReturn().getResponse().getContentAsString(), "$.id"));
    }

    private String verificationStatus(UUID employerId) {
        return jdbc.sql("SELECT verification_status FROM employer WHERE id = :id").param("id", employerId)
                .query(String.class).single();
    }

    private String documentKey(UUID employerId) {
        return (String) jdbc.sql("SELECT document_key FROM employer WHERE id = :id").param("id", employerId)
                .query().singleRow().get("document_key");
    }

    private static String profileJson(String name) {
        return """
                {"name": "%s", "kind": "SME", "address": "Station Road, Tongi, Gazipur",
                 "latitude": 23.8916, "longitude": 90.4023, "contactPerson": "Md. Karim",
                 "contactPhone": "01712-345678", "contactEmail": "info@example.com"}""".formatted(name);
    }

    private static MockMultipartFile png(String name) throws IOException {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        ImageIO.write(new BufferedImage(60, 40, BufferedImage.TYPE_INT_RGB), "png", out);
        return new MockMultipartFile("file", name, "image/png", out.toByteArray());
    }

    private static MockMultipartFile pdf() {
        byte[] bytes = "%PDF-1.7\n1 0 obj << >> endobj\n%%EOF\n".getBytes(StandardCharsets.US_ASCII);
        return new MockMultipartFile("file", "licence.pdf", "application/pdf", bytes);
    }
}
