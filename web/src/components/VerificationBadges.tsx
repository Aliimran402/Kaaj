import { BadgeCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { VerificationStatus } from '../features/employer-profile/types';
import { Badge, type BadgeTone } from './ui';

const TONE: Record<VerificationStatus, BadgeTone> = {
  UNVERIFIED: 'neutral',
  PENDING: 'warning',
  VERIFIED: 'success',
  REJECTED: 'danger',
};

/** An employer's verification status, for the employer's own panel and the admin's queue. */
export function VerificationStatusBadge({ status }: { status: VerificationStatus }) {
  const { t } = useTranslation();
  return <Badge tone={TONE[status]}>{t(`verification.status.${status}`)}</Badge>;
}

/**
 * The "Verified" badge an approved employer gets on every job post. Job cards and job pages (M1-4, Member-1's
 * search) show it next to the employer's name: <VerifiedBadge verified={job.employer.verified} />.
 */
export function VerifiedBadge({ verified }: { verified: boolean }) {
  const { t } = useTranslation();
  if (!verified) return null;
  return (
    <Badge tone="success">
      <BadgeCheck aria-hidden className="size-3.5" />
      {t('verification.badge')}
    </Badge>
  );
}
