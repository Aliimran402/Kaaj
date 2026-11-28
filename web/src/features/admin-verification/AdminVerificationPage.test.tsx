import { screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { mockApi, renderApp } from '../../test/utils';
import { adminUser, pendingEmployer } from '../employer-profile/testData';

vi.mock('../../components/MapPicker', () => ({ MapPicker: () => <div data-testid="map" /> }));

const DECISION = `POST /api/v1/admin/employers/${pendingEmployer.id}/verification`;

function api(extra = {}) {
  return mockApi({
    'GET /api/v1/me': { status: 200, body: adminUser },
    'GET /api/v1/admin/employers?status=PENDING&size=20': { status: 200, body: { items: [pendingEmployer], nextCursor: null } },
    'GET /api/v1/admin/employers?status=VERIFIED&size=20': { status: 200, body: { items: [], nextCursor: null } },
    'GET /api/v1/admin/employers/counts': {
      status: 200,
      body: { UNVERIFIED: 2, PENDING: 1, VERIFIED: 0, REJECTED: 0 },
    },
    [DECISION]: (body) => ({
      status: 200,
      body: { ...pendingEmployer, status: (body as { decision: string }).decision === 'APPROVE' ? 'VERIFIED' : 'REJECTED' },
    }),
    ...extra,
  });
}

describe('AdminVerificationPage', () => {
  it('shows the waiting employer with their details and document', async () => {
    api();
    const { user } = renderApp('/admin/verification');

    expect(await screen.findByRole('heading', { level: 1, name: 'Employer verification' })).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: 'Waiting (1)' })).toHaveAttribute('aria-pressed', 'true');
    await user.click(await screen.findByRole('button', { name: /Karim Transport/ }));

    expect(screen.getByRole('heading', { level: 2, name: 'Karim Transport' })).toBeInTheDocument();
    expect(screen.getByText('karim@example.com')).toBeInTheDocument();
    expect(screen.getByText('01712345678')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'licence.png' })).toHaveAttribute('src', pendingEmployer.documentUrl);
    expect(screen.getByRole('link', { name: /Open in a new tab/ })).toHaveAttribute('href', pendingEmployer.documentUrl);
  });

  it('rejects only with a reason, and then sends that reason', async () => {
    const { calls } = api();
    const { user } = renderApp('/admin/verification');
    await user.click(await screen.findByRole('button', { name: /Karim Transport/ }));

    await user.click(screen.getByRole('button', { name: 'Reject' }));
    expect(screen.getByText('Give a reason for the rejection.')).toBeInTheDocument();
    expect(calls.some((call) => call.method === 'POST')).toBe(false);

    await user.click(screen.getByRole('button', { name: 'The document is not readable' }));
    expect(screen.getByLabelText('Reason or comment')).toHaveValue('The document is not readable');
    await user.click(screen.getByRole('button', { name: 'Reject' }));

    expect(await screen.findByText('Rejected. The employer will see the reason.')).toBeInTheDocument();
    expect(calls.find((call) => call.method === 'POST')?.body).toEqual({
      decision: 'REJECT',
      reason: 'The document is not readable',
    });
  });

  it('approves with an optional comment', async () => {
    const { calls } = api();
    const { user } = renderApp('/admin/verification');
    await user.click(await screen.findByRole('button', { name: /Karim Transport/ }));

    await user.click(screen.getByRole('button', { name: 'Approve' }));

    expect(await screen.findByText(/Approved\. From now on, this employer's job posts show the "Verified" badge\./)).toBeInTheDocument();
    expect(calls.find((call) => call.method === 'POST')?.body).toEqual({ decision: 'APPROVE', reason: null });
  });

  it('shows the server message when the decision is refused', async () => {
    api({
      [DECISION]: {
        status: 409,
        body: { status: 409, code: 'employer.status.invalid-move', detail: 'This profile has already been decided or changed. Reload the page.' },
      },
    });
    const { user } = renderApp('/admin/verification');
    await user.click(await screen.findByRole('button', { name: /Karim Transport/ }));

    await user.click(screen.getByRole('button', { name: 'Approve' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('This profile has already been decided or changed.');
  });

  it('switches to another tab', async () => {
    const { calls } = api();
    const { user } = renderApp('/admin/verification');

    const tabs = await screen.findByRole('group', { name: 'Verification queue' });
    await user.click(within(tabs).getByRole('button', { name: 'Approved (0)' }));

    expect(await screen.findByText('Nobody here.')).toBeInTheDocument();
    expect(calls.some((call) => call.url === '/api/v1/admin/employers?status=VERIFIED&size=20')).toBe(true);
  });

  it('is only for admins', async () => {
    mockApi({ 'GET /api/v1/me': { status: 200, body: { ...adminUser, role: 'EMPLOYER' } } });
    renderApp('/admin/verification');

    expect(await screen.findByRole('heading', { name: "This page isn't for your account" })).toBeInTheDocument();
  });
});
