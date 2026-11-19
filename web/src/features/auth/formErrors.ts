import type { FieldError, FieldValues, Path, UseFormSetError } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import type { Messages } from '../../i18n/bn';
import { ApiError } from '../../lib/api';

type ValidationKey = `validation.${keyof Messages['validation']}`;

/** Text for a field error: our Zod rules carry i18n keys, the server's field errors are already text. */
export function useFieldErrorText() {
  const { t } = useTranslation();
  return (error: FieldError | undefined): string | undefined => {
    if (!error?.message) return undefined;
    return error.type === 'server' ? error.message : t(error.message as ValidationKey);
  };
}

/** Shows the server's per-field messages (ProblemDetail "errors") next to the matching fields. */
export function showServerFieldErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  fields: readonly Path<T>[],
) {
  if (!(error instanceof ApiError)) return;
  for (const [field, message] of Object.entries(error.fieldErrors)) {
    const known = fields.find((name) => name === field);
    if (known) setError(known, { type: 'server', message });
  }
}
