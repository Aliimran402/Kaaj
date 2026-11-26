import { HandCoins, MessageCircle, ShieldCheck } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, Container, PageBanner } from '../../components/ui';

/** Banner with the page title, the form card, and (on wide screens, beside it) why Kaaj is safe. */
export function AuthShell({ title, subtitle, children }: { title: string; subtitle: ReactNode; children: ReactNode }) {
  return (
    <>
      <PageBanner title={title} subtitle={subtitle} />
      <Container className="grid gap-6 py-8 sm:py-10 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <Card className="w-full max-w-xl">{children}</Card>
        <WhyKaaj />
      </Container>
    </>
  );
}

function WhyKaaj() {
  const { t } = useTranslation();
  const points = [
    { icon: HandCoins, title: t('auth.why.wages.title'), text: t('auth.why.wages.text') },
    { icon: ShieldCheck, title: t('auth.why.safe.title'), text: t('auth.why.safe.text') },
    { icon: MessageCircle, title: t('auth.why.private.title'), text: t('auth.why.private.text') },
  ];
  return (
    <aside aria-labelledby="why-kaaj" className="rounded-2xl border border-brand/15 bg-brand-soft p-5 sm:p-6">
      <h2 id="why-kaaj" className="font-bold text-ink">
        {t('auth.why.title')}
      </h2>
      <ul className="mt-4 space-y-4">
        {points.map(({ icon: Icon, title, text }) => (
          <li key={title} className="flex gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-white text-brand">
              <Icon aria-hidden className="size-5" />
            </span>
            <span>
              <span className="block text-sm font-semibold text-ink">{title}</span>
              <span className="block text-sm text-muted">{text}</span>
            </span>
          </li>
        ))}
      </ul>
    </aside>
  );
}
