# Dev Tooling

Dev tooling powers the local mock/demo workflow in `apps/web`. It is available only when the app runs in Vite dev mode and `VITE_TRUSTTRACE_API_MODE=mock`.

## Concerns

The tooling separates four concerns:

1. **Data source** — backend vs. in-memory mocks, selected at boot through `VITE_TRUSTTRACE_API_MODE`.
2. **Scenario** — success or failure behavior for the mock pipeline, persisted to `localStorage` and shareable with `?scenario=`.
3. **Demo claim** — the fixture/result band currently rendered.
4. **Page jumps and mock-state actions** — pure navigation plus explicit reset/complete/fail verbs.

Only the data source is fixed for a session. The other controls live in the floating dev panel.

## Environment and storage

| Setting                                    | Meaning                                                             |
| ------------------------------------------ | ------------------------------------------------------------------- |
| `import.meta.env.DEV`                      | Vite development build; does not imply mock mode by itself.         |
| `VITE_TRUSTTRACE_API_MODE=mock \| backend` | Selects the checks API client; defaults to `backend`.               |
| `VITE_TRUSTTRACE_API_BASE_URL`             | Backend base URL; defaults to same-origin `/v1`.                    |
| `?scenario=<id>`                           | Seeds active scenario on first load.                                |
| `localStorage`                             | Stores scenario, panel open state, active demo check, and sections. |

`showDevTools` is:

```ts
export const apiMode = readApiMode(import.meta.env.VITE_TRUSTTRACE_API_MODE) ?? "backend";
export const showDevTools = import.meta.env.DEV && apiMode === "mock";
```

Do not use `import.meta.env.DEV` alone to change check lifecycle behavior; backend integration also happens in local dev mode.

## Code layout

```txt
apps/web/src/dev/
  devConfig.ts
  scenarios.ts
  scenarioState.ts
  stores/dev.store.ts
  composables/useMockRecordSync.ts
  components/DevPanel.vue
  components/DevLoadingControls.vue
```

The dev panel is dynamically imported behind `showDevTools` so production bundles do not include it.

## Components

- `DevPanel` — bottom-right mock FAB that opens a panel with Scenario, Demo claim, Jump to, and Mock state sections. Under 640px it becomes a bottom sheet.
- `DevLoadingControls` — loading-page controls to jump to a phase, replay the scenario, force-complete, or force-fail.

The panel has no keyboard shortcut because the app is form-heavy and unmodified-key shortcuts can collide with input focus.

## Built-in scenarios

| Id                       | Behavior                                               |
| ------------------------ | ------------------------------------------------------ |
| `success`                | Plays the full pipeline and lands on the result page.  |
| `success.instant`        | Completes immediately.                                 |
| `error.timeout`          | Fails at discovery with `PROVIDER_TIMEOUT`.            |
| `error.input_extraction` | Fails at understanding with `INPUT_EXTRACTION_FAILED`. |
| `error.provider_config`  | Fails immediately with `PROVIDER_CONFIGURATION_ERROR`. |

Add scenarios by appending to `DEV_SCENARIOS` in `dev/scenarios.ts`. Per-phase inspection should use `DevLoadingControls` rather than creating one scenario per phase.

Scenario records should stay flat and explicit: progress steps, `stepDelayMs`, and a typed terminal outcome (`completed` or `failed` with `CheckApiError`).

## Demo claims

Fixtures cover four display bands:

| Demo id                  | Band              | Purpose                                   |
| ------------------------ | ----------------- | ----------------------------------------- |
| `demo-seat-belts`        | `evidence_strong` | Standard happy path and primary fallback. |
| `demo-vitamin-c-colds`   | `evidence_mixed`  | Sources support a narrower claim.         |
| `demo-handwritten-notes` | `evidence_weak`   | Thin replication around one study.        |
| `demo-ai-dangerous`      | `needs_context`   | Claim is too broad to verify cleanly.     |

Failure states come from scenarios, not from separate claim fixtures.

## Panel interaction contract

- Picking a demo claim swaps `:checkId` in place when already on a check route.
- Mock-state verbs mutate the in-memory record and route to the matching loading/result/error page.
- Jump-to actions are pure navigation; they must not force-complete or force-fail records.

## Mock record sync

`useMockRecordSync(checkId, reload)` is the sanctioned page-side way to react to mock mutations. Mock helpers dispatch `MOCK_RECORD_CHANGED_EVENT`; page composables re-fetch when the matching check ID changes. This is needed because `router.replace` to the same route is otherwise a no-op.

## Behavior by API mode

| Area                 | Mock mode with dev tools                                         | Backend mode                                 |
| -------------------- | ---------------------------------------------------------------- | -------------------------------------------- |
| Loading redirect     | Disabled while controls are visible for phase inspection.        | Redirects automatically on completed/failed. |
| Replay/outcome tools | Available through dev controls.                                  | Not available; server state drives progress. |
| Loading header       | Same phase labels; no live status pill or percent.               | Same, driven by backend SSE events.          |
| Shorthand routes     | `/loading`, `/result`, `/error` redirect to demo check routes.   | Not registered.                              |
| Unknown check IDs    | Known fixtures load; unknown IDs become mock not-found failures. | Backend response is surfaced by the client.  |

## API layer

`checksApi.ts` delegates to:

- `mockChecksClient.ts` for scenario-driven in-memory data;
- `backendChecksClient.ts` for fetch/EventSource against the backend;
- `backendCheckSchemas.ts` for shared-contract validation plus frontend DTO mapping.

Mock-only helpers (`devResetCheckProgress`, `devSetCheckCompleted`, `devSetCheckFailed`) should only be called from UI guarded by `showDevTools`.
