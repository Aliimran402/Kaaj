const AUTH_PAGES = ['/login', '/register', '/verify'];

/**
 * Where to go after signing in. Only paths inside this app are allowed ("/jobs", not "//evil.com"
 * or "https://…"), so a crafted ?next= link can't send people to another site.
 */
export function safeNext(next: string | null | undefined): string {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) return '/';
  const path = next.split(/[?#]/)[0];
  return AUTH_PAGES.includes(path) ? '/' : next;
}

/** The sign-in page, coming back to `path` afterwards. */
export function loginPathFor(path: string): string {
  return path === '/' ? '/login' : `/login?next=${encodeURIComponent(path)}`;
}
