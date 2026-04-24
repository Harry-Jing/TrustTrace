# Dev Tooling

Dev tooling is available only for local mock/demo flows. The app now separates the build environment from the API data source:

| Setting | Meaning |
|---|---|
| `import.meta.env.DEV` | Vite development build. Does not imply mock data by itself. |
| `VITE_TRUSTTRACE_API_MODE=mock \| backend` | Selects the checks API client. Defaults to `mock` in dev and `backend` in production. |
| `VITE_TRUSTTRACE_API_BASE_URL` | Base URL for the backend API client. Defaults to same-origin `/v1`. |

`showDevTools` is true only when the app is running in Vite dev mode **and** `apiMode === 'mock'`. This keeps demo controls and fixture-backed loading evidence out of backend debugging, even when using `bun run dev`.

## Components

All dev-only components live in `apps/web/src/app/` and are prefixed with `Dev`:

| Component | Purpose |
|---|---|
| `DevNav.vue` | Floating action button (FAB) in the bottom-right corner. Opens a menu to jump between the 5 demo pages. Resets demo check progress when navigating to the loading page. |
| `DevLoadingControls.vue` | Phase switcher rendered inside `ProgressTimeline` via slot. Allows manually stepping through loading phases and triggering the completion flow. |

`DevNav` is mounted in `AppShell.vue` behind the `showDevTools` guard. `DevLoadingControls` is rendered in `CheckLoadingPage.vue` behind the same guard.

## Behavior by API mode

| Area | Mock mode with dev tools | Backend mode |
|---|---|---|
| Loading page auto-redirect | Disabled while controls are visible, so each phase can be inspected. | Automatically redirects to result or error when the check completes or fails, including during `bun run dev`. |
| Loading page completion | Must click "done" in the dev controls to trigger the celebration animation and redirect. | Triggered automatically by check status updates. |
| Loading evidence stream | Shows fixture-backed demo evidence for visual inspection. | Does not show demo evidence; progress comes from backend status/SSE data. |
| Demo check reset | `DevNav` calls `devResetCheckProgress()` before navigating to the loading page. | Not available; backend API data drives progress. |
| Shorthand routes | `/loading`, `/result`, `/error` redirect to demo check routes. | Not registered. Only `/checks/:checkId/*` routes are available. |
| Unknown check IDs | Known fixture IDs return demo records; unknown IDs return a mock not-found failure. | Backend API response is surfaced through the backend client. |

## API layer

`apps/web/src/features/checks/api/checksApi.ts` is the public frontend API boundary. It delegates to:

- `mockChecksClient.ts` — mock-only in-memory data and timers for demo/debug flows.
- `backendChecksClient.ts` — fetch/EventSource client for the TypeScript backend. It uses a check's `eventsUrl` when available, retries transient stream disconnects, and resumes with `after_seq` from the last accepted progress event.

Dev helpers exported from `checksApi.ts` are mock-only and should only be called from UI guarded by `showDevTools`.

## Guard pattern

Use `showDevTools` for demo/debug UI and `apiMode`/`isMockApiMode` for API-client behavior:

```ts
export const apiMode =
  readApiMode(import.meta.env.VITE_TRUSTTRACE_API_MODE) ??
  (import.meta.env.DEV ? 'mock' : 'backend')
export const showDevTools = import.meta.env.DEV && apiMode === 'mock'
```

Do not use `import.meta.env.DEV` alone to change check lifecycle behavior, because backend integration also happens in local dev mode.
