import { ShieldX } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, Outlet, useLocation, useSearchParams } from 'react-router';
import { ButtonLink, Card, Container, Spinner } from '../../components/ui';
import { usePageTitle } from '../../lib/usePageTitle';
import { useCurrentUser, type Role } from './api';
import { loginPathFor, safeNext } from './redirect';

/**
 * Pages for signed-in users. Use it as a layout route:
 *   { element: <RequireRole roles={['EMPLOYER']} />, children: [ ...employer pages ] }
 * Guests go to the sign-in page and come back afterwards; other roles see a "not for you" message.
 * The server checks the role too (SecurityConfig); this only keeps people out of pages they can't use.
 */
export function RequireRole({ roles, children }: { roles?: readonly Role[]; children?: ReactNode }) {
  const { user, isLoading } = useCurrentUser();
  const location = useLocation();
  if (isLoading) return <Spinner />;
  if (!user) return <Navigate to={loginPathFor(location.pathname + location.search)} replace />;
  if (roles && !roles.includes(user.role)) return <NoAccess />;
  return children ?? <Outlet />;
}

/** Sign-in, sign-up and verify pages: a signed-in user goes on to ?next= (or home). */
export function GuestOnly() {
  const { user, isLoading } = useCurrentUser();
  const [params] = useSearchParams();
  if (isLoading) return <Spinner />;
  if (user) return <Navigate to={safeNext(params.get('next'))} replace />;
  return <Outlet />;
}

function NoAccess() {
  const { t } = useTranslation();
  usePageTitle(t('guard.noAccessTitle'));
  return (
    <Container className="py-16">
      <Card className="mx-auto max-w-lg text-center">
        <ShieldX aria-hidden className="mx-auto size-10 text-danger" />
        <h1 className="mt-3 text-xl font-bold text-ink">{t('guard.noAccessTitle')}</h1>
        <p className="mt-2 text-muted">{t('guard.noAccessText')}</p>
        <ButtonLink to="/" className="mt-6">
          {t('common.goHome')}
        </ButtonLink>
      </Card>
    </Container>
  );
}
