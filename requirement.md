# Kaaj – The Job (CSE471, Group 08)

AI-powered job search web app for blue-collar workers in Bangladesh. Bangla is the default language, English second.

## Stack
- Backend: Spring Boot 4.1.2, Java 25 (Temurin), Maven wrapper (.\mvnw.cmd), Spring Modulith
- Database: PostgreSQL 18 + pgvector + PostGIS in Docker (compose.yaml, docker/db/Dockerfile), Flyway migrations
- Frontend: web/ — React 19.3 + TypeScript 7.0 (Vite 8.3), Tailwind CSS 4.3, React Router 8.5, TanStack Query 5.108, React Hook Form 7.92 + Zod 4.6, i18next 27 (bn/en), lucide-react 1.74, Vitest 5.1, oxlint
  - Exact versions are pinned in web/package.json (the same ones Member-3 uses). Install with `npm ci`, not `npm install`.

## My setup (Windows, VS Code)
- Project in D:\Dev\kaaj; Maven repository in D:\Dev\.m2\repository (via ~/.m2/settings.xml)
- Docker database runs on port 5433 (a Windows PostgreSQL uses 5432)
- Run backend: .\mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=dev"  (email codes are printed in the terminal)
- Run frontend (first time: `cd web; npm ci`): cd web; npm run dev  → http://localhost:5173 (Vite proxies /api, /oauth2, /login/oauth2 to :8080)
  - Backend on another port: set KAAJ_BACKEND, e.g. `$env:KAAJ_BACKEND='http://localhost:8081'; npm run dev`
- Frontend checks (in web/): `npm test` (Vitest), `npm run lint` (oxlint), `npm run typecheck`, `npm run build`
  - Run `npm test` from PowerShell. From cmd or Git Bash opened at `d:\…` (lower-case drive letter), Vitest fails with
    "Vitest failed to find the runner"; `cd D:\Dev\kaaj\web` (upper-case D:) first fixes it.
- Google sign-in in dev: put GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env, and register the redirect URI
  http://localhost:5173/login/oauth2/code/google in Google Cloud Console. The Vite proxy keeps the browser's Host header,
  so Spring builds its redirects for :5173 and the whole sign-in stays on the dev server.
- Secrets are in .env (never commit it)

## Rules
- Modules are packages under app.kaaj (identity, shared, profile, job, employer, ...). Other modules use only a module's top-level package, never its internal/ package.
- API under /api/v1; errors are ProblemDetail with a "code"; messages in both messages.properties and messages_bn.properties.
- Every UI text goes in both src/i18n/bn.ts and src/i18n/en.ts. bn.ts defines the keys; en.ts is typed against it, so a missing key fails the type check.
- Flyway: never edit a merged migration. Shared setup uses V1–V9; feature MX-Y uses VXY0–VXY9.
- UI style follows our Figma: blue #2459A5, light-blue banner #EDF1FA, page background #F6F5F1, white rounded cards.
- Session login with CSRF (XSRF-TOKEN cookie → X-XSRF-TOKEN header).
- Frontend conventions:
  - Call the API only through `apiFetch` in web/src/lib/api.ts (session cookie, CSRF header, Accept-Language, `ApiError` from ProblemDetail).
  - Pages reach the server only through TanStack Query hooks in `features/<feature>/api.ts`.
  - Reuse web/src/components/ui.tsx (Button, ButtonLink, TextLink, Card, Container, PageBanner, Badge, Alert, ErrorAlert, TextField, PasswordField, Spinner).
  - Pages for signed-in users go under `<RequireRole roles={[...]} />` in web/src/routes.tsx; load employer and admin pages lazily.
  - Header links: add them in `useNavLinks()` in web/src/components/AppLayout.tsx.
  - Numbers on screen: `formatNumber` in web/src/lib/format.ts (Bangla digits and lakh grouping); `toAsciiDigits` before sending typed numbers to the API.
  - Zod messages are i18n keys (validation.*), so form errors follow the language switch.
  - Mobile-first: every page must work at 360 px wide, with touch targets of at least 44 px.
- lucide-react 1.x renamed some icons: CircleExclamationPoint (not CircleAlert), TriangleExclamationPoint, CircleQuestionMark, Building (not Building2).

## Done so far
- Project setup, Docker database, Flyway V1 (app_user, email_code, audit_log)
- identity module: email sign-up with 6-digit code, login, logout, Google sign-in, roles (SEEKER, EMPLOYER, ADMIN), first admin from .env, GET /api/v1/me
  - Fixed: asking for a new code within 60 s returned 500; it now returns 429 auth.code.too-soon (EmailCodeService.send has noRollbackFor).
  - Dev profile: Google sign-in now returns to the web app (/), not /api/v1/me.
- web/:
  - Layout: header with বাংলা/English switch and account menu, footer, and a notice when the server can't be reached.
  - Home: a landing page for guests; for signed-in users, their account and upcoming features.
  - Register: job seeker or employer, then Google or email + password.
  - Verify: 6-digit code; accepts Bangla digits, sends itself when complete, 60 s resend timer.
  - Login: handles an unconfirmed email (sends a new code) and the Google ?error= codes.
  - Also: 404 page, route guards (RequireRole, GuestOnly), and 41 Vitest tests.

## Open points
- Google sign-in credentials and redirect URI (see "My setup").
- Build web/ into the Spring Boot jar (frontend-maven-plugin) and serve index.html for client routes; needed for deployment and for Google redirects on the deployed app.
- Agree with Member-3 (Ahsan) on the translation files: this repo uses bn.ts/en.ts, his web app uses bn.json/en.json.
- Playwright end-to-end tests for sign-up and sign-in.

## Requirements
Full spec: docs/Kaaj_The_Job_Project_Context_1.md and docs/Kaaj_Module_1_Build_Prompts.md
(not in the repo yet: copies are in D:\Courses\CSE471\Kaaj_The_Job\Kaaj_The_Job\, with the Module 2 and 3 build prompts and
Member-3's status in Kaaj_Web_App_Member3_Update.md)
