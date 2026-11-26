import { screen } from '@testing-library/react';
import { useLocation, type RouteObject } from 'react-router';
import { describe, expect, it } from 'vitest';
import { mockApi, renderApp, seeker } from '../../test/utils';
import { RequireRole } from './RequireRole';

function SignInStub() {
  const location = useLocation();
  return <p>Sign-in page {location.search}</p>;
}

const routes: RouteObject[] = [
  { path: '/login', element: <SignInStub /> },
  {
    path: '/employer',
    element: <RequireRole roles={['EMPLOYER']} />,
    children: [{ index: true, element: <p>Employer area</p> }],
  },
];

describe('RequireRole', () => {
  it('sends a guest to sign in, and back here afterwards', async () => {
    mockApi();
    renderApp('/employer', { routes });

    expect(await screen.findByText('Sign-in page ?next=%2Femployer')).toBeInTheDocument();
  });

  it('tells a signed-in user with another role that the page is not for them', async () => {
    mockApi({ 'GET /api/v1/me': { status: 200, body: seeker } });
    renderApp('/employer', { routes });

    expect(await screen.findByRole('heading', { name: "This page isn't for your account" })).toBeInTheDocument();
    expect(screen.queryByText('Employer area')).not.toBeInTheDocument();
  });

  it('shows the page to the right role', async () => {
    mockApi({ 'GET /api/v1/me': { status: 200, body: { ...seeker, role: 'EMPLOYER' } } });
    renderApp('/employer', { routes });

    expect(await screen.findByText('Employer area')).toBeInTheDocument();
  });
});
