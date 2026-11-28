import { z } from 'zod';
import { toAsciiDigits } from '../../lib/format';
import { EMPLOYER_KINDS, type EmployerProfile, type EmployerProfileInput } from './types';

// Model: the business profile form's rules. Messages are i18n keys (validation.*), and the rules match the
// server's Bean Validation in EmployerProfileController.ProfileRequest.

/** Bangladeshi mobile numbers: 01XXXXXXXXX or +8801XXXXXXXXX, spaces and dashes allowed. Same rule as the server. */
export const BD_MOBILE = /^(\+?880[-\s]?|0)1[3-9](?:[-\s]?\d){8}$/;

const emailOrEmpty = z
  .string()
  .trim()
  .refine((value) => value === '' || z.email().safeParse(value).success, 'validation.emailInvalid');

export const profileSchema = z.object({
  name: z.string().trim().min(2, 'validation.nameLength').max(120, 'validation.nameLength'),
  kind: z.enum(EMPLOYER_KINDS, 'validation.kindRequired'),
  address: z.string().trim().min(1, 'validation.required').max(300, 'validation.tooLong'),
  contactPerson: z.string().trim().min(1, 'validation.required').max(120, 'validation.tooLong'),
  contactPhone: z
    .string()
    .trim()
    .min(1, 'validation.required')
    .refine((value) => BD_MOBILE.test(toAsciiDigits(value)), 'validation.phone'),
  contactEmail: emailOrEmpty,
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;

/** The form's values as the API wants them: ASCII digits in the phone number, no email as null. */
export function toInput(values: ProfileFormValues): EmployerProfileInput {
  return {
    ...values,
    contactPhone: toAsciiDigits(values.contactPhone),
    contactEmail: values.contactEmail === '' ? null : values.contactEmail,
  };
}

/** The saved profile as form values; an empty form before the first save. */
export function toFormValues(profile: EmployerProfile | null | undefined): ProfileFormValues {
  return {
    name: profile?.name ?? '',
    kind: profile?.kind ?? 'SME',
    address: profile?.address ?? '',
    contactPerson: profile?.contactPerson ?? '',
    contactPhone: profile?.contactPhone ?? '',
    contactEmail: profile?.contactEmail ?? '',
    latitude: profile?.latitude ?? null,
    longitude: profile?.longitude ?? null,
  };
}

/** The fields the server can report errors for (ProblemDetail "errors"). */
export const PROFILE_FIELDS = ['name', 'kind', 'address', 'contactPerson', 'contactPhone', 'contactEmail'] as const;
