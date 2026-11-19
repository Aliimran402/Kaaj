import { QueryClientProvider, type QueryClient } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, type RouteObject } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import { vi } from 'vitest';
import type { Me } from '../features/auth/api';
import { createQueryClient } from '../lib/queryClient';
import { routes } from '../routes';

export type Reply = { status: number; body?: unknown };
type Handler = Reply | ((body: unknown) => Reply);
export type ApiCall = { method: string; url: string; body: unknown; headers: Headers };

export const seeker: Me = {
  id: '0193c8b4-2c3d-7e4f-9a0b-1c2d3e4f5a6b',
  email: 'rahim@example.com',
  role: 'SEEKER',
  locale: 'bn',
  status: 'ACTIVE',
};

/**
 * Replaces fetch with fixed answers, keyed "METHOD /path". GET /api/v1/me answers 401 (a guest)
 * unless a handler is given; anything else unknown answers 404. Every call is recorded.
 */
export function mockApi(handlers: Record<string, Handler> = {}) {
  const calls: ApiCall[] = [];
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init: RequestInit = {}) => {
    const url = String(input);
    const method = init.method ?? 'GET';
    const body: unknown = typeof init.body === 'string' ? JSON.parse(init.body) : undefined;
    calls.push({ method, url, body, headers: new Headers(init.headers) });
    const handler = handlers[`${method} ${url}`] ?? { status: url === '/api/v1/me' ? 401 : 404 };
    const reply = typeof handler === 'function' ? handler(body) : handler;
    return new Response(reply.body === undefined ? null : JSON.stringify(reply.body), {
      status: reply.status,
      headers: { 'Content-Type': 'application/json' },
    });
  });
  vi.stubGlobal('fetch', fetchMock);
  return { calls, fetchMock };
}

/** Renders the app (or the given routes) at a URL, with an empty query cache. */
export function renderApp(
  url: string,
  options: { routes?: RouteObject[]; state?: unknown; queryClient?: QueryClient } = {},
) {
  const { pathname, search, hash } = new URL(url, 'http://localhost');
  const router = createMemoryRouter(options.routes ?? routes, {
    initialEntries: [{ pathname, search, hash, state: options.state }],
  });
  const user = userEvent.setup();
  const view = render(
    <QueryClientProvider client={options.queryClient ?? createQueryClient()}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  return { ...view, user, router };
}
