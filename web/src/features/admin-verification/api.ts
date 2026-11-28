import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../../lib/api';
import type { AdminEmployer, CursorPage, Decision, QueueStatus, VerificationStatus } from '../employer-profile/types';

// Controller (browser): the admin's verification queue and decisions, through AdminEmployerController.

const PATH = '/api/v1/admin/employers';
export const adminEmployersKey = ['admin-employers'] as const;

/** One tab of the queue, oldest submission first, 20 at a time ("Show more" loads the next page). */
export function useVerificationQueue(status: QueueStatus) {
  return useInfiniteQuery({
    queryKey: [...adminEmployersKey, 'queue', status],
    initialPageParam: null as string | null,
    queryFn: ({ pageParam, signal }) => {
      const params = new URLSearchParams({ status, size: '20' });
      if (pageParam) params.set('cursor', pageParam);
      return apiFetch<CursorPage<AdminEmployer>>(`${PATH}?${params}`, { signal });
    },
    getNextPageParam: (last) => last.nextCursor,
  });
}

/** How many employers each tab has. */
export function useVerificationCounts() {
  return useQuery({
    queryKey: [...adminEmployersKey, 'counts'],
    queryFn: ({ signal }) => apiFetch<Record<VerificationStatus, number>>(`${PATH}/counts`, { signal }),
  });
}

/** APPROVE (with an optional note) or REJECT (with the reason the employer will see). */
export function useDecision() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, decision, reason }: { id: string; decision: Decision; reason: string | null }) =>
      apiFetch<AdminEmployer>(`${PATH}/${id}/verification`, { method: 'POST', body: { decision, reason } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminEmployersKey }),
  });
}
