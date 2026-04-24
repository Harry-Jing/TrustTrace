# Roadmap

Frontend readiness priorities for backend integration, plus longer-horizon backlog items.

## Frontend Readiness

> **Scope:** `apps/web` Vue frontend before backend integration.
> **Constraint:** Keep visible product behavior stable unless a task explicitly asks to change product copy or UX.

Move the current fixture-backed frontend toward a backend-ready architecture without rewriting the UI. The main risk is not visual polish; it is data-contract drift, check lifecycle assumptions, privacy copy, and thin test coverage around the future API path.

Priorities are ordered by: (1) how strongly the item blocks backend integration, (2) how much rework it prevents later, (3) how directly it affects user trust or correctness.

P0 items (API contract, checksApi reshape, async useCreateCheck, checkId-driven routes, progress/SSE lifecycle) have been implemented as backend-shaped mocks. The priorities below remain open.

### P1 — Strongly recommended before backend integration

| # | Improvement | Why it matters | Primary files |
|---|---|---|---|
| 6 | Add basic URL validation and submit trimming | Implemented for `http(s)://` URL input and trimmed submissions. | `ClaimInputCard.vue` |
| 7 | Add create-check submitting/error state | Implemented for the landing input path; retry/error-page polish remains backend-dependent. | `useCreateCheck.ts`, `CheckHomePage.vue`, `ClaimInputCard.vue` |
| 8 | Replace hardcoded error page with backend error model | Backend errors need codes, trace IDs, retryability. | `CheckErrorPage.vue`, `checksApi.ts` |
| 9 | Revisit privacy and local-only copy | Implemented for current UI copy; claims about browser-only or no server-side storage were removed. | `features/checks/**/*` |
| 10 | Separate API result semantics from UI display fields | Frontend types are now split into focused API/event/progress/evidence/list/ViewModel files; backend DTO/schema alignment remains deferred. | `features/checks/types/`, `ResultSummary.vue`, `useCheckResult.ts` |

### P2 — Important after the main API path is stable

| # | Improvement | Why it matters | Primary files |
|---|---|---|---|
| 11 | Improve evidence semantics | Evidence shouldn't always display as "supports"; links shouldn't be `#` placeholders. | `EvidenceItemsList.vue`, `types.ts` |
| 12 | Decide history strategy | Local-only vs server-backed vs hybrid. | `useCheckHistory.ts`, `CheckHistoryPage.vue` (now uses unified `listChecks()` via `GET /v1/checks`) |
| 13 | Add tests for the core check flow | Cover create → loading → result, API errors, URL validation, history. | composables, check pages |
| 14 | Handle clipboard failures | Don't show copy success when Clipboard API fails. | `CheckResultPage.vue`, `ResultActions.vue`, `ResultSummary.vue` |
| 15 | Harden external evidence links | Safe external-link attributes; non-link fallback when absent. | `EvidenceItemsList.vue` |

### P3 — Can wait until backend integration is underway

| # | Improvement | Why it matters | Primary files |
|---|---|---|---|
| 16 | Further isolate demo/prod mode | Implemented with `VITE_TRUSTTRACE_API_MODE=mock|backend`; dev tools are mock-mode only. | `app/env.ts`, `checksApi.ts`, `AppShell.vue` |
| 17 | Finalize API base URL and environment config | Basic `VITE_TRUSTTRACE_API_BASE_URL` support exists; deployment-specific values remain to be finalized. | `app/env.ts`, `vite.config.ts` |
| 18 | Address accessibility polish | Tooltip IDs, loading semantics, icon labels, reduced-motion. | shared UI and check components |

### Acceptance criteria before wiring the backend

- Loading, result, error, and history routes work from direct URL navigation and browser refresh.
- URL submissions reject obvious non-URLs and require `http(s)://`.
- User-facing copy does not claim browser-only processing if the backend receives input.
- Tests cover the create/check/result happy path and at least one API failure path.

### Deferred decisions

- Whether history is local-only, server-backed, or hybrid.
- Whether to reintroduce frontend i18n.
- Final backend result DTO shape, shared schema, and frontend ViewModel adapter boundary.

## Backlog

Items to revisit only after the backend powers the core check flow, API/data contracts are settled, and basic tests exist.

- **i18n/localization** — revisit for a real multilingual launch or customer need.
- **Design system cleanup** — extract shared components after UI patterns settle.
- **Accessibility audit** — deeper pass once the main UI stops changing.
- **Reports, sharing, and export** — wait until report data and privacy rules are clear.
- **Accounts and teams** — wait until the single-user flow is proven.
- **Browser extension/API/integrations** — wait until the create-check API is stable.
- **Mobile/PWA polish** — wait for real mobile usage signal.
- **Analytics/experiments** — define after product metrics are clear.
- **Visual, animation, and performance polish** — not the backend-integration bottleneck.
