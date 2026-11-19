import { SearchX } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ButtonLink, Card, Container } from '../../components/ui';
import { usePageTitle } from '../../lib/usePageTitle';

export function NotFoundPage() {
  const { t } = useTranslation();
  usePageTitle(t('notFound.title'));
  return (
    <Container className="py-16">
      <Card className="mx-auto max-w-lg text-center">
        <SearchX aria-hidden className="mx-auto size-10 text-brand" />
        <h1 className="mt-3 text-xl font-bold text-ink">{t('notFound.title')}</h1>
        <p className="mt-2 text-muted">{t('notFound.text')}</p>
        <ButtonLink to="/" className="mt-6">
          {t('common.goHome')}
        </ButtonLink>
      </Card>
    </Container>
  );
}
