package app.kaaj.shared;

import java.util.List;
import java.util.function.Function;

/** One page of a list; {@code nextCursor} is null on the last page. */
public record CursorPage<T>(List<T> items, String nextCursor) {

    /** The same page with every item turned into something else, for example an entity into its view. */
    public <R> CursorPage<R> map(Function<? super T, ? extends R> mapper) {
        return new CursorPage<>(items.stream().<R>map(mapper).toList(), nextCursor);
    }
}
