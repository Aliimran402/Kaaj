import { ShieldCheck } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, Outlet, ScrollRestoration, useLocation } from 'react-router';
import { useCurrentUser } from '../features/auth/api';
import { formatNumber } from '../lib/format';
import { LanguageSwitch } from './LanguageSwitch';
import { Logo } from './Logo';
import { Button, ButtonLink, Container } from './ui';
import { UserMenu } from './UserMenu';

/** Links in the header. Add your feature's pages here (and use the role to show them only to the right people). */
function useNavLinks() {
  const { t } = useTranslation();
  return [{ to: '/#how-it-works', label: t('nav.howItWorks') }];
}

export function AppLayout() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const mainRef = useRef<HTMLElement>(null);
  const lastPath = useRef(pathname);

  // After moving to another page, start keyboard and screen-reader users at the new page's content.
  useEffect(() => {
    if (lastPath.current === pathname) return;
    lastPath.current = pathname;
    mainRef.current?.focus({ preventScroll: true });
  }, [pathname]);

  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main"
        className="focus-ring sr-only z-50 rounded-lg bg-white px-4 py-2 font-semibold text-brand focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        {t('nav.skipToContent')}
      </a>
      <Header />
      <ServerUnreachableNotice />
      <main id="main" ref={mainRef} tabIndex={-1} className="flex-1 outline-none">
        <Outlet />
      </main>
      <Footer />
      <ScrollRestoration />
    </div>
  );
}

function Header() {
  const { t } = useTranslation();
  const { user, isLoading } = useCurrentUser();
  const links = useNavLinks();
  return (
    <header className="border-b border-line bg-white">
      <Container className="flex min-h-16 items-center gap-3 py-2">
        <Logo />
        <nav aria-label={t('nav.label')} className="mx-auto hidden md:block">
          <ul className="flex items-center gap-6">
            {links.map((link) => (
              <li key={link.to}>
                <Link to={link.to} className="focus-ring rounded text-sm font-medium text-muted hover:text-brand">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="ml-auto flex items-center gap-2 md:ml-0">
          <LanguageSwitch />
          {isLoading ? (
            <span aria-hidden className="size-11 animate-pulse rounded-full bg-page" />
          ) : user ? (
            <UserMenu user={user} />
          ) : (
            <>
              <ButtonLink to="/login" variant="secondary" className="px-3 whitespace-nowrap sm:px-4">
                {t('account.signIn')}
              </ButtonLink>
              {/* max-sm:hidden, not "hidden sm:inline-flex": the button's own inline-flex would win over hidden */}
              <ButtonLink to="/register" className="whitespace-nowrap max-sm:hidden">
                {t('account.createAccount')}
              </ButtonLink>
            </>
          )}
        </div>
      </Container>
    </header>
  );
}

/** Shown when GET /me fails for a reason other than "not signed in", e.g. the backend isn't running. */
function ServerUnreachableNotice() {
  const { t } = useTranslation();
  const { isError, refetch } = useCurrentUser();
  if (!isError) return null;
  return (
    <div role="status" className="border-b border-warning/30 bg-warning-soft text-warning">
      <Container className="flex flex-wrap items-center gap-x-4 gap-y-1 py-2 text-sm">
        <p className="font-medium">{t('errors.serverUnreachable')}</p>
        <Button variant="ghost" className="min-h-9 px-2 text-warning" onClick={() => void refetch()}>
          {t('common.tryAgain')}
        </Button>
      </Container>
    </div>
  );
}

const THIS_YEAR = new Date().getFullYear();

function Footer() {
  const { t, i18n } = useTranslation();
  const year = formatNumber(THIS_YEAR, i18n.resolvedLanguage ?? 'bn', { useGrouping: false });
  return (
    <footer className="border-t border-line bg-white">
      <Container className="flex flex-col gap-3 py-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-bold text-ink">{t('app.title')}</p>
          <p className="text-sm text-muted">{t('footer.copyright', { year })}</p>
        </div>
        <p className="flex items-center gap-2 text-sm font-medium text-muted">
          <ShieldCheck aria-hidden className="size-4 text-brand" />
          {t('footer.freeForWorkers')}
        </p>
      </Container>
    </footer>
  );
}
