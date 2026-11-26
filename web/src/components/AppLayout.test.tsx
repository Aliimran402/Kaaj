import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { createQueryClient } from '../lib/queryClient';
import { mockApi, renderApp, seeker } from '../test/utils';

describe('AppLayout', () => {
  it('offers sign-in and sign-up to guests', async () => {
    mockApi();
    renderApp('/');

    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent('Tell us what you can do.');
    const header = screen.getByRole('banner');
    expect(within(header).getByRole('link', { name: 'Sign in' })).toHaveAttribute('href', '/login');
    expect(within(header).getByRole('link', { name: 'Create account' })).toHaveAttribute('href', '/register');
  });

  it('shows who is signed in, and signs out', async () => {
    document.cookie = 'XSRF-TOKEN=token-123; path=/';
    const { calls } = mockApi({
      'GET /api/v1/me': { status: 200, body: seeker },
      'POST /api/v1/auth/logout': { status: 204 },
    });
    const { user } = renderApp('/');

    await user.click(await screen.findByRole('button', { name: 'Your account' }));
    expect(screen.getAllByText('rahim@example.com').length).toBeGreaterThan(0);
    await user.click(screen.getByRole('button', { name: 'Sign out' }));

    expect(await within(screen.getByRole('banner')).findByRole('link', { name: 'Sign in' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Tell us what you can do.');
    const logout = calls.find((call) => call.url === '/api/v1/auth/logout');
    expect(logout?.headers.get('X-XSRF-TOKEN')).toBe('token-123');
  });

  it('switches the whole page to Bangla and remembers it', async () => {
    mockApi();
    const { user } = renderApp('/');

    await user.click(await screen.findByRole('button', { name: 'বাংলা' }));

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('আপনি কী কাজ পারেন বলুন');
    expect(document.documentElement.lang).toBe('bn');
    expect(localStorage.getItem('kaaj.language')).toBe('bn');
    expect(screen.getByRole('button', { name: 'বাংলা' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('warns when the server cannot be reached', async () => {
    mockApi({ 'GET /api/v1/me': { status: 503 } });
    const queryClient = createQueryClient();
    queryClient.setDefaultOptions({ queries: { retry: false } }); // skip the retries' waiting

    renderApp('/', { queryClient });

    expect(
      await screen.findByText("We can't reach the Kaaj server right now. Some things may not work."),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Tell us what you can do.');
  });
});
