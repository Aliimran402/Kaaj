import { describe, expect, it, vi } from 'vitest';
import i18n from '../i18n';
import { mockApi } from '../test/utils';
import { ApiError, apiFetch } from './api';

describe('apiFetch', () => {
  it('sends the language and the CSRF token from the cookie', async () => {
    document.cookie = 'XSRF-TOKEN=token-123; path=/';
    await i18n.changeLanguage('bn');
    const { calls } = mockApi({ 'POST /api/v1/auth/login': { status: 200, body: { ok: true } } });

    await expect(apiFetch('/api/v1/auth/login', { method: 'POST', body: { a: 1 } })).resolves.toEqual({ ok: true });

    const [call] = calls;
    expect(call.headers.get('X-XSRF-TOKEN')).toBe('token-123');
    expect(call.headers.get('Accept-Language')).toBe('bn');
    expect(call.headers.get('Content-Type')).toBe('application/json');
    expect(call.body).toEqual({ a: 1 });
  });

  it('gets a CSRF cookie first when there is none, as after signing out', async () => {
    const { calls } = mockApi({
      'GET /api/v1/me': () => {
        document.cookie = 'XSRF-TOKEN=fresh; path=/'; // what Spring's Set-Cookie does
        return { status: 401 };
      },
      'POST /api/v1/auth/logout': { status: 204 },
    });

    await expect(apiFetch('/api/v1/auth/logout', { method: 'POST' })).resolves.toBeUndefined();

    expect(calls.map((c) => `${c.method} ${c.url}`)).toEqual(['GET /api/v1/me', 'POST /api/v1/auth/logout']);
    expect(calls[1].headers.get('X-XSRF-TOKEN')).toBe('fresh');
  });

  it("turns a ProblemDetail into an ApiError with the server's message and code", async () => {
    mockApi({
      'POST /api/v1/auth/register': {
        status: 400,
        body: { status: 400, code: 'error.validation', detail: 'Invalid request content.', errors: { email: 'must be an email' } },
      },
    });

    const error = await apiFetch('/api/v1/auth/register', { method: 'POST', body: {} }).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 400, code: 'error.validation', fieldErrors: { email: 'must be an email' } });
  });

  it('uses a general message in the current language when the body is not a ProblemDetail', async () => {
    mockApi({ 'GET /api/v1/jobs': { status: 502 } });

    await expect(apiFetch('/api/v1/jobs')).rejects.toMatchObject({ status: 502, message: i18n.t('errors.server') });
  });

  it('reports an unreachable server as status 0', async () => {
    vi.stubGlobal('fetch', () => Promise.reject(new TypeError('Failed to fetch')));

    await expect(apiFetch('/api/v1/me')).rejects.toMatchObject({ status: 0, message: i18n.t('errors.network') });
  });
});
