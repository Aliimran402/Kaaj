package app.kaaj;

import java.nio.file.Path;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.annotation.Bean;
import org.testcontainers.images.builder.ImageFromDockerfile;
import org.testcontainers.postgresql.PostgreSQLContainer;
import org.testcontainers.utility.DockerImageName;

/**
 * A fresh, empty PostgreSQL for tests: the same image as compose.yaml (docker/db/Dockerfile: PostgreSQL 18 with
 * PostGIS and pgvector), started by Testcontainers. Flyway runs every migration on it, so the tests check the real
 * tables and constraints. Docker Desktop must be running. The dev database on port 5433 is never touched.
 */
@TestConfiguration(proxyBeanMethods = false)
class TestDatabase {

    @Bean
    @ServiceConnection
    PostgreSQLContainer postgres() {
        // Built once, then reused from Docker's cache (deleteOnExit = false).
        String image = new ImageFromDockerfile("kaaj-test-db", false)
                .withDockerfile(Path.of("docker/db/Dockerfile"))
                .get();
        return new PostgreSQLContainer(DockerImageName.parse(image).asCompatibleSubstituteFor("postgres"));
    }
}
