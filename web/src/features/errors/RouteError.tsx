import { TriangleExclamationPoint } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button, Card } from '../../components/ui';
import { usePageTitle } from '../../lib/usePageTitle';

/** Shown instead of the whole app when a page crashes while rendering. */
export function RouteError() {
  const { t } = useTranslation();
  usePageTitle(t('routeError.title'));
  return (
    <main className="grid min-h-dvh place-items-center p-4">
      <Card className="max-w-md text-center">
        <TriangleExclamationPoint aria-hidden className="mx-auto size-10 text-warning" />
        <h1 className="mt-3 text-xl font-bold text-ink">{t('routeError.title')}</h1>
        <p className="mt-2 text-muted">{t('routeError.text')}</p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Button onClick={() => window.location.reload()}>{t('common.reload')}</Button>
          <a
            href="/"
            className="focus-ring inline-flex min-h-11 items-center justify-center rounded-lg px-4 font-semibold text-brand hover:bg-brand-soft"
          >
            {t('common.goHome')}
          </a>
        </div>
      </Card>
    </main>
  );
}
