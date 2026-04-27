# Roadmap

Frontend readiness priorities for backend integration, plus longer-horizon backlog.

## Frontend Readiness

> **Scope:** `apps/web` before backend integration.
> **Constraint:** Keep visible product behavior stable unless a task explicitly changes copy or UX.

The frontend runs on backend-shaped mocks: API contract, async `useCreateCheck`, checkId-driven routes, progress/SSE lifecycle, split types, and a `mock|backend` mode switch.

### Done

| #   | Improvement                                                                                                | Primary files                                                |
| --- | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| 6   | URL validation and submit trimming                                                                         | `ClaimInputCard.vue`                                         |
| 7   | Create-check submitting / error state                                                                      | `useCreateCheck.ts`, `ClaimInputCard.vue`                    |
| 8   | Backend error model (code, category, traceId, retryable)                                                   | `CheckErrorPage.vue`, `types/api.ts`                         |
| 9   | Privacy copy revisited (no browser-only claims)                                                            | `features/checks/**`                                         |
| 10  | Types split into focused per-concern files (api, events, progress, evidence, list, cues, input, viewmodel) | `features/checks/types/`                                     |
| 11  | Evidence semantics: supports / contradicts / neutral, real URLs                                            | `EvidenceLadder.vue`                                         |
| 14  | Clipboard failure handling                                                                                 | `CheckResultPage.vue`                                        |
| 15  | External evidence link safety (`http(s)` URL validation, `rel`, `target`)                                  | `EvidenceLadder.vue`, `backendCheckSchemas.ts`               |
| 16  | Demo/prod mode isolation via `VITE_TRUSTTRACE_API_MODE`                                                    | `app/env.ts`                                                 |
| 17  | API base URL via `VITE_TRUSTTRACE_API_BASE_URL` (deployment values pending)                                | `app/env.ts`, `vite.config.ts`                               |
| 18  | Frontend runtime validation for backend responses                                                          | `backendChecksClient.ts`, `backendCheckSchemas.ts`           |
| 19  | Persisted check input for refresh-safe loading/error pages                                                 | `types/api.ts`, `CheckLoadingPage.vue`, `CheckErrorPage.vue` |
| 20  | Route document titles and render-error reset on navigation                                                 | `router/index.ts`, `AppShell.vue`                            |
| 21  | Result page/component regression tests                                                                     | `CheckResultPage.test.ts`, result component tests            |

### Open

| #   | Improvement              | Notes                                                                                                         | Primary files                                |
| --- | ------------------------ | ------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| 12  | Decide history strategy  | Local-only, server-backed, or hybrid — affects the `listChecks` contract.                                     | `useCheckHistory.ts`, `CheckHistoryPage.vue` |
| 13  | Fill remaining test gaps | History page and deeper accessibility states; input / create / progress / loading / result / api are covered. | composables, pages                           |
| 18  | Accessibility polish     | Tooltip IDs, loading semantics, icon labels, reduced-motion.                                                  | shared UI                                    |

### Acceptance before wiring the backend

- All routes work from direct URL navigation and refresh.
- URL submissions require `http(s)://`.
- Backend check records include persisted `input` for refresh-safe loading/error routes.
- Backend response payloads pass frontend Zod contract validation.
- User-facing copy does not claim browser-only processing.
- Tests cover the happy path and at least one API failure path.

### Deferred decisions

- History storage: local-only, server-backed, or hybrid.
- Frontend i18n.
- Extract stable DTO schemas to `packages/contracts` after `apps/server` settles.

## Next: Backend Implementation

Frontend is largely backend-ready. The next track is `apps/server`, following [claim-checking-pipeline.md](claim-checking-pipeline.md): claim parsing → authority-aware search → URL verification → extraction → per-source evaluation → deterministic synthesis → LLM explanation.

## Backlog

Revisit only after the backend powers the core check flow, contracts are settled, and basic tests exist.

- **i18n/localization** — for a real multilingual launch.
- **Design system cleanup** — extract shared components after UI patterns settle.
- **Accessibility audit** — deeper pass once UI stabilizes.
- **Reports, sharing, export** — once report data and privacy rules are clear.
- **Accounts and teams** — once single-user flow is proven.
- **Browser extension / API / integrations** — once the create-check API is stable.
- **Mobile/PWA polish** — wait for real mobile usage signal.
- **Analytics/experiments** — define after product metrics are clear.
- **Visual, animation, performance polish** — not the integration bottleneck.
