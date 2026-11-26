import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { mockApi, renderApp, seeker } from '../../test/utils';

async function fillIn(user: ReturnType<typeof renderApp>['user']) {
  await user.type(await screen.findByLabelText('Email'), 'rahim@example.com');
  await user.type(screen.getByLabelText('Password'), 'secret123');
  await user.click(screen.getByRole('button', { name: 'Sign in' }));
}

describe('LoginPage', () => {
  it('signs in and goes home', async () => {
    const { calls } = mockApi({ 'POST /api/v1/auth/login': { status: 200, body: seeker } });
    const { user } = renderApp('/login');

    await fillIn(user);

    expect(await screen.findByRole('heading', { name: 'Welcome to Kaaj' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Your account' })).toBeInTheDocument();
    expect(calls.find((call) => call.url === '/api/v1/auth/login')?.body).toEqual({
      email: 'rahim@example.com',
      password: 'secret123',
    });
  });

  it('goes back to the page in ?next= after signing in', async () => {
    mockApi({ 'POST /api/v1/auth/login': { status: 200, body: seeker } });
    const { user, router } = renderApp('/login?next=%2Fsomewhere%3Fx%3D1');

    await fillIn(user);

    await screen.findByRole('heading', { name: 'Page not found' }); // /somewhere doesn't exist yet
    expect(router.state.location.pathname + router.state.location.search).toBe('/somewhere?x=1');
  });

  it("shows the server's message for a wrong password", async () => {
    mockApi({
      'POST /api/v1/auth/login': { status: 401, body: { code: 'auth.login.failed', detail: 'Wrong email or password.' } },
    });
    const { user } = renderApp('/login');

    await fillIn(user);

    expect(await screen.findByRole('alert')).toHaveTextContent('Wrong email or password.');
  });

  it('sends a new code to an unconfirmed account and opens the verify page', async () => {
    const { calls } = mockApi({
      'POST /api/v1/auth/login': {
        status: 403,
        body: { code: 'auth.login.unverified', detail: 'Please confirm your email with the code first.' },
      },
      'POST /api/v1/auth/resend-code': { status: 202, body: { status: 'CODE_SENT' } },
    });
    const { user } = renderApp('/login');

    await fillIn(user);
    await user.click(await screen.findByRole('button', { name: 'Send me a new code' }));

    expect(await screen.findByRole('heading', { name: 'Confirm your email' })).toBeInTheDocument();
    expect(screen.getByText('rahim@example.com')).toBeInTheDocument();
    expect(calls.find((call) => call.url === '/api/v1/auth/resend-code')?.body).toEqual({ email: 'rahim@example.com' });
  });

  it('explains why Google sign-in failed', async () => {
    mockApi();
    renderApp('/login?error=auth.google.choose-role');

    expect(await screen.findByRole('alert')).toHaveTextContent("There's no Kaaj account for this Google account yet.");
    expect(screen.getAllByRole('link', { name: 'Create an account' })[0]).toHaveAttribute('href', '/register');
  });

  it("has a general message for Spring's own ?error redirect", async () => {
    mockApi();
    renderApp('/login?error');

    expect(await screen.findByRole('alert')).toHaveTextContent("Google sign-in didn't work. Please try again.");
  });

  it('sends a signed-in user home', async () => {
    mockApi({ 'GET /api/v1/me': { status: 200, body: seeker } });
    renderApp('/login');

    expect(await screen.findByRole('heading', { name: 'Welcome to Kaaj' })).toBeInTheDocument();
  });
});
