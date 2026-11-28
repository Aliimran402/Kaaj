import { describe, expect, it } from 'vitest';
import { profileSchema, toFormValues, toInput } from './schema';

const valid = {
  name: 'Karim Transport',
  kind: 'SME' as const,
  address: 'Station Road, Tongi',
  contactPerson: 'Md. Karim',
  contactPhone: '01712-345678',
  contactEmail: '',
  latitude: null,
  longitude: null,
};

function errorFor(values: object, field: string) {
  const result = profileSchema.safeParse({ ...valid, ...values });
  return result.success ? undefined : result.error.issues.find((issue) => issue.path[0] === field)?.message;
}

describe('profileSchema', () => {
  it('accepts a complete profile', () => {
    expect(profileSchema.safeParse(valid).success).toBe(true);
  });

  it('accepts Bangladeshi mobile numbers written in Bangla digits, with +880, spaces or dashes', () => {
    for (const phone of ['০১৭১২৩৪৫৬৭৮', '+8801712345678', '01712 345 678', '+880-1712-345678']) {
      expect(errorFor({ contactPhone: phone }, 'contactPhone')).toBeUndefined();
    }
  });

  it('refuses numbers that are not Bangladeshi mobiles', () => {
    for (const phone of ['12345', '01212345678', '0171234567', '021234567']) {
      expect(errorFor({ contactPhone: phone }, 'contactPhone')).toBe('validation.phone');
    }
  });

  it('names the problem with an i18n key', () => {
    expect(errorFor({ name: 'K' }, 'name')).toBe('validation.nameLength');
    expect(errorFor({ address: '   ' }, 'address')).toBe('validation.required');
    expect(errorFor({ contactEmail: 'not-an-email' }, 'contactEmail')).toBe('validation.emailInvalid');
    expect(errorFor({ kind: 'CASINO' }, 'kind')).toBe('validation.kindRequired');
  });
});

describe('toInput and toFormValues', () => {
  it('sends ASCII digits and no email as null', () => {
    expect(toInput({ ...valid, contactPhone: '০১৭১২-৩৪৫৬৭৮' })).toMatchObject({
      contactPhone: '01712-345678',
      contactEmail: null,
    });
  });

  it('starts an empty form before the first save', () => {
    expect(toFormValues(null)).toEqual({ ...valid, name: '', address: '', contactPerson: '', contactPhone: '' });
  });
});
