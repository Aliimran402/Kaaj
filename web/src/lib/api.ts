import i18n from '../i18n';

/** Spring's ProblemDetail (RFC 9457) with the fields Kaaj adds in ApiExceptionHandler. */
export type ProblemDetail = {
  type?: string;
  title?: string;
  status?: number;
  /** Already translated by the server, in the language of Accept-Language. */
  detail?: string;
  instance?: string;
  /** The message key, for example "auth.login.failed", or "error.validation". */
  code?: string;
  /** Field name → message, when code is "error.validation". */
  errors?: Record<string, string>;
};

/** A failed API call. status 0 means the server could not be reached. */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string | undefined;
  readonly fieldErrors: Readonly<Record<string, string>>;

  constructor(status: number, problem: ProblemDetail | undefined, fallbackMessage: string) {
    super(problem?.detail || fallbackMessage);
    this.name = 'ApiError';
    this.status = status;
    this.code = problem?.code;
    this.fieldErrors = problem?.errors ?? {};
  }
}

// Spring Security's csrf.spa(): the token comes in the XSRF-TOKEN cookie and goes back in this header.
const CSRF_COOKIE = 'XSRF-TOKEN';
const CSRF_HEADER = 'X-XSRF-TOKEN';

export function readCookie(name: string): string | undefined {
  for (const part of document.cookie.split(';')) {
    const [key, ...value] = part.trim().split('=');
    if (key === name) return decodeURIComponent(value.join('='));
  }
  return undefined;
}

async function csrfToken(): Promise<string | undefined> {
  const token = readCookie(CSRF_COOKIE);
  if (token) return token;
  // No cookie yet (first visit, or just after sign-out): any response from /api sets it.
  try {
    await fetch('/api/v1/me', { credentials: 'same-origin', headers: { Accept: 'application/json' } });
  } catch {
    // the real request below reports the network error
  }
  return readCookie(CSRF_COOKIE);
}

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type RequestOptions = {
  method?: Method;
  /** Sent as JSON. */
  body?: unknown;
  signal?: AbortSignal;
};

/** Calls the Kaaj API with the session cookie, the CSRF token and the current language. */
export async function apiFetch<T>(path: string, { method = 'GET', body, signal }: RequestOptions = {}): Promise<T> {
  const headers = new Headers({
    Accept: 'application/json',
    'Accept-Language': i18n.resolvedLanguage ?? 'bn',
  });
  if (body !== undefined) headers.set('Content-Type', 'application/json');
  if (method !== 'GET') {
    const token = await csrfToken();
    if (token) headers.set(CSRF_HEADER, token);
  }

  let response: Response;
  try {
    response = await fetch(path, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      credentials: 'same-origin',
      signal,
    });
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new ApiError(0, undefined, i18n.t('errors.network'));
  }

  if (!response.ok) throw await toApiError(response);
  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

async function toApiError(response: Response): Promise<ApiError> {
  let problem: ProblemDetail | undefined;
  try {
    const text = await response.text();
    if (text) problem = JSON.parse(text) as ProblemDetail;
  } catch {
    // not JSON (for example a proxy error page): use the general message
  }
  return new ApiError(response.status, problem, fallbackMessage(response.status));
}

function fallbackMessage(status: number): string {
  if (status >= 500) return i18n.t('errors.server');
  if (status === 429) return i18n.t('errors.tooMany');
  if (status === 401) return i18n.t('errors.signInRequired');
  if (status === 403) return i18n.t('errors.forbidden');
  return i18n.t('errors.unknown');
}
