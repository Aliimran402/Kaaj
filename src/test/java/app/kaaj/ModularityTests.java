package app.kaaj;

import org.junit.jupiter.api.Test;
import org.springframework.modulith.core.ApplicationModules;

/** Modules (identity, shared, employer, ...) use each other only through their top-level package, never internal/. */
class ModularityTests {

    @Test
    void modulesOnlyUseEachOthersPublicApi() {
        ApplicationModules.of(KaajApplication.class).verify();
    }
}
