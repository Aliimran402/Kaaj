package app.kaaj.shared;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.junit.jupiter.api.Test;

class SharedHelpersTest {

    @Test
    void aCursorGoesThereAndBackAgain() {
        Cursor cursor = new Cursor(Instant.parse("2026-11-27T09:00:00.123Z"), UUID.randomUUID());
        assertThat(Cursor.decode(cursor.encode())).isEqualTo(cursor);
        assertThatThrownBy(() -> Cursor.decode("not-a-cursor")).hasMessage("error.bad-cursor");
    }

    @Test
    void aPageCanBeTurnedIntoViews() {
        CursorPage<Integer> page = new CursorPage<>(List.of(1, 2), "next");
        assertThat(page.map(n -> "#" + n)).isEqualTo(new CursorPage<>(List.of("#1", "#2"), "next"));
    }

    @Test
    void writesSafeJson() {
        Map<String, Object> values = new LinkedHashMap<>();
        values.put("name", "Karim \"Transport\"\n");
        values.put("count", 2);
        values.put("note", null);
        assertThat(Json.object(values)).isEqualTo("{\"name\":\"Karim \\\"Transport\\\"\\n\",\"count\":2,\"note\":null}");
    }
}
