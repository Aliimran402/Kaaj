import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError, apiFetch } from '../../lib/api';
import type { DocumentType, EmployerProfile, EmployerProfileInput } from './types';

// Controller (browser): the employer's own profile, through EmployerProfileController.
// Pages call these hooks; they never call the server themselves.

const PATH = '/api/v1/employer/profile';
export const employerProfileKey = ['employer-profile'] as const;

async function fetchProfile(signal: AbortSignal): Promise<EmployerProfile | null> {
  try {
    return await apiFetch<EmployerProfile>(PATH, { signal });
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null; // no profile saved yet
    throw error;
  }
}

/** The signed-in employer's profile, or null before they save the form the first time. */
export function useEmployerProfile() {
  return useQuery({ queryKey: employerProfileKey, queryFn: ({ signal }) => fetchProfile(signal) });
}

function useKeepProfile() {
  const queryClient = useQueryClient();
  return (profile: EmployerProfile) => queryClient.setQueryData(employerProfileKey, profile);
}

/** PUT: creates the profile the first time, updates it after that. */
export function useSaveProfile() {
  const keep = useKeepProfile();
  return useMutation({
    mutationFn: (input: EmployerProfileInput) => apiFetch<EmployerProfile>(PATH, { method: 'PUT', body: input }),
    onSuccess: keep,
  });
}

/** Uploads the trade licence or NID; the profile goes to the admin's queue. */
export function useUploadDocument() {
  const keep = useKeepProfile();
  return useMutation({
    mutationFn: ({ file, documentType }: { file: File; documentType: DocumentType }) => {
      const form = new FormData();
      form.append('file', file);
      form.append('documentType', documentType);
      return apiFetch<EmployerProfile>(`${PATH}/document`, { method: 'POST', body: form });
    },
    onSuccess: keep,
  });
}

/** Sends a rejected profile for review again without a new document. */
export function useResubmit() {
  const keep = useKeepProfile();
  return useMutation({
    mutationFn: () => apiFetch<EmployerProfile>(`${PATH}/submit`, { method: 'POST' }),
    onSuccess: keep,
  });
}
