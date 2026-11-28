import { useTranslation } from 'react-i18next';
import { useCurrentUser } from '../features/auth/api';

export type NavLink = { to: string; label: string };

/** The pages the signed-in user's role can open. Shown in the header (wide screens) and the account menu. */
export function useRoleLinks(): NavLink[] {
  const { t } = useTranslation();
  const { user } = useCurrentUser();
  if (user?.role === 'EMPLOYER') return [{ to: '/employer/profile', label: t('nav.businessProfile') }];
  if (user?.role === 'ADMIN') return [{ to: '/admin/verification', label: t('nav.verification') }];
  return [];
}
