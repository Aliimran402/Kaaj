import { describe, expect, it } from 'vitest';
import { bn } from './bn';
import { en } from './en';

function leaves(value: unknown, path = ''): [string, unknown][] {
  if (value && typeof value === 'object') {
    return Object.entries(value).flatMap(([key, child]) => leaves(child, path ? `${path}.${key}` : key));
  }
  return [[path, value]];
}

describe('translations', () => {
  it('have the same keys in Bangla and English', () => {
    expect(leaves(en).map(([key]) => key)).toEqual(leaves(bn).map(([key]) => key));
  });

  it('have no empty texts', () => {
    for (const [key, text] of [...leaves(bn), ...leaves(en)]) {
      expect(typeof text === 'string' && text.trim().length > 0, key).toBe(true);
    }
  });

  it('use the same {{placeholders}} in both languages', () => {
    const placeholders = (text: unknown) => String(text).match(/{{\w+}}/g)?.sort() ?? [];
    const english = new Map(leaves(en));
    for (const [key, text] of leaves(bn)) {
      expect(placeholders(english.get(key)), key).toEqual(placeholders(text));
    }
  });
});
