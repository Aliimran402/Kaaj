import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError, apiFetch } from '../../lib/api';

// The identity module's API (AuthController and MeController).

export type Role = 'SEEKER' | 'EMPLOYER' | 'ADMIN';
/** Only an admin can make another admin, so sign-up offers these two. */
export type SignUpRole = Exclude<Role, 'ADMIN'>;
export type UserStatus = 'ACTIVE' | 'SUSPENDED';

/** AuthController.MeResponse */
export type Me = {
  id: string;
  email: string;
  role: Role;
  locale: string;
  status: UserStatus;
};

type CodeSent = { status: 'CODE_SENT' };

export const meQueryKey = ['me'] as const;

async function fetchMe(signal: AbortSignal): Promise<Me | null> {
  try {
    return await apiFetch<Me>('/api/v1/me', { signal });
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return null; // a guest
    throw error;
  }
}

/** The signed-in user, or null for a guest. Also gives the browser its CSRF cookie on the first load. */
export function useCurrentUser() {
  const me = useQuery({ queryKey: meQueryKey, queryFn: ({ signal }) => fetchMe(signal) });
  return {
    user: me.data ?? null,
    isLoading: me.isPending,
    isError: me.isError,
    refetch: me.refetch,
  };
}

/** POST /auth/register: 202, and the code is emailed (or printed in the backend log in dev). */
export function useRegister() {
  return useMutation({
    mutationFn: (body: { email: string; password: string; role: SignUpRole }) =>
      apiFetch<CodeSent>('/api/v1/auth/register', { method: 'POST', body }),
  });
}

export function useResendCode() {
  return useMutation({
    mutationFn: (email: string) => apiFetch<CodeSent>('/api/v1/auth/resend-code', { method: 'POST', body: { email } }),
  });
}

/** POST /auth/verify-email: confirms the email and signs the user in. */
export function useVerifyEmail() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: { email: string; code: string }) =>
      apiFetch<Me>('/api/v1/auth/verify-email', { method: 'POST', body }),
    onSuccess: (me) => queryClient.setQueryData(meQueryKey, me),
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: { email: string; password: string }) =>
      apiFetch<Me>('/api/v1/auth/login', { method: 'POST', body }),
    onSuccess: (me) => queryClient.setQueryData(meQueryKey, me),
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiFetch<void>('/api/v1/auth/logout', { method: 'POST' }),
    onSuccess: () => {
      // Update "me" in place, so every component showing the user sees the guest at once,
      // and drop everything else the old session loaded.
      queryClient.setQueryData(meQueryKey, null);
      queryClient.removeQueries({ predicate: (query) => query.queryKey[0] !== meQueryKey[0] });
    },
  });
}

/**
 * Google sign-in is a full-page redirect through the server (AuthController.google).
 * The role is only used when the Google account has no Kaaj account yet.
 */
export function googleSignInUrl(role?: SignUpRole): string {
  return role ? `/api/v1/auth/google?role=${role}` : '/api/v1/auth/google';
}
