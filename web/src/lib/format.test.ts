import { describe, expect, it } from 'vitest';
import { formatDate, formatNumber, localDigits, toAsciiDigits } from './format';

describe('localDigits', () => {
  it('shows a phone number in Bangla digits in Bangla only', () => {
    expect(localDigits('01712-345678', 'bn')).toBe('০১৭১২-৩৪৫৬৭৮');
    expect(localDigits('01712-345678', 'en')).toBe('01712-345678');
  });
});

describe('formatDate', () => {
  it('writes the date in the current language, and nothing for no date', () => {
    expect(formatDate('2026-11-27T09:00:00Z', 'en')).toBe('27 Nov 2026');
    expect(formatDate('2026-11-27T09:00:00Z', 'bn')).toContain('২০২৬');
    expect(formatDate(null, 'en')).toBe('');
    expect(formatDate('not a date', 'en')).toBe('');
  });
});

describe('toAsciiDigits', () => {
  it('turns Bangla digits into ASCII digits and leaves the rest alone', () => {
    expect(toAsciiDigits('০১২৩৪৫৬৭৮৯')).toBe('0123456789');
    expect(toAsciiDigits('কোড: ৪২ ok 7')).toBe('কোড: 42 ok 7');
  });
});

describe('formatNumber', () => {
  it('uses Bangla digits and lakh grouping in Bangla', () => {
    expect(formatNumber(18000, 'bn')).toBe('১৮,০০০');
    expect(formatNumber(150000, 'bn')).toBe('১,৫০,০০০');
  });

  it('uses ASCII digits and lakh grouping in English', () => {
    expect(formatNumber(18000, 'en')).toBe('18,000');
    expect(formatNumber(150000, 'en')).toBe('1,50,000');
  });

  it('passes options on, e.g. a year without grouping', () => {
    expect(formatNumber(2026, 'bn', { useGrouping: false })).toBe('২০২৬');
  });
});
