import { QueryClient } from '@tanstack/react-query';
import { ApiError } from './api';

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // A 4xx answer won't change on a retry; network and server errors get two more tries.
        retry: (failureCount, error) =>
          !(error instanceof ApiError && error.status >= 400 && error.status < 500) && failureCount < 2,
        staleTime: 30_000,
      },
      mutations: { retry: false },
    },
  });
}
