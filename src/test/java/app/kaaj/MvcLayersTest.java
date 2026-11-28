package app.kaaj;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Stream;

import org.junit.jupiter.api.Test;

/**
 * Keeps the MVC layers apart. Controllers (the C) read the HTTP request, call a service (the M) and return a view
 * record (the V, sent as JSON); they never reach the database themselves. Plain Java: it reads the source files.
 */
class MvcLayersTest {
    private static final Path SOURCES = Path.of("src/main/java/app/kaaj");
    private static final Pattern CONTROLLER = Pattern.compile("@RestController\\b");
    private static final Pattern FIELD = Pattern.compile("private\\s+final\\s+([A-Z][\\w.<>, ]*?)\\s+\\w+\\s*;");

    @Test
    void controllersGoThroughServicesNeverStraightToTheDatabase() throws IOException {
        List<Path> files;
        try (Stream<Path> walk = Files.walk(SOURCES)) {
            files = walk.filter(path -> path.toString().endsWith(".java")).toList();
        }
        assertThat(files).as("run the tests from the project folder").isNotEmpty();

        Set<String> stores = new HashSet<>();   // classes that run SQL themselves
        for (Path file : files) {
            if (Files.readString(file).contains("private final JdbcClient")) stores.add(simpleName(file));
        }
        List<String> problems = new ArrayList<>();
        int controllers = 0;
        for (Path file : files) {
            String source = Files.readString(file);
            if (!CONTROLLER.matcher(source).find()) continue;
            controllers++;
            Matcher field = FIELD.matcher(source);
            while (field.find()) {
                String type = field.group(1).trim();
                boolean dataAccess = type.endsWith("Repository") || type.equals("JdbcClient")
                        || type.equals("EntityManager") || type.equals("FileStore") || stores.contains(type);
                if (dataAccess) problems.add(simpleName(file) + " uses " + type + " directly");
            }
        }
        assertThat(controllers).isGreaterThanOrEqualTo(4);
        assertThat(problems).as("controllers must call a service instead").isEmpty();
    }

    @Test
    void controllersReturnViewsNotEntities() throws IOException {
        // The entities (the model's data) stay inside the server; the JSON is always a view record.
        String profile = Files.readString(SOURCES.resolve("employer/internal/EmployerProfileController.java"));
        String admin = Files.readString(SOURCES.resolve("employer/internal/AdminEmployerController.java"));
        Pattern returnsEntity = Pattern.compile("^\\s+(ResponseEntity<)?Employer>?\\s+\\w+\\(", Pattern.MULTILINE);
        assertThat(returnsEntity.matcher(profile).find()).isFalse();
        assertThat(returnsEntity.matcher(admin).find()).isFalse();
    }

    private static String simpleName(Path file) {
        String name = file.getFileName().toString();
        return name.substring(0, name.length() - ".java".length());
    }
}
