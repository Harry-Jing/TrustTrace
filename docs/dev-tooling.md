# Dev Tooling

Dev tooling powers the local mock/demo workflow. The implementation separates four concerns that were previously fused into one floating button:

1. **Data source** — backend vs in-memory mocks. Selected at boot via `VITE_TRUSTTRACE_API_MODE`.
2. **Scenario** — what the mock pipeline does (success vs failure variant). Switchable at runtime; persisted to `localStorage`; shareable via the `?scenario=` URL parameter.
3. **Demo claim** — which fixture (and thus which `verdictBand`) the result page renders. Picking a claim while on a `/checks/:checkId/*` route swaps the route's `:checkId` in place so the page re-derives.
4. **Page jumps + mock-state actions** — pure navigation between demo pages, plus explicit verbs to reset / complete / fail the current mock check. Mock-state verbs route to the corresponding page after mutating, so panel buttons and the per-page DevLoadingControls produce the same observable result.

The first concern is fixed for a session. The other three live in a single floating dev panel that follows the small-OSS-devtools convention (FAB collapsed → fixed-width panel with internal scroll, four collapsible sections, becomes a bottom sheet under 640px). It opens by clicking the FAB; there is no keyboard shortcut, since the app is form-heavy and any unmodified key risks colliding with input focus.

## Environment

| Setting                                    | Meaning                                                                                                                                                                   |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `import.meta.env.DEV`                      | Vite development build. Does not imply mock data by itself.                                                                                                               |
| `VITE_TRUSTTRACE_API_MODE=mock \| backend` | Selects the checks API client. Defaults to `backend`; set `mock` explicitly for fixture-backed demo mode.                                                                 |
| `VITE_TRUSTTRACE_API_BASE_URL`             | Base URL for the backend API client. Defaults to same-origin `/v1`.                                                                                                       |
| `?scenario=<id>` URL parameter             | Seeds the active scenario on first load. Subsequent picks via the panel overwrite the URL and `localStorage`.                                                             |
| `localStorage` keys                        | `tt-dev-scenario`, `tt-dev-panel-open`, `tt-dev-demo-check-id`, `tt-dev-collapsed-sections` (comma-joined section ids that are collapsed; missing = default open/closed). |

`showDevTools` is true only when the app is running in Vite dev mode **and** `apiMode === 'mock'`. The panel is dynamically imported behind this flag so it is tree-shaken out of production bundles.

## Code layout

All dev-only modules live under `apps/web/src/dev/`:

```
dev/
  devConfig.ts                   # Storage keys, query-param names, panel-section enum, PRIMARY_DEMO_CHECK_ID re-export
  scenarios.ts                   # Five named scenarios + per-phase percent/message lookup
  scenarioState.ts               # Pinia-free URL/localStorage helpers (mock client uses these)
  stores/
    dev.store.ts                 # Reactive scenario id, panel open state, active demo claim, per-section collapsed state
  composables/
    useMockRecordSync.ts         # MOCK_RECORD_CHANGED_EVENT + dispatcher + useMockRecordSync(checkId, reload)
  components/
    DevPanel.vue                 # Floating FAB + collapsible panel (mounted from AppShell)
    DevLoadingControls.vue       # Per-page phase + outcome controls on the loading page
```

The dev tooling never imports from page or feature code. Page code may import from `dev/`, but only inside `v-if="showDevTools"` guards or via composables that already self-no-op when the guard is false (see `useMockRecordSync`).

`useMockRecordSync(checkId, reload)` is the only sanctioned way for page-side composables to react to dev-panel mock mutations. The mock client's `devSet*` / `devReset*` helpers call `dispatchMockRecordChanged(checkId)` (also exported from `dev/composables/useMockRecordSync.ts`), and any composable rendering a check calls `useMockRecordSync` to re-fetch when the matching `checkId` is mutated. This matters because `router.replace` to the same `:checkId` route is a no-op, so without the broadcast the panel's force-fail / force-complete / reset on the currently-viewed record would update memory but not the screen.

## Components

