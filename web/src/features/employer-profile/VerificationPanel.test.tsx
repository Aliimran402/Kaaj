import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { pendingProfile, unverifiedProfile } from './testData';
import { VerificationPanel } from './VerificationPanel';

describe('VerificationPanel', () => {
  it('asks for the document while the profile is not verified, and lists what is missing', () => {
    render(<VerificationPanel profile={unverifiedProfile} />);

    expect(screen.getByTestId('verification-banner')).toHaveTextContent('Not verified');
    expect(screen.getByText('Still missing')).toBeInTheDocument();
    expect(screen.getByText('Verification document')).toBeInTheDocument();
    expect(screen.getByText('Once you are verified, this badge appears next to your name on every post.')).toBeInTheDocument();
  });

  it('shows the "Verified" badge as job posts will show it, once an admin approves', () => {
    render(
      <VerificationPanel
        profile={{ ...pendingProfile, status: 'VERIFIED', verified: true, verifiedAt: '2026-11-28T09:00:00Z', verificationNote: 'All good' }}
      />,
    );

    expect(screen.getByTestId('verification-banner')).toHaveTextContent('Your business is verified.');
    expect(screen.getAllByText('Verified').length).toBeGreaterThanOrEqual(2); // the banner and the badge on the post
    expect(screen.getByText("A Kaaj admin has checked this employer's trade licence or national ID.")).toBeInTheDocument();
    expect(screen.getByText('All good')).toBeInTheDocument();
    expect(screen.getByText('28 Nov 2026')).toBeInTheDocument();
    expect(screen.queryByText('Still missing')).not.toBeInTheDocument();
  });

  it("shows the admin's reason after a rejection, and sends the profile again", async () => {
    const onResubmit = vi.fn();
    render(
      <VerificationPanel
        profile={{ ...pendingProfile, status: 'REJECTED', verificationNote: 'The licence has expired' }}
        onResubmit={onResubmit}
      />,
    );

    expect(screen.getByText('Reason for rejection')).toBeInTheDocument();
    expect(screen.getByText('The licence has expired')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Send for review again' }));
    expect(onResubmit).toHaveBeenCalledOnce();
  });
});
