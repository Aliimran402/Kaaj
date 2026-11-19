import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { mockApi, renderApp } from '../../test/utils';

describe('RegisterPage', () => {
  it('checks the role, the email and the password before calling the server', async () => {
    const { calls } = mockApi();
    const { user } = renderApp('/register');

    await user.type(await screen.findByLabelText('Email'), 'not-an-email');
    await user.type(screen.getByLabelText('Password'), 'short');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(await screen.findByText('Choose job seeker or employer.')).toBeInTheDocument();
    expect(screen.getByText('Enter a valid email address, like name@example.com')).toBeInTheDocument();
    expect(screen.getByText('Use at least 8 characters.')).toBeInTheDocument();
    expect(calls.some((call) => call.method === 'POST')).toBe(false);
  });

  it('creates the account and opens the verify page for that email', async () => {
    const { calls } = mockApi({ 'POST /api/v1/auth/register': { status: 202, body: { status: 'CODE_SENT' } } });
    const { user } = renderApp('/register');

    await user.click(await screen.findByRole('radio', { name: /^Employer/ }));
    await user.type(screen.getByLabelText('Email'), ' karim@example.com ');
    await user.type(screen.getByLabelText('Password'), 'secret123');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(await screen.findByRole('heading', { name: 'Confirm your email' })).toBeInTheDocument();
    expect(screen.getByText('karim@example.com')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Send a new code' })).toBeDisabled(); // a code just went out
    expect(calls.find((call) => call.url === '/api/v1/auth/register')?.body).toEqual({
      role: 'EMPLOYER',
      email: 'karim@example.com',
      password: 'secret123',
    });
  });

  it('goes on to the verify page when a code was already sent in the last minute', async () => {
    mockApi({
      'POST /api/v1/auth/register': {
        status: 429,
        body: { code: 'auth.code.too-soon', detail: 'Please wait 40 seconds before asking for a new code.' },
      },
    });
    const { user } = renderApp('/register?role=SEEKER');

    await user.type(await screen.findByLabelText('Email'), 'rahim@example.com');
    await user.type(screen.getByLabelText('Password'), 'secret123');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(await screen.findByRole('heading', { name: 'Confirm your email' })).toBeInTheDocument();
  });

  it('takes the role from ?role= and asks for one before Google sign-up', async () => {
    mockApi();
    const { user } = renderApp('/register');

    const google = await screen.findByRole('link', { name: 'Continue with Google' });
    await user.click(google);
    expect(await screen.findByText('Choose job seeker or employer.')).toBeInTheDocument();

    await user.click(screen.getByRole('radio', { name: /^Job seeker/ }));
    expect(google).toHaveAttribute('href', '/api/v1/auth/google?role=SEEKER');
  });

  it('starts with the role from the link that brought the user here', async () => {
    mockApi();
    renderApp('/register?role=EMPLOYER');

    expect(await screen.findByRole('radio', { name: /^Employer/ })).toBeChecked();
    expect(screen.getByRole('link', { name: 'Continue with Google' })).toHaveAttribute(
      'href',
      '/api/v1/auth/google?role=EMPLOYER',
    );
  });
});
