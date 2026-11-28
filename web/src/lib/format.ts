const BANGLA_DIGITS = '০১২৩৪৫৬৭৮৯';

/** "০১৭১২" → "01712". People with a Bangla keyboard type Bangla digits; the API wants ASCII. */
export function toAsciiDigits(text: string): string {
  return text.replace(/[০-৯]/g, (digit) => String(BANGLA_DIGITS.indexOf(digit)));
}

/** 18000 → "১৮,০০০" in Bangla, "18,000" in English (both with lakh grouping: 1,00,000). */
export function formatNumber(value: number, language: string, options?: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat(language === 'en' ? 'en-IN' : 'bn-BD', options).format(value);
}

/** "01712345678" → "০১৭১২৩৪৫৬৭৮" in Bangla; unchanged in English. For phone numbers and codes, not amounts. */
export function localDigits(text: string, language: string): string {
  return language === 'en' ? text : text.replace(/[0-9]/g, (digit) => BANGLA_DIGITS[Number(digit)]);
}

/** An ISO timestamp from the API as a date: "২৭ নভেম্বর, ২০২৬" / "27 Nov 2026". Empty for null. */
export function formatDate(iso: string | null | undefined, language: string): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat(language === 'en' ? 'en-GB' : 'bn-BD', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}
