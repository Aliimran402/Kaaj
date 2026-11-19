import { z } from 'zod';
import { toAsciiDigits } from '../../lib/format';

/** What the code box keeps of what was typed or pasted: digits only (Bangla digits become ASCII), at most six. */
export function normalizeCode(text: string): string {
  return toAsciiDigits(text).replace(/\D/g, '').slice(0, 6);
}

// Error messages are i18n keys (validation.*); the form shows them in the current language.
// The rules match the server's Bean Validation in AuthController.

const email = z.string().trim().min(1, 'validation.emailRequired').pipe(z.email('validation.emailInvalid'));

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'validation.passwordRequired'),
});

export const registerSchema = z.object({
  role: z.enum(['SEEKER', 'EMPLOYER'], 'validation.roleRequired'),
  email,
  password: z.string().min(8, 'validation.passwordTooShort').max(64, 'validation.passwordTooLong'),
});

export const verifySchema = z.object({
  email,
  code: z.string().regex(/^\d{6}$/, 'validation.codeLength'),
});
