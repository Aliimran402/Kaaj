import {
  ArrowRight,
  BadgeCheck,
  Building,
  BriefcaseBusiness,
  CircleCheck,
  Clock,
  Flag,
  ListOrdered,
  Search,
  ShieldCheck,
  UserRound,
  UsersRound,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Badge, ButtonLink, Card, Container, PageBanner, Spinner } from '../../components/ui';
import { formatNumber } from '../../lib/format';
import { usePageTitle } from '../../lib/usePageTitle';
import { useCurrentUser, type Me, type Role } from '../auth/api';
import { ExampleJobCard } from './ExampleJobCard';

export function HomePage() {
  const { t } = useTranslation();
  usePageTitle(t('home.title'));
  const { user, isLoading } = useCurrentUser();
  if (isLoading) return <Spinner />;
  return user ? <SignedInHome user={user} /> : <GuestHome />;
}

function GuestHome() {
  const { t } = useTranslation();
  return (
    <>
      <section className="border-b border-line-strong/50 bg-brand-soft">
        <Container className="grid items-center gap-10 py-10 sm:py-14 lg:grid-cols-[minmax(0,1fr)_24rem]">
          <div>
            <p className="inline-flex items-center gap-1.5 rounded-full border border-brand/15 bg-white px-3 py-1 text-sm font-semibold text-brand">
              <ShieldCheck aria-hidden className="size-4" />
              {t('home.hero.badge')}
            </p>
            <h1 className="mt-4 text-3xl leading-snug font-bold tracking-tight text-ink sm:text-4xl lg:text-5xl lg:leading-snug">
              {t('home.hero.title')}
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-muted">{t('home.hero.subtitle')}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink to="/register" size="lg">
                {t('home.hero.primary')}
                <ArrowRight aria-hidden className="size-5" />
              </ButtonLink>
              <ButtonLink to="/login" size="lg" variant="secondary">
                {t('home.hero.secondary')}
              </ButtonLink>
            </div>
          </div>
          <ExampleJobCard />
        </Container>
      </section>
      <HowItWorks showSignUp />
    </>
  );
}

const NEXT_STEPS: Record<Role, readonly { key: 'one' | 'two' | 'three'; icon: typeof Search }[]> = {
  SEEKER: [
    { key: 'one', icon: UserRound },
    { key: 'two', icon: BadgeCheck },
    { key: 'three', icon: Search },
  ],
  EMPLOYER: [
    { key: 'one', icon: Building },
    { key: 'two', icon: BriefcaseBusiness },
    { key: 'three', icon: ListOrdered },
  ],
  ADMIN: [
    { key: 'one', icon: BadgeCheck },
    { key: 'two', icon: Flag },
    { key: 'three', icon: UsersRound },
  ],
};

function SignedInHome({ user }: { user: Me }) {
  const { t } = useTranslation();
  return (
    <>
      <PageBanner title={t('home.welcome.title')} subtitle={t('home.welcome.subtitle', { email: user.email })} />
      <Container className="grid gap-6 py-8 sm:py-10 lg:grid-cols-[20rem_minmax(0,1fr)] lg:items-start">
        <Card>
          <h2 className="font-bold text-ink">{t('home.account.title')}</h2>
          <dl className="mt-4 space-y-4 text-sm">
            <div>
              <dt className="text-muted">{t('home.account.email')}</dt>
              <dd className="font-semibold break-all text-ink">{user.email}</dd>
            </div>
            <div>
              <dt className="text-muted">{t('home.account.type')}</dt>
              <dd className="mt-1">
                <Badge>{t(`account.role.${user.role}`)}</Badge>
              </dd>
            </div>
            <div>
              <dt className="text-muted">{t('home.account.status')}</dt>
              <dd className="mt-1">
                <Badge tone={user.status === 'ACTIVE' ? 'success' : 'warning'}>
                  <CircleCheck aria-hidden className="size-3.5" />
                  {t(`account.status.${user.status}`)}
                </Badge>
              </dd>
            </div>
          </dl>
        </Card>
        <Card>
          <h2 className="font-bold text-ink">{t('home.next.title')}</h2>
          <ul className="mt-4 divide-y divide-line">
            {NEXT_STEPS[user.role].map(({ key, icon: Icon }) => (
              <li key={key} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0 sm:items-center">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand">
                  <Icon aria-hidden className="size-5" />
                </span>
                {/* On phones the badge goes under the text, so the text keeps the full width. */}
                <div className="flex min-w-0 flex-1 flex-col items-start gap-1.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                  <span className="text-sm text-ink">{t(`home.next.${user.role}.${key}`)}</span>
                  <Badge tone="neutral">
                    <Clock aria-hidden className="size-3.5" />
                    {t('common.comingSoon')}
                  </Badge>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </Container>
      <HowItWorks showSignUp={false} />
    </>
  );
}

const GROUPS = [
  { key: 'seekers', role: 'SEEKER', icon: UserRound },
  { key: 'employers', role: 'EMPLOYER', icon: Building },
] as const;

const STEPS = ['step1', 'step2', 'step3'] as const;

function HowItWorks({ showSignUp }: { showSignUp: boolean }) {
  const { t, i18n } = useTranslation();
  const language = i18n.resolvedLanguage ?? 'bn';
  return (
    <section id="how-it-works" aria-labelledby="how-it-works-title" className="scroll-mt-4">
      <Container className="py-12 sm:py-16">
        <h2 id="how-it-works-title" className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
          {t('home.how.title')}
        </h2>
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          {GROUPS.map(({ key, role, icon: Icon }) => (
            <Card key={key} className="flex flex-col">
              <h3 className="flex items-center gap-3 text-lg font-bold text-ink">
                <span className="grid size-10 place-items-center rounded-lg bg-brand-soft text-brand">
                  <Icon aria-hidden className="size-5" />
                </span>
                {t(`home.how.${key}.title`)}
              </h3>
              <ol className="mt-5 flex-1 space-y-4">
                {STEPS.map((step, index) => (
                  <li key={step} className="flex gap-3">
                    <span
                      aria-hidden
                      className="grid size-7 shrink-0 place-items-center rounded-full border border-brand/20 bg-brand-soft text-sm font-bold text-brand"
                    >
                      {formatNumber(index + 1, language)}
                    </span>
                    <span>
                      <span className="block font-semibold text-ink">{t(`home.how.${key}.${step}.title`)}</span>
                      <span className="block text-sm text-muted">{t(`home.how.${key}.${step}.text`)}</span>
                    </span>
                  </li>
                ))}
              </ol>
              {showSignUp && (
                <ButtonLink to={`/register?role=${role}`} variant="secondary" className="mt-6 self-start">
                  {t(`home.how.${key}.cta`)}
                  <ArrowRight aria-hidden className="size-4" />
                </ButtonLink>
              )}
            </Card>
          ))}
        </div>
      </Container>
    </section>
  );
}
