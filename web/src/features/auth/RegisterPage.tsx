import { zodResolver } from '@hookform/resolvers/zod';
import { Building, CircleCheck, UserRound } from 'lucide-react';
import { useId, type MouseEvent } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router';
import type { z } from 'zod';
import { Button, ErrorAlert, FieldMessage, PasswordField, TextDivider, TextField, TextLink } from '../../components/ui';
import { ApiError } from '../../lib/api';
import { usePageTitle } from '../../lib/usePageTitle';
import { googleSignInUrl, useRegister, type SignUpRole } from './api';
import { AuthShell } from './AuthShell';
import { showServerFieldErrors, useFieldErrorText } from './formErrors';
import { GoogleButton } from './GoogleButton';
import { registerSchema } from './schemas';
import { useGoToVerify } from './useGoToVerify';

// The form starts with no role chosen (unless ?role= gives one); the schema then requires it.
type RegisterInput = z.input<typeof registerSchema>;
type RegisterValues = z.output<typeof registerSchema>;

const ROLE_OPTIONS = [
  { value: 'SEEKER', icon: UserRound },
  { value: 'EMPLOYER', icon: Building },
] as const;

function roleFromUrl(value: string | null): SignUpRole | undefined {
  return value === 'SEEKER' || value === 'EMPLOYER' ? value : undefined;
}

export function RegisterPage() {
  const { t } = useTranslation();
  usePageTitle(t('auth.register.title'));
  const [params] = useSearchParams();
  const registerAccount = useRegister();
  const goToVerify = useGoToVerify();
  const fieldError = useFieldErrorText();
  const roleNoteId = useId();
  const roleErrorId = useId();
  const {
    register,
    handleSubmit,
    setError,
    control,
    formState: { errors },
  } = useForm<RegisterInput, unknown, RegisterValues>({
    resolver: zodResolver(registerSchema),
    // ?role=EMPLOYER from the home page's "Sign up as an employer" picks the role in advance.
    defaultValues: { role: roleFromUrl(params.get('role')), email: '', password: '' },
  });
  const role = useWatch({ control, name: 'role' });

  const onSubmit = handleSubmit((values) => {
    if (registerAccount.isPending) return;
    registerAccount.mutate(values, {
      onSuccess: () => goToVerify(values.email, true),
      onError: (error) => {
        // A second try within a minute: the first code still works, so go and enter it.
        if (error instanceof ApiError && error.code === 'auth.code.too-soon') goToVerify(values.email, false);
        else showServerFieldErrors(error, setError, ['role', 'email', 'password']);
      },
    });
  });

  // The server needs the role to create a new account from a Google sign-in.
  function requireRoleForGoogle(event: MouseEvent<HTMLAnchorElement>) {
    if (role) return;
    event.preventDefault();
    setError('role', { type: 'required', message: 'validation.roleRequired' }, { shouldFocus: true });
  }

  const roleError = fieldError(errors.role);

  return (
    <AuthShell title={t('auth.register.title')} subtitle={t('auth.register.subtitle')}>
      <form onSubmit={onSubmit} noValidate className="space-y-5">
        <fieldset aria-describedby={roleError ? `${roleErrorId} ${roleNoteId}` : roleNoteId}>
          <legend className="text-sm font-semibold text-ink">{t('auth.register.roleLegend')}</legend>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            {ROLE_OPTIONS.map(({ value, icon: Icon }) => (
              <label
                key={value}
                className="group relative flex cursor-pointer items-start gap-3 rounded-xl border-2 border-line-strong bg-white p-4 transition-colors hover:border-brand/60 has-checked:border-brand has-checked:bg-brand-soft has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-brand"
              >
                <input type="radio" value={value} className="sr-only" {...register('role')} />
                <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand group-has-checked:bg-white">
                  <Icon aria-hidden className="size-5" />
                </span>
                <span className="min-w-0 pr-6">
                  <span className="block font-semibold text-ink">{t(`auth.register.roles.${value}.title`)}</span>
                  <span className="block text-sm text-muted">{t(`auth.register.roles.${value}.text`)}</span>
                </span>
                <CircleCheck aria-hidden className="absolute top-3 right-3 hidden size-5 text-brand group-has-checked:block" />
              </label>
            ))}
          </div>
          <p id={roleNoteId} className="mt-2 text-sm text-muted">
            {t('auth.register.roleNote')}
          </p>
          {roleError && <FieldMessage id={roleErrorId}>{roleError}</FieldMessage>}
        </fieldset>

        <GoogleButton href={googleSignInUrl(role)} onClick={requireRoleForGoogle} />
        <TextDivider>{t('auth.register.orEmail')}</TextDivider>

        <ErrorAlert error={registerAccount.error} />
        <TextField
          label={t('auth.email')}
          type="email"
          autoComplete="email"
          placeholder={t('auth.emailPlaceholder')}
          error={fieldError(errors.email)}
          {...register('email')}
        />
        <PasswordField
          label={t('auth.password')}
          autoComplete="new-password"
          hint={t('auth.register.passwordHint')}
          error={fieldError(errors.password)}
          {...register('password')}
        />
        <Button type="submit" size="lg" className="w-full" loading={registerAccount.isPending}>
          {registerAccount.isPending ? t('auth.register.submitting') : t('auth.register.submit')}
        </Button>

        <p className="text-center text-sm text-muted">
          {t('auth.register.haveAccount')} <TextLink to="/login">{t('auth.register.signIn')}</TextLink>
        </p>
      </form>
    </AuthShell>
  );
}
