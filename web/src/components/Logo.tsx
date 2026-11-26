import { BriefcaseBusiness } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

export function Logo() {
  const { t } = useTranslation();
  return (
    <Link to="/" aria-label={t('nav.home')} className="focus-ring flex shrink-0 items-center gap-2 rounded-lg">
      <span className="grid size-9 place-items-center rounded-lg bg-brand text-white">
        <BriefcaseBusiness aria-hidden className="size-5" />
      </span>
      <span className="text-xl font-bold tracking-tight text-ink">Kaaj</span>
    </Link>
  );
}
