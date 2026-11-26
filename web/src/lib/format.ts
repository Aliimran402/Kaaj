const BANGLA_DIGITS = '০১২৩৪৫৬৭৮৯';

/** "০১৭১২" → "01712". People with a Bangla keyboard type Bangla digits; the API wants ASCII. */
export function toAsciiDigits(text: string): string {
  return text.replace(/[০-৯]/g, (digit) => String(BANGLA_DIGITS.indexOf(digit)));
}

/** 18000 → "১৮,০০০" in Bangla, "18,000" in English (both with lakh grouping: 1,00,000). */
export function formatNumber(value: number, language: string, options?: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat(language === 'en' ? 'en-IN' : 'bn-BD', options).format(value);
}
