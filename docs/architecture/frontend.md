# Frontend Architecture

`apps/web` is the TrustTrace Vue 3 SPA. It uses Vite for dev/build, Vue Router for routes, Pinia for state, Tailwind CSS v4 for styling, and Vitest/Vite for tests.

## API modes

`VITE_TRUSTTRACE_API_MODE` selects the checks API client:

- `backend` — default in development and production; calls the Hono API.
- `mock` — explicit fixture-backed mode for demo and local UI inspection.

`VITE_TRUSTTRACE_API_BASE_URL` controls the backend base URL and defaults to same-origin `/v1`. Vite proxies `/v1` to `http://127.0.0.1:8000` locally.

## Routes

| Route                      | Name       | Purpose                                |
| -------------------------- | ---------- | -------------------------------------- |
| `/`                        | —          | Redirects to `/checks/new`.            |
| `/checks/new`              | `landing`  | New-check form.                        |
| `/checks/:checkId/loading` | `loading`  | Progress route for one check.          |
| `/checks/:checkId/result`  | `result`   | Result route for one completed check.  |
| `/checks/:checkId/error`   | `error`    | Failure route for one failed check.    |
| `/history`                 | `history`  | Searchable/sortable history cards.     |
| `/settings`                | `settings` | Theme and discovery-strategy settings. |

Dev-only shorthand routes `/loading`, `/result`, and `/error` exist only when `showDevTools` is true.

## Code layout

```txt
src/app/                         App shell, nav, env
src/components/                  Shared Base* UI primitives
src/dev/                         Mock/dev-only panel, scenarios, helpers
src/features/checks/api/         API clients, runtime validation, DTO mapping
src/features/checks/components/  Check-flow presentation components
src/features/checks/composables/ Page-facing data and lifecycle composables
src/features/checks/constants/   Product constants and UI tone maps
src/features/checks/fixtures/    Mock/demo data
src/features/checks/pages/       Route-level orchestration
src/features/checks/stores/      Check lifecycle Pinia store
src/features/checks/types/       API, event, evidence, list, and view-model types
src/features/settings/           Settings page and controls
src/router/                      Vue Router configuration
src/stores/                      App-wide Pinia stores such as preferences
```

## Boundary rules

- `checksApi.ts` is the stable frontend API boundary.
- Backend JSON is validated with shared `@trusttrace/contracts` Zod schemas before mapping into frontend view-model types.
- Wire payloads carry data, not presentation tokens. Visual treatment is derived client-side from stable enums such as `verdictBand`.
- Frontend code renders only absolute `http(s)` evidence links.
- Progress uses SSE with reconnect and `afterSeq` resume; loading composables fall back to polling `GET /v1/checks/:checkId` when the stream is unavailable or lost.

## Ownership boundaries

- `api/` owns fetch, SSE, runtime contract validation, and DTO-to-view-model mapping. Do not bypass `checksApi.ts` for check data.
- `composables/` own page-facing async state and lifecycle coordination.
- `pages/` own route-level orchestration and navigation decisions.
- `stores/` own shared cache, preferences, and cross-route state.
- `components/` should stay mostly presentational; push network calls, route side effects, and persistence into the owning layer above.
- `constants/` own stable product copy maps, progress definitions, and semantic tone mappings used by more than one component.

## State

- `checks.store.ts` caches current check metadata and progress by check ID.
- `preferences.store.ts` persists theme and default discovery strategy to `localStorage` and applies theme through the root `data-theme` attribute.
- Settings also shows save-history, bring-your-own keys, search depth, and reasoning rigor as disabled coming-soon placeholders.

Dev tooling details live in [../development/dev-tooling.md](../development/dev-tooling.md).
