import { describe, expect, it } from 'vitest';
import { formatNumber, toAsciiDigits } from './format';

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
