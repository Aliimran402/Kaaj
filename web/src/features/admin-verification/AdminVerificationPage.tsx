import {
  ArrowLeft,
  Building,
  CalendarDays,
  CircleCheck,
  CircleX,
  ExternalLink,
  FileText,
  Inbox,
  Mail,
  MapPin,
  Phone,
  UserRound,
  type LucideIcon,
} from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MapPicker } from '../../components/MapPicker';
import { VerificationStatusBadge } from '../../components/VerificationBadges';
import { Alert, Button, Card, Container, ErrorAlert, PageBanner, Spinner, TextAreaField } from '../../components/ui';
import { formatDate, formatNumber, localDigits } from '../../lib/format';
import { usePageTitle } from '../../lib/usePageTitle';
import { QUEUE_STATUSES, type AdminEmployer, type QueueStatus } from '../employer-profile/types';
import { useDecision, useVerificationCounts, useVerificationQueue } from './api';

const QUICK_REASONS = ['unreadable', 'nameMismatch', 'expired', 'address'] as const;

/** View: the admin's employer verification queue (oldest first) and the decision panel beside it. */
export function AdminVerificationPage() {
  const { t, i18n } = useTranslation();
  const language = i18n.resolvedLanguage ?? 'bn';
  usePageTitle(t('adminVerification.title'));
  const [status, setStatus] = useState<QueueStatus>('PENDING');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const queue = useVerificationQueue(status);
  const counts = useVerificationCounts();
  const items = queue.data?.pages.flatMap((page) => page.items) ?? [];
  const selected = items.find((item) => item.id === selectedId) ?? null;

  function chooseTab(tab: QueueStatus) {
    setStatus(tab);
    setSelectedId(null);
    setNotice(null);
  }

  return (
    <>
      <PageBanner title={t('adminVerification.title')} subtitle={t('adminVerification.subtitle')} />
      <Container className="grid gap-6 py-8 sm:py-10 lg:grid-cols-[22rem_minmax(0,1fr)] lg:items-start">
        {/* On phones the list and the selected employer take turns; on wide screens they sit side by side. */}
        <Card className={`p-3 sm:p-4 ${selected ? 'max-lg:hidden' : ''}`}>
          <div
            role="group"
            aria-label={t('adminVerification.queueLabel')}
            className="grid grid-cols-3 gap-1 rounded-xl bg-page p-1"
          >
            {QUEUE_STATUSES.map((tab) => (
              <button
                key={tab}
                type="button"
                aria-pressed={status === tab}
                onClick={() => chooseTab(tab)}
                className={`focus-ring min-h-11 rounded-lg px-1 text-sm font-semibold transition-colors ${
                  status === tab ? 'bg-white text-brand shadow-sm' : 'text-muted hover:text-ink'
                }`}
              >
                {t(`adminVerification.tabs.${tab}`)}{' '}
                <span className="font-normal">({formatNumber(counts.data?.[tab] ?? 0, language)})</span>
              </button>
            ))}
          </div>

          {notice && (
            <Alert tone="success" className="mt-3">
              <p>{notice}</p>
            </Alert>
          )}

          {queue.isPending && <Spinner />}
          {queue.isError && (
            <div className="mt-3">
              <ErrorAlert error={queue.error} />
            </div>
          )}
          {queue.isSuccess && items.length === 0 && (
            <p className="flex flex-col items-center gap-2 py-12 text-sm text-muted">
              <Inbox aria-hidden className="size-8" />
              {t('adminVerification.empty')}
            </p>
          )}
          <ul className="mt-3 space-y-2">
            {items.map((employer) => (
              <li key={employer.id}>
                <button
                  type="button"
                  aria-current={selectedId === employer.id || undefined}
                  onClick={() => {
                    setSelectedId(employer.id);
                    setNotice(null);
                  }}
                  className={`focus-ring w-full rounded-xl border p-3 text-left transition-colors ${
                    selectedId === employer.id ? 'border-brand bg-brand-soft' : 'border-line bg-white hover:border-brand/40'
                  }`}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate font-semibold text-ink">{employer.name}</span>
                    <VerificationStatusBadge status={employer.status} />
                  </span>
                  <span className="mt-1 block text-xs text-muted">
                    {t(`employerProfile.kinds.${employer.kind}`)} · {t('adminVerification.submitted')}:{' '}
                    {formatDate(employer.submittedAt, language)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          {queue.hasNextPage && (
            <Button
              variant="ghost"
              className="mt-2 w-full"
              loading={queue.isFetchingNextPage}
              onClick={() => void queue.fetchNextPage()}
            >
              {t('common.loadMore')}
            </Button>
          )}
        </Card>

        {selected ? (
          <DecisionPanel
            key={selected.id}
            employer={selected}
            onBack={() => setSelectedId(null)}
            onDone={(message) => {
              setNotice(message);
              setSelectedId(null);
            }}
          />
        ) : (
          <Card className="flex flex-col items-center gap-3 py-16 text-center text-muted max-lg:hidden">
            <Building aria-hidden className="size-10" />
            <p>{t('adminVerification.select')}</p>
          </Card>
        )}
      </Container>
    </>
  );
}

function DecisionPanel({
  employer,
  onBack,
  onDone,
}: {
  employer: AdminEmployer;
  onBack: () => void;
  onDone: (message: string) => void;
}) {
  const { t, i18n } = useTranslation();
  const language = i18n.resolvedLanguage ?? 'bn';
  const decide = useDecision();
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState<string | undefined>();

  function approve() {
    if (decide.isPending) return;
    decide.mutate(
      { id: employer.id, decision: 'APPROVE', reason: reason.trim() || null },
      { onSuccess: () => onDone(t('adminVerification.approved')) },
    );
  }

  function reject() {
    if (decide.isPending) return;
    if (!reason.trim()) {
      setReasonError(t('adminVerification.reasonRequired'));
      return;
    }
    decide.mutate(
      { id: employer.id, decision: 'REJECT', reason: reason.trim() },
      { onSuccess: () => onDone(t('adminVerification.rejected')) },
    );
  }

  return (
    <Card className="space-y-6">
      <Button variant="ghost" className="-mt-2 -ml-2 px-2 lg:hidden" onClick={onBack}>
        <ArrowLeft aria-hidden className="size-4" />
        {t('adminVerification.back')}
      </Button>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-xl font-bold break-words text-ink">{employer.name}</h2>
          <p className="text-sm text-muted">{t(`employerProfile.kinds.${employer.kind}`)}</p>
        </div>
        <VerificationStatusBadge status={employer.status} />
      </div>

      <dl className="grid gap-4 text-sm sm:grid-cols-2">
        <Info icon={MapPin} label={t('employerProfile.address')} value={employer.address} />
        <Info icon={UserRound} label={t('employerProfile.contactPerson')} value={employer.contactPerson} />
        <Info
          icon={Phone}
          label={t('employerProfile.contactPhone')}
          value={employer.contactPhone && localDigits(employer.contactPhone, language)}
        />
        <Info icon={Mail} label={t('adminVerification.owner')} value={employer.ownerEmail} />
        {employer.contactEmail && (
          <Info icon={Mail} label={t('employerProfile.contactEmail')} value={employer.contactEmail} />
        )}
        <Info
          icon={FileText}
          label={t('employerProfile.documentType')}
          value={employer.documentType && t(`employerProfile.docTypes.${employer.documentType}`)}
        />
        <Info icon={CalendarDays} label={t('adminVerification.submitted')} value={formatDate(employer.submittedAt, language)} />
      </dl>

      {employer.latitude != null && employer.longitude != null && (
        <MapPicker readOnly value={{ lat: employer.latitude, lng: employer.longitude }} height={180} />
      )}

      <section aria-labelledby="document-heading">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h3 id="document-heading" className="font-bold text-ink">
            {t('adminVerification.documentTitle')}
          </h3>
          {employer.documentUrl && (
            <a
              href={employer.documentUrl}
              target="_blank"
              rel="noreferrer"
              className="focus-ring inline-flex min-h-11 items-center gap-1.5 rounded text-sm font-semibold text-brand underline underline-offset-2"
            >
              {t('adminVerification.openDocument')}
              <ExternalLink aria-hidden className="size-4" />
            </a>
          )}
        </div>
        {employer.documentUrl ? (
          employer.documentIsPdf ? (
            <iframe
              title={employer.documentName ?? t('adminVerification.documentTitle')}
              src={employer.documentUrl}
              className="h-96 w-full rounded-xl border border-line"
            />
          ) : (
            <img
              src={employer.documentUrl}
              alt={employer.documentName ?? t('adminVerification.documentTitle')}
              className="max-h-96 w-full rounded-xl border border-line bg-page object-contain"
            />
          )
        ) : (
          <p className="text-sm text-muted">{t('adminVerification.noDocument')}</p>
        )}
      </section>

      {employer.verificationNote && (
        <Alert tone={employer.status === 'REJECTED' ? 'error' : 'info'}>
          <p className="font-semibold">
            {employer.status === 'REJECTED' ? t('verification.reason') : t('verification.note')}
          </p>
          <p>{employer.verificationNote}</p>
        </Alert>
      )}

      {employer.status === 'PENDING' && (
        <div className="space-y-4 border-t border-line pt-5">
          <div>
            <p className="mb-2 text-sm font-semibold text-ink">{t('adminVerification.quickReasonsLabel')}</p>
            <div className="flex flex-wrap gap-2">
              {QUICK_REASONS.map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setReason(t(`adminVerification.quickReasons.${key}`));
                    setReasonError(undefined);
                  }}
                  className="focus-ring min-h-11 rounded-full border border-line-strong bg-white px-3 text-sm text-ink hover:bg-brand-soft"
                >
                  {t(`adminVerification.quickReasons.${key}`)}
                </button>
              ))}
            </div>
          </div>
          <TextAreaField
            label={t('adminVerification.decisionLabel')}
            hint={t('adminVerification.decisionHint')}
            error={reasonError}
            maxLength={500}
            value={reason}
            onChange={(event) => {
              setReason(event.target.value);
              setReasonError(undefined);
            }}
          />
          <ErrorAlert error={decide.error} />
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              size="lg"
              loading={decide.isPending && decide.variables?.decision === 'APPROVE'}
              disabled={decide.isPending && decide.variables?.decision === 'REJECT'}
              onClick={approve}
            >
              <CircleCheck aria-hidden className="size-5" />
              {t('adminVerification.approve')}
            </Button>
            <Button
              size="lg"
              variant="danger"
              loading={decide.isPending && decide.variables?.decision === 'REJECT'}
              disabled={decide.isPending && decide.variables?.decision === 'APPROVE'}
              onClick={reject}
            >
              <CircleX aria-hidden className="size-5" />
              {t('adminVerification.reject')}
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}

function Info({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string | null | undefined }) {
  return (
    <div className="flex items-start gap-2">
      <Icon aria-hidden className="mt-0.5 size-4 shrink-0 text-muted" />
      <div className="min-w-0">
        <dt className="text-xs text-muted">{label}</dt>
        <dd className="font-medium break-words text-ink">{value || '—'}</dd>
      </div>
    </div>
  );
}
