import { BadgeCheck, CircleCheck, Clock, MapPin, Truck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Badge } from '../../components/ui';
import { formatNumber } from '../../lib/format';

/** A sample job card on the landing page, in the Figma style: wage, place, shift and the match reason up front. */
export function ExampleJobCard() {
  const { t, i18n } = useTranslation();
  const language = i18n.resolvedLanguage ?? 'bn';
  const n = (value: number) => formatNumber(value, language);
  return (
    <figure className="rounded-2xl border border-line bg-white p-5 shadow-lg shadow-brand/5 sm:p-6">
      <figcaption className="mb-4 text-xs font-semibold text-muted">{t('home.example.label')}</figcaption>
      <div className="flex items-start gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">
          <Truck aria-hidden className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="text-lg font-bold text-ink">{t('home.example.title')}</p>
          <p className="flex flex-wrap items-center gap-x-2 text-sm text-muted">
            {t('home.example.employer')}
            <span className="inline-flex items-center gap-1 font-semibold text-success">
              <BadgeCheck aria-hidden className="size-4" />
              {t('home.example.verified')}
            </span>
          </p>
        </div>
      </div>
      <p className="mt-4 text-2xl font-bold text-brand">
        ৳{n(16000)}–{n(20000)} <span className="text-sm font-medium text-muted">{t('home.example.perMonth')}</span>
      </p>
      <p className="mt-2 flex items-center gap-1.5 text-sm text-muted">
        <MapPin aria-hidden className="size-4 shrink-0" />
        {t('home.example.place', { km: n(4) })}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Badge>{t('home.example.fullTime')}</Badge>
        <Badge tone="neutral">
          <Clock aria-hidden className="size-3.5" />
          {t('home.example.dayShift')}
        </Badge>
      </div>
      <p className="mt-4 flex items-center gap-2 rounded-lg bg-success-soft px-3 py-2 text-sm font-medium text-success">
        <CircleCheck aria-hidden className="size-4 shrink-0" />
        {t('home.example.reason')}
      </p>
    </figure>
  );
}
