import { zodResolver } from '@hookform/resolvers/zod';
import { MailCheck } from 'lucide-react';
import { useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { Trans, useTranslation } from 'react-i18next';
import { useLocation } from 'react-router';
import { Alert, Button, ErrorAlert, TextField, TextLink } from '../../components/ui';
import { formatNumber } from '../../lib/format';
import { usePageTitle } from '../../lib/usePageTitle';
import { useResendCode, useVerifyEmail } from './api';
import { AuthShell } from './AuthShell';
import { showServerFieldErrors, useFieldErrorText } from './formErrors';
import { pendingEmail } from './pendingSignUp';
import { normalizeCode, verifySchema } from './schemas';
import { useResendCountdown } from './useResendCountdown';

function emailFromState(state: unknown): string | undefined {
  if (state && typeof state === 'object' && 'email' in state && typeof state.email === 'string') return state.email;
  return undefined;
}

export function VerifyPage() {
  const { t, i18n } = useTranslation();
  usePageTitle(t('auth.verify.title'));
  const location = useLocation();
  // From the sign-up or sign-in page, or remembered in this tab if the page was reloaded.
  const [knownEmail] = useState(() => emailFromState(location.state) ?? pendingEmail());
  const verify = useVerifyEmail();
  const resend = useResendCode();
  const [resent, setResent] = useState(false);
  const fieldError = useFieldErrorText();
  const {
    register,
    control,
    handleSubmit,
    setError,
    setFocus,
    trigger,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(verifySchema),
    defaultValues: { email: knownEmail ?? '', code: '' },
  });
  const email = useWatch({ control, name: 'email' }).trim();
  const { secondsLeft, restart } = useResendCountdown(email);

  // On success the user is signed in, and GuestOnly takes them home.
  const submit = handleSubmit((values) => {
    if (verify.isPending) return;
    verify.mutate(values, {
      onError: (error) => {
        showServerFieldErrors(error, setError, ['email', 'code']);
        setFocus('code', { shouldSelect: true });
      },
    });
  });

  async function onResend() {
    if (resend.isPending || !(await trigger('email'))) return;
    setResent(false);
    resend.mutate(email, {
      onSuccess: () => {
        restart();
        setResent(true);
      },
    });
  }

  const subtitle = knownEmail ? (
    <Trans
      i18nKey="auth.verify.subtitle"
      values={{ email: knownEmail }}
      components={{ b: <strong className="font-semibold break-all text-ink" /> }}
    />
  ) : (
    t('auth.verify.subtitleNoEmail')
  );

  return (
    <AuthShell title={t('auth.verify.title')} subtitle={subtitle}>
      <div className="space-y-5">
        {import.meta.env.DEV && <Alert tone="info">{t('auth.verify.devHint')}</Alert>}

        <form onSubmit={submit} noValidate className="space-y-4">
          <ErrorAlert error={verify.error} />
          {!knownEmail && (
            <TextField
              label={t('auth.email')}
              type="email"
              autoComplete="email"
              placeholder={t('auth.emailPlaceholder')}
              error={fieldError(errors.email)}
              {...register('email')}
            />
          )}
          <Controller
            name="code"
            control={control}
            render={({ field }) => (
              <TextField
                label={t('auth.verify.code')}
                hint={t('auth.verify.codeHint')}
                error={fieldError(errors.code)}
                inputMode="numeric"
                autoComplete="one-time-code"
                inputClassName="text-center text-2xl font-semibold tracking-[0.4em] pl-[calc(0.875rem+0.4em)] tabular-nums"
                name={field.name}
                ref={field.ref}
                value={field.value}
                onBlur={field.onBlur}
                onChange={(event) => {
                  const code = normalizeCode(event.target.value);
                  const changed = code !== field.value;
                  field.onChange(code);
                  if (changed && verify.isError) verify.reset();
                  // A complete code (typed, pasted or autofilled) is sent at once.
                  if (changed && code.length === 6) void submit();
                }}
              />
            )}
          />
          <Button type="submit" size="lg" className="w-full" loading={verify.isPending}>
            {verify.isPending ? t('auth.verify.submitting') : t('auth.verify.submit')}
          </Button>
        </form>

        <div className="rounded-xl border border-line bg-page p-4 text-sm">
          <p className="flex items-center gap-2 font-semibold text-ink">
            <MailCheck aria-hidden className="size-4 text-brand" />
            {t('auth.verify.noCode')}
          </p>
          {secondsLeft > 0 && (
            <p className="mt-1 text-muted">
              {t('auth.verify.resendIn', { seconds: formatNumber(secondsLeft, i18n.resolvedLanguage ?? 'bn') })}
            </p>
          )}
          <Button
            variant="secondary"
            className="mt-3"
            onClick={() => void onResend()}
            disabled={secondsLeft > 0 || !email}
            loading={resend.isPending}
          >
            {resend.isPending ? t('auth.verify.resending') : t('auth.verify.resend')}
          </Button>
          {resent && (
            <Alert tone="success" className="mt-3">
              {t('auth.verify.resent')}
            </Alert>
          )}
          {resend.isError && (
            <div className="mt-3">
              <ErrorAlert error={resend.error} />
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 text-sm text-muted sm:flex-row sm:justify-between">
          {knownEmail && <TextLink to="/register">{t('auth.verify.changeEmail')}</TextLink>}
          <p>
            {t('auth.verify.alreadyConfirmed')} <TextLink to="/login">{t('auth.verify.signIn')}</TextLink>
          </p>
        </div>
      </div>
    </AuthShell>
  );
}