| Component            | Purpose                                                                                                                                                                                                                                                                                                                           |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DevPanel`           | Bottom-right "● Mock · &lt;scenario&gt;" FAB. Click opens a panel with four collapsible sections: Scenario (radios), Demo claim (radios + verdict-band chip), Jump to (pure navigation), Mock state (reset / complete / fail verbs). The panel internally scrolls; under 640px it becomes a bottom sheet pinned to the safe area. |
| `DevLoadingControls` | Rendered at the bottom of the loading page. Lets you jump to any active phase (with the scenario's percent + message), replay the scenario, force-complete, or force-fail.                                                                                                                                                        |

`DevPanel` is mounted in `AppShell.vue` behind the `showDevTools` guard via `defineAsyncComponent` + dynamic import, so the production bundle never sees it. `DevLoadingControls` is rendered in `CheckLoadingPage.vue` behind the same guard.

## Scenarios

Scenarios are defined in `dev/scenarios.ts` as a flat array of `DevScenario` records. Each scenario describes:

- the progress steps the mock pipeline emits,
- the per-step delay in ms (`stepDelayMs`; `0` for instant),
- the terminal outcome (`completed` or `failed` with a typed `CheckApiError`).

The mock client reads the active scenario at the moment a check is created (`createCheck`), reset (`devResetCheckProgress`), or subscribed to (`subscribeCheckEvents`). Manual phase overrides on the loading page also use the scenario's percent + message lookup, so the displayed progress is consistent whether you click through phases by hand or watch the auto-played stream.

Adding a scenario: append to `DEV_SCENARIOS` in `dev/scenarios.ts`. The id must be unique. The scenario shows up in the panel automatically.

Built-in scenarios:

| Id                       | Behavior                                                               |
| ------------------------ | ---------------------------------------------------------------------- |
| `success`                | Plays the full pipeline and lands on the result page (default).        |
| `success.instant`        | Skips to a completed result with no delay.                             |
| `error.timeout`          | Fails at discovery with `PROVIDER_TIMEOUT` (retryable).                |
| `error.input_extraction` | Fails at understanding with `INPUT_EXTRACTION_FAILED` (retryable).     |
| `error.provider_config`  | Fails immediately with `PROVIDER_CONFIGURATION_ERROR` (non-retryable). |

For "what does this loading phase look like in isolation", use the per-phase buttons in `DevLoadingControls` rather than adding a new scenario — the buttons read the scenario's percent/message lookup and override the displayed phase without restarting playback.

## Demo claims

`DEMO_CHECKS` (in `apps/web/src/features/checks/fixtures/demoChecks.ts`) is intentionally minimal. The list covers the four `verdictBand` values that have a per-claim fixture in `demoResults.ts`:

| Demo id                  | `verdictBand`     | Purpose                                                                                              |
| ------------------------ | ----------------- | ---------------------------------------------------------------------------------------------------- |
| `demo-seat-belts`        | `evidence_strong` | Standard happy-path fixture. Also `PRIMARY_DEMO_CHECK_ID` and the `FALLBACK_RESULT` for unknown ids. |
| `demo-vitamin-c-colds`   | `evidence_mixed`  | Sources support a narrower claim than the one being made.                                            |
| `demo-handwritten-notes` | `evidence_weak`   | The headline number traces to one study with shaky replication.                                      |
| `demo-ai-dangerous`      | `needs_context`   | Edge case: claim is too broad to verify; sources don't cleanly support or contradict.                |

Failure states are reachable through scenarios (`error.timeout`, `error.input_extraction`, `error.provider_config`) — claims do not double as failure fixtures, so picking any claim with any error scenario produces the failure variant for that claim.

## Panel layout & interaction

The `DevPanel` follows the small-OSS-devtools convention surveyed against Pinia Colada Devtools, Leva, BUOY, and Astro Dev Toolbar:

- **Width / height**: `width: min(22rem, 100vw - 2rem)`; `max-height: min(640px, 100dvh - 6rem)`. Internal scroll handles overflow; the FAB and footer stay anchored.
- **Mobile**: under 640px the panel becomes a bottom sheet (`inset-x-2 bottom-2`), pinned above the iOS safe-area inset. The FAB stays in the corner and contracts to "● Mock" only.
- **Sections**: four `<details>` blocks (Scenario, Demo claim, Jump to, Mock state). Default-open: Scenario, Demo claim. Default-collapsed: Jump to, Mock state. Each section's collapsed state persists in `localStorage[tt-dev-collapsed-sections]`.
- **Open / close**: FAB click only. No keyboard shortcut — the app is form-heavy enough that any unmodified-key shortcut risks colliding with input focus flows.
- **Demo-claim picker**: when the user is on a `/checks/:checkId/(loading|result|error)` route, picking a different claim issues a `router.replace` that swaps `:checkId` in place, so the same page re-derives against the new fixture.
- **Mock-state verbs**: `reset / complete / fail` mutate the in-memory mock record and, when the user is on a check-scoped route, `router.replace` to the matching state route (`loading / result / error` respectively). This unifies behavior with the loading-page's `DevLoadingControls`, where `handleFail` / `handleComplete` produce the same observable result.
- **Jump to**: pure navigation. Result and error jumps no longer silently force-complete or force-fail the record. To produce a state change, use Mock state.

## Behavior by API mode

| Area                       | Mock mode with dev tools                                                                                                                  | Backend mode                                                                                                       |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Loading page auto-redirect | Disabled while controls are visible, so each phase can be inspected.                                                                      | Automatically redirects to result or error when the check completes or fails, including during `bun run dev`.      |
| Loading page outcome       | The `complete` / `fail` buttons in `DevLoadingControls` apply the terminal state and trigger the redirect.                                | Triggered automatically by check status updates.                                                                   |
| Replay                     | The `replay` button calls `devResetCheckProgress` and re-subscribes; new scenario picks affect the next replay.                           | Not available; backend API data drives progress.                                                                   |
| Loading phase header       | Shows the current phase's `nowLabel`, `title`, and a one-sentence `description` from `PHASE_DEFINITIONS`. No live status pill or percent. | Same — phase comes from backend SSE events; the page never renders a status pill regardless of message or percent. |
| Shorthand routes           | `/loading`, `/result`, `/error` redirect to demo check routes for the primary demo fixture (`PRIMARY_DEMO_CHECK_ID`).                     | Not registered. Only `/checks/:checkId/*` routes are available.                                                    |
| Unknown check IDs          | Known fixture IDs return demo records; unknown IDs return a mock not-found failure.                                                       | Backend API response is surfaced through the backend client.                                                       |

## API layer

`apps/web/src/features/checks/api/checksApi.ts` is the public frontend API boundary. It delegates to:

- `mockChecksClient.ts` — scenario-driven in-memory client. Reads the active scenario via `dev/scenarioState.ts` (Pinia-free) at the moment of `createCheck`, `devResetCheckProgress`, or `subscribeCheckEvents`.
- `backendChecksClient.ts` — fetch/EventSource client for the TypeScript backend. Backend
  progress uses SSE with server heartbeats; if the stream is lost after retries, the loading
  composable falls back to polling `GET /v1/checks/:checkId` until the check completes or fails.
- `backendCheckSchemas.ts` — frontend-local Zod contract schemas for backend responses.

Mock-only helpers exported from `checksApi.ts`:

| Helper                  | Purpose                                                                              |
| ----------------------- | ------------------------------------------------------------------------------------ |
| `devResetCheckProgress` | Reset a mock record to its initial phase under the active scenario.                  |
| `devSetCheckCompleted`  | Force a mock record into the completed state with the demo result view model.        |
| `devSetCheckFailed`     | Force a mock record into the failed state using the active scenario's error variant. |

These should only be called from UI guarded by `showDevTools`.

## Guard pattern

Use `showDevTools` for demo/debug UI and `apiMode`/`isMockApiMode` for API-client behavior:

```ts
export const apiMode = readApiMode(import.meta.env.VITE_TRUSTTRACE_API_MODE) ?? "backend";
export const showDevTools = import.meta.env.DEV && apiMode === "mock";
```

Do not use `import.meta.env.DEV` alone to change check lifecycle behavior, because backend integration also happens in local dev mode.
