import { describe, expect, it } from 'vitest';

// Every page and component (the views), read as text. The test helpers are not views.
const views = import.meta.glob(['./**/*.tsx', '!./**/*.test.tsx', '!./test/**'], {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

describe('MVC layers in the web app', () => {
  it('finds the views', () => {
    expect(Object.keys(views).length).toBeGreaterThan(15);
  });

  it('views never call the server themselves: only the hooks in features/*/api.ts do', () => {
    const direct = /\bapiFetch\b|\bfetch\(|\buse(Query|Mutation|InfiniteQuery)\(/;
    const offenders = Object.entries(views)
      .filter(([, source]) => direct.test(source))
      .map(([file]) => file);
    expect(offenders).toEqual([]);
  });
});
