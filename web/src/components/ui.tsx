import {
  CircleCheck,
  CircleExclamationPoint,
  Eye,
  EyeOff,
  Info,
  LoaderCircle,
  TriangleExclamationPoint,
} from 'lucide-react';
import { useId, useState, type ComponentProps, type MouseEvent, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, type LinkProps } from 'react-router';
import { ApiError } from '../lib/api';

// Shared building blocks in the Figma style: blue buttons, white rounded cards, light-blue banner.

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'md' | 'lg';

const variantClass: Record<Variant, string> = {
  primary: 'bg-brand text-white hover:bg-brand-hover',
  secondary: 'border border-line-strong bg-white text-brand hover:bg-brand-soft',
  ghost: 'text-brand hover:bg-brand-soft',
  danger: 'border border-danger/40 bg-white text-danger hover:bg-danger-soft',
};

const sizeClass: Record<Size, string> = {
  md: 'min-h-11 px-4 text-sm',
  lg: 'min-h-12 px-6 text-base',
};

function buttonClass(variant: Variant, size: Size, className: string) {
  return [
    'focus-ring inline-flex items-center justify-center gap-2 rounded-lg py-2 text-center font-semibold transition-colors',
    'disabled:cursor-not-allowed disabled:opacity-60 aria-disabled:cursor-wait aria-disabled:opacity-80',
    variantClass[variant],
    sizeClass[size],
    className,
  ].join(' ');
}

type ButtonProps = ComponentProps<'button'> & { variant?: Variant; size?: Size; loading?: boolean };

/** While loading, the button stays focusable (aria-disabled) but ignores clicks and Enter. */
export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  className = '',
  type = 'button',
  onClick,
  children,
  ...rest
}: ButtonProps) {
  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    if (loading) event.preventDefault();
    else onClick?.(event);
  }
  return (
    <button
      type={type}
      aria-disabled={loading || undefined}
      onClick={handleClick}
      className={buttonClass(variant, size, className)}
      {...rest}
    >
      {loading && <LoaderCircle aria-hidden className="size-4 shrink-0 animate-spin" />}
      {children}
    </button>
  );
}

type ButtonLinkProps = LinkProps & { variant?: Variant; size?: Size };

export function ButtonLink({ variant = 'primary', size = 'md', className = '', ...rest }: ButtonLinkProps) {
  return <Link className={buttonClass(variant, size, String(className))} {...rest} />;
}

/** A link inside text. Underlined, because blue alone doesn't stand out enough from grey text. */
export function TextLink({ className = '', ...rest }: LinkProps) {
  return (
    <Link
      className={`focus-ring rounded font-semibold text-brand underline underline-offset-2 hover:text-brand-hover ${String(className)}`}
      {...rest}
    />
  );
}

export function Container({ className = '', children }: { className?: string; children: ReactNode }) {
  return <div className={`mx-auto w-full max-w-6xl px-4 sm:px-6 ${className}`}>{children}</div>;
}

export function Card({ className = '', children }: { className?: string; children: ReactNode }) {
  return (
    <div className={`rounded-2xl border border-line bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)] sm:p-6 ${className}`}>
      {children}
    </div>
  );
}

/** The light-blue band under the header with the page's heading (h1). */
export function PageBanner({
  title,
  subtitle,
  children,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <section className="border-b border-line-strong/50 bg-brand-soft">
      <Container className="py-8 sm:py-10">
        <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-2 max-w-2xl text-muted">{subtitle}</p>}
        {children}
      </Container>
    </section>
  );
}

export type BadgeTone = 'brand' | 'success' | 'warning' | 'danger' | 'neutral';

const badgeToneClass: Record<BadgeTone, string> = {
  brand: 'bg-brand-soft text-brand',
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-danger-soft text-danger',
  neutral: 'bg-page text-muted',
};

