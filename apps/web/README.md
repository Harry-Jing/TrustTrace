# TrustTrace Web

`@trusttrace/web` is the Vue 3 frontend for TrustTrace. Backend mode is the default; fixture-backed mock mode is available for local demos and UI inspection.

## Run

```sh
bun run dev
bun run lint
bun run typecheck
bun run test
bun run test:watch
bun run build
```

Formatting is root-owned; run `bun run format` from the repository root.

## Environment

```sh
VITE_TRUSTTRACE_API_MODE=backend
VITE_TRUSTTRACE_API_BASE_URL=/v1
```

- `backend` mode calls the Hono API.
- `mock` mode enables fixture-backed data and the dev panel when running in Vite dev mode.
- Local Vite dev proxies `/v1` to `http://127.0.0.1:8000`.

## Routes

| Route                           | Name       | Purpose                                 |
| ------------------------------- | ---------- | --------------------------------------- |
| `/`                             | —          | Redirects to `/checks/new`.             |
| `/checks/new`                   | `landing`  | New-check screen.                       |
| `/checks/:checkId/loading`      | `loading`  | Check-specific progress route.          |
| `/checks/:checkId/result`       | `result`   | Check-specific result route.            |
| `/checks/:checkId/error`        | `error`    | Check-specific failure route.           |
| `/history`                      | `history`  | Searchable/sortable history cards.      |
| `/settings`                     | `settings` | Theme and discovery-strategy settings.  |
| `/loading`, `/result`, `/error` | —          | Dev-only shorthand routes in mock mode. |

## Structure

```txt
src/app/                         App shell, nav, env
src/components/                  Shared Base* UI primitives
src/dev/                         Mock/dev-only panel, scenarios, helpers
src/features/checks/api/         API clients and DTO-to-view-model mapping
src/features/checks/components/  Check-flow presentation components
src/features/checks/composables/ Page-facing data/lifecycle composables
src/features/checks/constants/   Product constants and tone maps
src/features/checks/fixtures/    Static demo data
src/features/checks/pages/       Route-level page orchestration
src/features/checks/stores/      Check lifecycle Pinia store
src/features/checks/types/       API, event, evidence, list, and view-model types
src/features/settings/           Settings page and controls
src/router/                      Vue Router configuration
src/stores/                      App-wide Pinia stores
```

## Key behavior

- `checksApi.ts` selects mock or backend clients based on `VITE_TRUSTTRACE_API_MODE`.
- Backend JSON is validated with shared `@trusttrace/contracts` schemas before mapping into frontend view models.
- Creating a check returns a `checkId`; routes are driven by `/checks/:checkId/*`.
- Progress uses SSE and resumes with `afterSeq`; the loading flow falls back to polling if the stream is unavailable or lost.
- `preferences.store.ts` persists theme and default discovery strategy to `localStorage`.
- Mock/demo UI is rendered only when `showDevTools` is true.

## Related docs

- [Frontend architecture](../../docs/architecture/frontend.md)
- [Development conventions](../../docs/development/conventions.md)
- [Dev tooling](../../docs/development/dev-tooling.md)
- [API reference](../../docs/reference/api.md)
