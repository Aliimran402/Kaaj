import { describe, expect, it } from 'vitest';
import { markCodeSent, secondsUntilResend } from './pendingSignUp';
import { loginPathFor, safeNext } from './redirect';
import { normalizeCode } from './schemas';

describe('normalizeCode', () => {
  it('keeps digits only, turns Bangla digits into ASCII and stops at six', () => {
    expect(normalizeCode('১২৩ ৪৫৬')).toBe('123456');
    expect(normalizeCode('Code: 98-76-54-32')).toBe('987654');
    expect(normalizeCode('abc')).toBe('');
  });
});

describe('safeNext', () => {
  it('allows paths inside the app', () => {
    expect(safeNext('/employer/jobs?status=DRAFT')).toBe('/employer/jobs?status=DRAFT');
  });

  it('refuses other sites and missing values', () => {
    for (const next of [null, undefined, '', 'https://evil.example', '//evil.example', '/\\evil.example', 'jobs']) {
      expect(safeNext(next)).toBe('/');
    }
  });

  it('never goes back to a sign-in page', () => {
    expect(safeNext('/login?next=/x')).toBe('/');
    expect(safeNext('/verify')).toBe('/');
  });
});

describe('loginPathFor', () => {
  it('remembers where to come back to', () => {
    expect(loginPathFor('/employer/jobs?status=DRAFT')).toBe('/login?next=%2Femployer%2Fjobs%3Fstatus%3DDRAFT');
    expect(loginPathFor('/')).toBe('/login');
  });
});

describe('secondsUntilResend', () => {
  it('counts down the minute after a code was sent, per email and ignoring case', () => {
    const sentAt = 1_000_000;
    markCodeSent('Rahim@Example.com ', sentAt);
    expect(secondsUntilResend('rahim@example.com', sentAt)).toBe(60);
    expect(secondsUntilResend('rahim@example.com', sentAt + 59_500)).toBe(1);
    expect(secondsUntilResend('rahim@example.com', sentAt + 60_000)).toBe(0);
    expect(secondsUntilResend('someone@example.com', sentAt)).toBe(0);
  });
});