export function Badge({ tone = 'brand', children }: { tone?: BadgeTone; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ${badgeToneClass[tone]}`}
    >
      {children}
    </span>
  );
}

type AlertTone = 'error' | 'success' | 'info' | 'warning';

const alertStyle: Record<AlertTone, { box: string; icon: typeof Info }> = {
  error: { box: 'border-danger/30 bg-danger-soft text-danger', icon: CircleExclamationPoint },
  success: { box: 'border-success/30 bg-success-soft text-success', icon: CircleCheck },
  info: { box: 'border-brand/20 bg-brand-soft text-ink', icon: Info },
  warning: { box: 'border-warning/30 bg-warning-soft text-warning', icon: TriangleExclamationPoint },
};

export function Alert({
  tone = 'info',
  children,
  className = '',
}: {
  tone?: AlertTone;
  children: ReactNode;
  className?: string;
}) {
  const { box, icon: Icon } = alertStyle[tone];
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={`flex gap-3 rounded-xl border px-4 py-3 text-sm ${box} ${className}`}>
      <Icon aria-hidden className="mt-0.5 size-5 shrink-0" />
      <div className="min-w-0 flex-1 space-y-2">{children}</div>
    </div>
  );
}

/** The message of a failed API call, in the current language. */
export function ErrorAlert({ error, children }: { error: unknown; children?: ReactNode }) {
  const { t } = useTranslation();
  if (!error) return null;
  let message = t('errors.unknown');
  if (error instanceof ApiError) {
    message = error.code === 'error.validation' ? t('errors.validation') : error.message;
  }
  return (
    <Alert tone="error">
      <p>{message}</p>
      {children}
    </Alert>
  );
}

export function Spinner({ label }: { label?: string }) {
  const { t } = useTranslation();
  return (
    <div role="status" className="flex items-center justify-center gap-3 py-24 text-muted">
      <LoaderCircle aria-hidden className="size-7 animate-spin text-brand" />
      <span className="sr-only">{label ?? t('common.loading')}</span>
    </div>
  );
}

export function TextDivider({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-3 text-xs text-muted">
      <span aria-hidden className="h-px flex-1 bg-line" />
      <span>{children}</span>
      <span aria-hidden className="h-px flex-1 bg-line" />
    </div>
  );
}

const inputBase =
  'focus-ring block w-full rounded-lg border bg-white px-3.5 text-base text-ink placeholder:text-muted/70 min-h-12';

function describedBy(...ids: (string | undefined)[]) {
  return ids.filter(Boolean).join(' ') || undefined;
}

type TextFieldProps = Omit<ComponentProps<'input'>, 'id'> & {
  label: string;
  hint?: ReactNode;
  error?: string;
  inputClassName?: string;
  /** The word shown after the label for a field that may stay empty, e.g. t('common.optional'). */
  optional?: string;
};

export function TextField({ label, hint, error, optional, className = '', inputClassName = '', ...input }: TextFieldProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  return (
    <div className={className}>
      <FieldLabel htmlFor={id} label={label} optional={optional} />
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(errorId, hintId)}
        className={`${inputBase} ${error ? 'border-danger' : 'border-field'} ${inputClassName}`}
        {...input}
      />
      {hint && (
        <p id={hintId} className="mt-1.5 text-sm text-muted">
          {hint}
        </p>
      )}
      {error && <FieldMessage id={errorId}>{error}</FieldMessage>}
    </div>
  );
}

export function PasswordField({
  label,
  hint,
  error,
  className = '',
  ...input
}: Omit<TextFieldProps, 'type' | 'inputClassName'>) {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-ink">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(errorId, hintId)}
          className={`${inputBase} pr-12 ${error ? 'border-danger' : 'border-field'}`}
          {...input}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-pressed={visible}
          aria-controls={id}
          aria-label={t('common.showPassword')}
          className="focus-ring absolute inset-y-0 right-0 grid w-12 place-items-center rounded-r-lg text-muted hover:text-ink"
        >
          {visible ? <EyeOff aria-hidden className="size-5" /> : <Eye aria-hidden className="size-5" />}
        </button>
      </div>
      {hint && (
        <p id={hintId} className="mt-1.5 text-sm text-muted">
          {hint}
        </p>
      )}
      {error && <FieldMessage id={errorId}>{error}</FieldMessage>}
    </div>
  );
}

/** The label row: the label, and "(optional)" for fields that may stay empty. */
function FieldLabel({ htmlFor, label, optional }: { htmlFor: string; label: string; optional?: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-semibold text-ink">
      {label}
      {optional && <span className="ml-1.5 font-normal text-muted">({optional})</span>}
    </label>
  );
}

type SelectFieldProps = Omit<ComponentProps<'select'>, 'id'> & {
  label: string;
  hint?: ReactNode;
  error?: string;
  optional?: string;
};

export function SelectField({ label, hint, error, optional, className = '', children, ...select }: SelectFieldProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  return (
    <div className={className}>
      <FieldLabel htmlFor={id} label={label} optional={optional} />
      <select
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(errorId, hintId)}
        className={`${inputBase} pr-8 ${error ? 'border-danger' : 'border-field'}`}
        {...select}
      >
        {children}
      </select>
      {hint && (
        <p id={hintId} className="mt-1.5 text-sm text-muted">
          {hint}
        </p>
      )}
      {error && <FieldMessage id={errorId}>{error}</FieldMessage>}
    </div>
  );
}

type TextAreaFieldProps = Omit<ComponentProps<'textarea'>, 'id'> & {
  label: string;
  hint?: ReactNode;
  error?: string;
  optional?: string;
};

export function TextAreaField({ label, hint, error, optional, className = '', ...area }: TextAreaFieldProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  return (
    <div className={className}>
      <FieldLabel htmlFor={id} label={label} optional={optional} />
      <textarea
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(errorId, hintId)}
        className={`${inputBase} min-h-24 py-2.5 ${error ? 'border-danger' : 'border-field'}`}
        {...area}
      />
      {hint && (
        <p id={hintId} className="mt-1.5 text-sm text-muted">
          {hint}
        </p>
      )}
      {error && <FieldMessage id={errorId}>{error}</FieldMessage>}
    </div>
  );
}

export function FieldMessage({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <p id={id} className="mt-1.5 flex items-start gap-1.5 text-sm font-medium text-danger">
      <CircleExclamationPoint aria-hidden className="mt-0.5 size-4 shrink-0" />
      <span>{children}</span>
    </p>
  );
}
