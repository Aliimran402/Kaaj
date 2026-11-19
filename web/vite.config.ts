import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Set KAAJ_BACKEND (in web/.env.local or the shell) if Spring Boot is not on port 8080.
  const backend = loadEnv(mode, process.cwd(), 'KAAJ_').KAAJ_BACKEND ?? 'http://localhost:8080';

  // changeOrigin stays false, so Spring sees "Host: localhost:5173". Its redirects and the Google
  // redirect URI (http://localhost:5173/login/oauth2/code/google) then point back at this dev server,
  // and the session cookie is set for the page the browser is on.
  const toBackend = { target: backend, changeOrigin: false };

  return {
    plugins: [react(), tailwindcss()],
    server: {
      port: 5173,
      strictPort: true,
      proxy: {
        '/api': toBackend,
        '/oauth2': toBackend,
        '/login/oauth2': toBackend,
      },
    },
    build: {
      rolldownOptions: {
        output: {
          // React and React Router rarely change: in a file of their own, browsers keep them cached across our releases.
          codeSplitting: {
            groups: [{ name: 'react', test: /node_modules[\\/](react|react-dom|react-router|scheduler)[\\/]/ }],
          },
        },
      },
    },
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      css: false,
      restoreMocks: true,
      unstubGlobals: true,
    },
  };
});
