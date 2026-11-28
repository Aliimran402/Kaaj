import {
  BadgeCheck,
  Building,
  CalendarDays,
  Clock,
  FileText,
  MessageSquare,
  ShieldCheck,
  ShieldExclamationPoint,
  ShieldQuestionMark,
  type LucideIcon,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { VerificationStatusBadge, VerifiedBadge } from '../../components/VerificationBadges';
import { Button, Card } from '../../components/ui';
import { formatDate } from '../../lib/format';
import type { EmployerProfile, VerificationStatus } from './types';

const LOOK: Record<VerificationStatus, { box: string; icon: LucideIcon; iconClass: string }> = {
  UNVERIFIED: { box: 'border-line bg-page', icon: ShieldQuestionMark, iconClass: 'text-muted' },
  PENDING: { box: 'border-warning/30 bg-warning-soft', icon: Clock, iconClass: 'text-warning' },
  VERIFIED: { box: 'border-success/30 bg-success-soft', icon: BadgeCheck, iconClass: 'text-success' },
  REJECTED: { box: 'border-danger/30 bg-danger-soft', icon: ShieldExclamationPoint, iconClass: 'text-danger' },
};

type Props = {
  profile: EmployerProfile | null;
  onResubmit?: () => void;
  resubmitting?: boolean;
};

/** The "Verification status" column: one banner per state, the reason after a rejection, then the details. */
export function VerificationPanel({ profile, onResubmit, resubmitting = false }: Props) {
  const { t, i18n } = useTranslation();
  const language = i18n.resolvedLanguage ?? 'bn';
  const status: VerificationStatus = profile?.status ?? 'UNVERIFIED';
  const look = LOOK[status];
  const missing = profile?.missing ?? [];

  return (
    <Card className="space-y-5">
      <h2 className="flex items-center gap-2 text-lg font-bold text-ink">
        <ShieldCheck aria-hidden className="size-6 text-brand" />
        {t('verification.title')}
      </h2>

      <div data-testid="verification-banner" className={`flex items-start gap-3 rounded-xl border p-4 ${look.box}`}>
        <look.icon aria-hidden className={`size-9 shrink-0 ${look.iconClass}`} />
        <div>
          <p className="font-bold text-ink">{t(`verification.status.${status}`)}</p>
          <p className="mt-1 text-sm text-ink">{t(`verification.banner.${status}`)}</p>
        </div>
      </div>

      {status === 'REJECTED' && profile?.verificationNote && (
        <div className="rounded-xl border border-danger/30 bg-white p-4 text-sm">
          <p className="font-semibold text-danger">{t('verification.reason')}</p>
          <p className="mt-1 text-ink">{profile.verificationNote}</p>
          {onResubmit && profile.hasDocument && (
            <Button variant="secondary" className="mt-3" loading={resubmitting} onClick={onResubmit}>
              {t('verification.resubmit')}
            </Button>
          )}
        </div>
      )}

      {profile && missing.length > 0 && status !== 'VERIFIED' && (
        <div className="text-sm">
          <p className="font-semibold text-ink">{t('verification.missing')}</p>
          <ul className="mt-1 list-disc space-y-0.5 pl-5 text-muted">
            {missing.map((field) => (
              <li key={field}>{t(`employerProfile.missing.${field}`)}</li>
            ))}
          </ul>
        </div>
      )}

      {/* The badge exactly as job seekers will see it next to the business name on each job post. */}
      <div className="rounded-xl border border-line p-4">
        <p className="text-xs font-semibold text-muted">{t('verification.previewTitle')}</p>
        <div className="mt-2 flex items-center gap-2">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand">
            <Building aria-hidden className="size-5" />
          </span>
          <p className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 font-semibold text-ink">
            <span className="truncate">{profile?.name ?? t('employerProfile.namePlaceholder')}</span>
            <VerifiedBadge verified={profile?.verified ?? false} />
          </p>
        </div>
        <p className="mt-2 text-xs text-muted">
          {profile?.verified ? t('verification.badgeExplain') : t('verification.previewLater')}
        </p>
      </div>

      {profile && (
        <div className="border-t border-line pt-4">
          <h3 className="font-bold text-ink">{t('verification.details')}</h3>
          <dl className="mt-3 grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 gap-y-3 text-sm">
            <Row icon={CalendarDays} label={t('verification.submittedAt')}>
              {profile.submittedAt ? formatDate(profile.submittedAt, language) : t('common.notSet')}
            </Row>
            <Row icon={ShieldCheck} label={t('verification.title')}>
              <VerificationStatusBadge status={status} />
            </Row>
            {status === 'VERIFIED' && profile.verifiedAt && (
              <Row icon={BadgeCheck} label={t('verification.verifiedAt')}>
                {formatDate(profile.verifiedAt, language)}
              </Row>
            )}
            {status === 'VERIFIED' && profile.verificationNote && (
              <Row icon={MessageSquare} label={t('verification.note')}>
                {profile.verificationNote}
              </Row>
            )}
            <Row icon={FileText} label={t('verification.document')}>
              {profile.hasDocument && profile.documentType
                ? `${t(`employerProfile.docTypes.${profile.documentType}`)} · ${profile.documentName ?? ''}`
                : t('verification.noDocument')}
            </Row>
          </dl>
        </div>
      )}

      {status === 'VERIFIED' && (
        <p className="rounded-xl bg-brand-soft p-3 text-xs text-ink">{t('verification.changeWarning')}</p>
      )}
    </Card>
  );
}

function Row({ icon: Icon, label, children }: { icon: LucideIcon; label: string; children: ReactNode }) {
  return (
    <>
      <dt className="flex items-center gap-2 text-muted">
        <Icon aria-hidden className="size-4 shrink-0" />
        {label}
      </dt>
      <dd className="font-medium break-words text-ink">{children}</dd>
    </>
  );
}
