import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router';
import { Alert, Button, ErrorAlert, PasswordField, TextDivider, TextField, TextLink } from '../../components/ui';
import { ApiError } from '../../lib/api';
import { usePageTitle } from '../../lib/usePageTitle';
import { googleSignInUrl, useLogin, useResendCode } from './api';
import { AuthShell } from './AuthShell';
import { showServerFieldErrors, useFieldErrorText } from './formErrors';
import { GoogleButton } from './GoogleButton';
import { loginSchema } from './schemas';
import { useGoToVerify } from './useGoToVerify';

// When Google sign-in fails, GoogleLoginSuccessHandler redirects to /login?error=<message key>.
const GOOGLE_ERRORS = {
  'auth.google.choose-role': 'auth.login.googleErrors.chooseRole',
  'auth.google.email-not-verified': 'auth.login.googleErrors.emailNotVerified',
  'auth.suspended': 'auth.login.googleErrors.suspended',
} as const;

export function LoginPage() {
  const { t } = useTranslation();
  usePageTitle(t('auth.login.title'));
  const [params] = useSearchParams();
  const login = useLogin();
  const resend = useResendCode();
  const goToVerify = useGoToVerify();
  const fieldError = useFieldErrorText();
  const {
    register,
    handleSubmit,
    setError,
    getValues,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  // On success the user is signed in, and GuestOnly sends them on to ?next= or home.
  const onSubmit = handleSubmit((values) => {
    if (login.isPending) return;
    resend.reset();
    login.mutate(values, { onError: (error) => showServerFieldErrors(error, setError, ['email', 'password']) });
  });

  const needsCode = login.error instanceof ApiError && login.error.code === 'auth.login.unverified';

  function sendCode() {
    if (resend.isPending) return;
    const email = getValues('email').trim();
    resend.mutate(email, {
      onSuccess: () => goToVerify(email, true),
      onError: (error) => {
        // A code went out less than a minute ago and still works: go and enter it.
        if (error instanceof ApiError && error.code === 'auth.code.too-soon') goToVerify(email, false);
      },
    });
  }

  const googleError = params.get('error'); // "" for Spring's own failure redirect (/login?error)

  return (
    <AuthShell title={t('auth.login.title')} subtitle={t('auth.login.subtitle')}>
      <div className="space-y-5">
        {googleError !== null && <GoogleErrorAlert code={googleError} />}
        <GoogleButton href={googleSignInUrl()} />
        <TextDivider>{t('auth.login.orEmail')}</TextDivider>

        <form onSubmit={onSubmit} noValidate className="space-y-4">
          <ErrorAlert error={login.error}>
            {needsCode && (
              <Button variant="secondary" onClick={sendCode} loading={resend.isPending}>
                {resend.isPending ? t('auth.login.sendingCode') : t('auth.login.sendCode')}
              </Button>
            )}
          </ErrorAlert>
          {resend.error instanceof ApiError && resend.error.code !== 'auth.code.too-soon' && (
            <ErrorAlert error={resend.error} />
          )}
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
            autoComplete="current-password"
            error={fieldError(errors.password)}
            {...register('password')}
          />
          <Button type="submit" size="lg" className="w-full" loading={login.isPending}>
            {login.isPending ? t('auth.login.submitting') : t('auth.login.submit')}
          </Button>
        </form>

        <p className="text-center text-sm text-muted">
          {t('auth.login.noAccount')} <TextLink to="/register">{t('auth.login.createAccount')}</TextLink>
        </p>
      </div>
    </AuthShell>
  );
}

function GoogleErrorAlert({ code }: { code: string }) {
  const { t } = useTranslation();
  const key = Object.hasOwn(GOOGLE_ERRORS, code)
    ? GOOGLE_ERRORS[code as keyof typeof GOOGLE_ERRORS]
    : 'auth.login.googleErrors.generic';
  return (
    <Alert tone="error">
      <p>{t(key)}</p>
      {code === 'auth.google.choose-role' && (
        <p>
          <TextLink to="/register">{t('auth.login.createAccount')}</TextLink>
        </p>
      )}
    </Alert>
  );
}
