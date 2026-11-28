import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { mockApi, renderApp } from '../../test/utils';
import { employerUser, pendingProfile, unverifiedProfile } from './testData';

// Leaflet needs a real browser layout; the map itself is not what these tests are about.
vi.mock('../../components/MapPicker', () => ({ MapPicker: () => <div data-testid="map" /> }));

const ME = { 'GET /api/v1/me': { status: 200, body: employerUser } };

describe('EmployerProfilePage', () => {
  it('saves a new business profile, sending the phone number in ASCII digits', async () => {
    document.cookie = 'XSRF-TOKEN=token-123; path=/';
    const { calls } = mockApi({
      ...ME,
      'GET /api/v1/employer/profile': { status: 404, body: { status: 404, code: 'employer.profile.missing' } },
      'PUT /api/v1/employer/profile': (body) => ({ status: 200, body: { ...unverifiedProfile, ...(body as object) } }),
    });
    const { user } = renderApp('/employer/profile');

    expect(await screen.findByRole('heading', { level: 1, name: 'Your business information' })).toBeInTheDocument();
    expect(await screen.findByText('Save your business information first, then upload the document.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Choose file' })).toBeDisabled();

    await user.type(screen.getByLabelText('Business name'), 'Karim Transport');
    await user.selectOptions(screen.getByLabelText('Business type'), 'COMPANY');
    await user.type(screen.getByLabelText('Address'), 'Station Road, Tongi');
    await user.type(screen.getByLabelText('Contact person'), 'Md. Karim');
    await user.type(screen.getByLabelText('Contact number'), '০১৭১২-৩৪৫৬৭৮');
    await user.click(screen.getByRole('button', { name: 'Save information' }));

    expect(await screen.findByText('Your business information is saved.')).toBeInTheDocument();
    const put = calls.find((call) => call.method === 'PUT');
    expect(put?.headers.get('X-XSRF-TOKEN')).toBe('token-123');
    expect(put?.body).toEqual({
      name: 'Karim Transport',
      kind: 'COMPANY',
      address: 'Station Road, Tongi',
      contactPerson: 'Md. Karim',
      contactPhone: '01712-345678',
      contactEmail: null,
      latitude: null,
      longitude: null,
    });
    expect(screen.getByRole('button', { name: 'Choose file' })).toBeEnabled();
  });

  it('shows what is wrong next to each field and sends nothing', async () => {
    const { calls } = mockApi({ ...ME, 'GET /api/v1/employer/profile': { status: 404 } });
    const { user } = renderApp('/employer/profile');

    await user.click(await screen.findByRole('button', { name: 'Save information' }));

    expect(await screen.findByText('Use 2 to 120 characters for the name.')).toBeInTheDocument();
    expect(screen.getAllByText('This field is required.')).toHaveLength(3); // address, contact person, phone
    expect(screen.getByLabelText('Business name')).toHaveAttribute('aria-invalid', 'true');
    expect(calls.some((call) => call.method === 'PUT')).toBe(false);
  });

  it('uploads the trade licence, and the panel shows the profile is under review', async () => {
    const { calls } = mockApi({
      ...ME,
      'GET /api/v1/employer/profile': { status: 200, body: unverifiedProfile },
      'POST /api/v1/employer/profile/document': { status: 200, body: pendingProfile },
    });
    const { user } = renderApp('/employer/profile');

    expect(await screen.findByTestId('verification-banner')).toHaveTextContent('Not verified');
    await user.upload(screen.getByTestId('file-input'), new File(['%PDF-1.7'], 'licence.pdf', { type: 'application/pdf' }));

    expect(await screen.findByText('Document uploaded. An admin will check it soon.')).toBeInTheDocument();
    expect(screen.getByTestId('verification-banner')).toHaveTextContent('Under review');
    const upload = calls.find((call) => call.url === '/api/v1/employer/profile/document');
    expect(upload).toBeDefined();
    const form = upload?.rawBody;
    expect(form).toBeInstanceOf(FormData);
    expect((form as FormData).get('documentType')).toBe('TRADE_LICENCE');
    expect(((form as FormData).get('file') as File).name).toBe('licence.pdf');
    expect(upload?.headers.get('Content-Type')).toBeNull(); // the browser adds the multipart boundary itself
  });

  it('refuses a file over 3 MB before uploading it', async () => {
    const { calls } = mockApi({ ...ME, 'GET /api/v1/employer/profile': { status: 200, body: unverifiedProfile } });
    const { user } = renderApp('/employer/profile');

    const big = new File([new Uint8Array(3 * 1024 * 1024 + 1)], 'big.pdf', { type: 'application/pdf' });
    await user.upload(await screen.findByTestId('file-input'), big);

    expect(await screen.findByText('The file is larger than 3 MB.')).toBeInTheDocument();
    expect(calls.some((call) => call.method === 'POST')).toBe(false);
  });

  it('shows the server message when the server refuses the file', async () => {
    mockApi({
      ...ME,
      'GET /api/v1/employer/profile': { status: 200, body: unverifiedProfile },
      'POST /api/v1/employer/profile/document': {
        status: 400,
        body: { status: 400, code: 'file.wrong-type', detail: 'Only PDF, JPG or PNG files can be uploaded.' },
      },
    });
    const { user } = renderApp('/employer/profile');

    await user.upload(await screen.findByTestId('file-input'), new File(['MZ'], 'licence.png', { type: 'image/png' }));

    expect(await screen.findByText('Only PDF, JPG or PNG files can be uploaded.')).toBeInTheDocument();
  });

  it('is only for employers', async () => {
    mockApi({ 'GET /api/v1/me': { status: 200, body: { ...employerUser, role: 'SEEKER' } } });
    renderApp('/employer/profile');

    expect(await screen.findByRole('heading', { name: "This page isn't for your account" })).toBeInTheDocument();
  });
});
