import type { RouteObject } from 'react-router';
import { AppLayout } from './components/AppLayout';
import { LoginPage } from './features/auth/LoginPage';
import { RegisterPage } from './features/auth/RegisterPage';
import { GuestOnly, RequireRole } from './features/auth/RequireRole';
import { VerifyPage } from './features/auth/VerifyPage';
import { NotFoundPage } from './features/errors/NotFoundPage';
import { RouteError } from './features/errors/RouteError';
import { HomePage } from './features/home/HomePage';

// Employer and admin pages go under <RequireRole roles={[...]} /> and load lazily, so job seekers'
// first load stays small: { path: 'employer', lazy: () => import('./features/...').then((m) => ({ Component: m.Page })) }
export const routes: RouteObject[] = [
  {
    element: <AppLayout />,
    ErrorBoundary: RouteError,
    children: [
      { index: true, element: <HomePage /> },
      {
        element: <GuestOnly />,
        children: [
          { path: 'login', element: <LoginPage /> },
          { path: 'register', element: <RegisterPage /> },
          { path: 'verify', element: <VerifyPage /> },
        ],
      },
      // M1-3 Employer profile and verification
      {
        element: <RequireRole roles={['EMPLOYER']} />,
        children: [
          {
            path: 'employer/profile',
            lazy: () =>
              import('./features/employer-profile/EmployerProfilePage').then((m) => ({ Component: m.EmployerProfilePage })),
          },
        ],
      },
      {
        element: <RequireRole roles={['ADMIN']} />,
        children: [
          {
            path: 'admin/verification',
            lazy: () =>
              import('./features/admin-verification/AdminVerificationPage').then((m) => ({
                Component: m.AdminVerificationPage,
              })),
          },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
];
