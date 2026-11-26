// Remembers, for this browser tab, which email is waiting for its code and when the last code was sent,
// so the verify page survives a reload and its "send a new code" timer stays right.

const EMAIL_KEY = 'kaaj.pendingEmail';
const SENT_AT_PREFIX = 'kaaj.codeSentAt:';

/** EmailCodeService allows one new code a minute for each email. */
export const RESEND_WAIT_SECONDS = 60;

function sentAtKey(email: string) {
  return SENT_AT_PREFIX + email.trim().toLowerCase();
}

export function rememberPendingEmail(email: string) {
  try {
    sessionStorage.setItem(EMAIL_KEY, email.trim());
  } catch {
    // storage blocked: the verify page then asks for the email
  }
}

export function pendingEmail(): string | undefined {
  try {
    return sessionStorage.getItem(EMAIL_KEY) ?? undefined;
  } catch {
    return undefined;
  }
}

export function markCodeSent(email: string, now = Date.now()) {
  try {
    sessionStorage.setItem(sentAtKey(email), String(now));
  } catch {
    // without storage the timer starts at zero; the server still enforces the wait
  }
}

export function secondsUntilResend(email: string, now = Date.now()): number {
  let sentAt = 0;
  try {
    sentAt = Number(sessionStorage.getItem(sentAtKey(email)) ?? 0);
  } catch {
    return 0;
  }
  if (!sentAt) return 0;
  return Math.max(0, Math.ceil((sentAt + RESEND_WAIT_SECONDS * 1000 - now) / 1000));
}
