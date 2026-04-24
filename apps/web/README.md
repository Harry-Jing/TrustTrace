# TrustTrace Web

`@trusttrace/web` — Vue 3 frontend for TrustTrace. Vite-powered SPA demonstrating the credibility-checking flow with backend-shaped mock API data.

## Structure

```txt
src/app/                         # App shell and navigation
src/components/                  # Shared UI primitives
src/features/checks/api/         # Backend-shaped mock API boundary
src/features/checks/components/  # Check-flow presentation components
src/features/checks/composables/ # Page-facing data/lifecycle composables
src/features/checks/fixtures/    # Static demo data
src/features/checks/pages/       # Route-level page orchestration
src/features/checks/stores/      # Check lifecycle Pinia store
src/stores/                      # App-wide Pinia stores
src/router/                      # Vue Router configuration
```

## Routes

| Route | Name | Purpose |
|---|---|---|
| `/checks/new` | `landing` | New-check screen with demo form. |
| `/` | — | Redirects to `/checks/new`. |
| `/checks/:checkId/loading` | `loading` | Check-specific progress route. |
| `/checks/:checkId/result` | `result` | Check-specific result route. |
| `/checks/:checkId/error` | `error` | Check-specific failure route. |
| `/history` | `history` | Searchable/sortable history cards. |
| `/loading`, `/result`, `/error` | — | Dev-mode redirects to demo check routes. |

## Current Behavior

- `checksApi.ts` is the stable frontend API boundary. It selects `mockChecksClient.ts` or `backendChecksClient.ts` based on `VITE_TRUSTTRACE_API_MODE`.
- Creating a check is modeled as an async operation returning a `checkId`; routes are driven by `/checks/:checkId/*`, and submit failures are surfaced in the input card.
- `checks.store.ts` is a lightweight cache for current check metadata and progress by check ID.
- `useAsyncData.ts` tracks `idle/loading/success/error` status with a sequence counter to discard stale responses on rapid `reload()` calls, preventing race conditions.
- Mock/demo controls and demo loading evidence are shown only when `showDevTools` is true (`DEV && apiMode === 'mock'`), so local backend debugging keeps production-like loading redirects and never shows fixture evidence.
- The backend progress stream uses a created check's `eventsUrl` when available, reconnects transient EventSource failures, and resumes with `after_seq` based on the last accepted progress event.
- API mode defaults to `mock` during `bun run dev` and `backend` in production. Override with `VITE_TRUSTTRACE_API_MODE=mock|backend`.
- `VITE_TRUSTTRACE_API_BASE_URL` controls the backend API base URL and defaults to same-origin `/v1`; `vite.config.ts` proxies `/v1` to `http://127.0.0.1:8000` for local backend development.
- Theme preference persists to `localStorage` via `preferences.store.ts` and is applied with the root `data-theme` attribute.

## Commands

From this package:

```sh
bun run dev
bun run format
bun run lint
bun run typecheck
bun run test
bun run build
```

See [docs/](../../docs/) for conventions, quality tooling, and architecture.
