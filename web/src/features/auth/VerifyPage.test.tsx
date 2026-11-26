import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { mockApi, renderApp, seeker } from '../../test/utils';
import { markCodeSent, rememberPendingEmail } from './pendingSignUp';

describe('VerifyPage', () => {
  it('accepts Bangla digits, sends the code by itself and signs the user in', async () => {
    const { calls } = mockApi({ 'POST /api/v1/auth/verify-email': { status: 200, body: seeker } });
    const { user } = renderApp('/verify', { state: { email: 'rahim@example.com' } });

    await user.type(await screen.findByLabelText('6-digit code'), '১২৩৪৫৬');

    expect(await screen.findByRole('heading', { name: 'Welcome to Kaaj' })).toBeInTheDocument();
    expect(calls.find((call) => call.url === '/api/v1/auth/verify-email')?.body).toEqual({
      email: 'rahim@example.com',
      code: '123456',
    });
  });

  it("shows the server's message for a wrong code and selects the code to retype it", async () => {
    mockApi({
      'POST /api/v1/auth/verify-email': {
        status: 400,
        body: { code: 'auth.code.wrong', detail: 'Wrong code. 4 tries left.' },
      },
    });
    const { user } = renderApp('/verify', { state: { email: 'rahim@example.com' } });

    const input = await screen.findByLabelText('6-digit code');
    await user.type(input, '111111');

    expect(await screen.findByText('Wrong code. 4 tries left.')).toBeInTheDocument();
    expect(input).toHaveFocus();
  });

  it('waits a minute after a code was sent, then sends a new one', async () => {
    const { calls } = mockApi({ 'POST /api/v1/auth/resend-code': { status: 202, body: { status: 'CODE_SENT' } } });
    rememberPendingEmail('rahim@example.com'); // as after a page reload
    markCodeSent('rahim@example.com', Date.now() - 61_000);
    const { user } = renderApp('/verify');

    expect(await screen.findByText('rahim@example.com')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Send a new code' }));

    expect(await screen.findByText('We sent a new code. Check your email.')).toBeInTheDocument();
    expect(screen.getByText(/You can ask for a new code in \d+ seconds/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Send a new code' })).toBeDisabled();
    expect(calls.find((call) => call.url === '/api/v1/auth/resend-code')?.body).toEqual({ email: 'rahim@example.com' });
  });

  it('asks for the email when it does not know it', async () => {
    mockApi();
    renderApp('/verify');

    expect(await screen.findByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByText('Enter your email address and the 6-digit code we sent you.')).toBeInTheDocument();
  });
});
