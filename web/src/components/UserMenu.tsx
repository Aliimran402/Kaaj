import { ChevronDown, LogOut } from 'lucide-react';
import { useEffect, useId, useRef, useState, type FocusEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { useLogout, type Me } from '../features/auth/api';
import { Badge } from './ui';

/** The signed-in user's menu in the header: who is signed in, and sign out. */
export function UserMenu({ user }: { user: Me }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const logout = useLogout();
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  function closeWhenFocusLeaves(event: FocusEvent<HTMLDivElement>) {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false);
  }

  function signOut() {
    if (logout.isPending) return;
    logout.mutate(undefined, {
      onSuccess: () => {
        setOpen(false);
        void navigate('/');
      },
    });
  }

  return (
    <div ref={rootRef} className="relative" onBlur={closeWhenFocusLeaves}>
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={t('account.menu')}
        onClick={() => setOpen((value) => !value)}
        className="focus-ring flex min-h-11 items-center gap-2 rounded-full border border-line-strong bg-white py-1 pr-2.5 pl-1 text-sm font-semibold text-ink hover:bg-brand-soft"
      >
        <span aria-hidden className="grid size-8 place-items-center rounded-full bg-brand text-sm font-bold text-white uppercase">
          {user.email.charAt(0)}
        </span>
        <span className="hidden md:inline">{t('account.menu')}</span>
        <ChevronDown aria-hidden className={`size-4 text-muted transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          id={panelId}
          className="absolute right-0 z-20 mt-2 w-72 max-w-[calc(100vw-2rem)] rounded-xl border border-line bg-white p-2 shadow-lg"
        >
          <div className="space-y-1.5 px-3 py-2">
            <p className="text-xs text-muted">{t('account.signedInAs')}</p>
            <p className="truncate font-semibold text-ink">{user.email}</p>
            <Badge>{t(`account.role.${user.role}`)}</Badge>
          </div>
          <div className="my-1 h-px bg-line" />
          {logout.isError && (
            <p role="alert" className="px-3 py-2 text-sm text-danger">
              {t('account.signOutFailed')}
            </p>
          )}
          <button
            type="button"
            onClick={signOut}
            aria-disabled={logout.isPending || undefined}
            className="focus-ring flex min-h-11 w-full items-center gap-2 rounded-lg px-3 text-sm font-semibold text-ink hover:bg-page"
          >
            <LogOut aria-hidden className="size-4 text-muted" />
            {logout.isPending ? t('account.signingOut') : t('account.signOut')}
          </button>
        </div>
      )}
    </div>
  );
}
