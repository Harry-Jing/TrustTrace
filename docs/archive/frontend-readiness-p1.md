# Archive: Frontend Readiness P1

Historical context from the pre-backend-integration frontend readiness plan. This is not the current roadmap.

## Original scope

`apps/web` before backend integration, with visible product behavior kept stable unless a task explicitly changed copy or UX.

The frontend ran on backend-shaped mocks: API contract, async create-check flow, checkId-driven routes, progress/SSE lifecycle, split types, and a `mock|backend` mode switch.

## Completed improvements

| #   | Improvement                                                                            | Primary files                                                                 |
| --- | -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| 6   | URL validation and submit trimming                                                     | `ClaimInputCard.vue`                                                          |
| 7   | Create-check submitting / error state                                                  | `useCreateCheck.ts`, `ClaimInputCard.vue`                                     |
| 8   | Backend error model: code, category, traceId, retryable                                | `CheckErrorPage.vue`, `types/api.ts`                                          |
| 9   | Privacy copy revisited, removing browser-only claims                                   | `features/checks/**`                                                          |
| 10  | Types split into focused per-concern files                                             | `features/checks/types/`                                                      |
| 11  | Evidence semantics: supports / contradicts / neutral and real URLs                     | `EvidenceLadder.vue`                                                          |
| 14  | Clipboard failure handling                                                             | `CheckResultPage.vue`                                                         |
| 15  | External evidence link safety                                                          | `EvidenceLadder.vue`, `backendCheckSchemas.ts`                                |
| 16  | Demo/prod mode isolation through `VITE_TRUSTTRACE_API_MODE`                            | `app/env.ts`                                                                  |
| 17  | API base URL through `VITE_TRUSTTRACE_API_BASE_URL`                                    | `app/env.ts`, `vite.config.ts`                                                |
| 18  | Frontend runtime validation for backend responses                                      | `backendChecksClient.ts`, `backendCheckSchemas.ts`                            |
| 19  | Persisted check input for refresh-safe loading/error pages                             | `types/api.ts`, loading/error pages                                           |
| 20  | Route document titles and render-error reset on navigation                             | `router/index.ts`, `AppShell.vue`                                             |
| 21  | Result/API boundary regression coverage                                                | validation, unsafe evidence links, result mapping tests                       |
| 22  | Settings page: theme, discovery strategy, save-history placeholder, about, gear in nav | `features/settings/`, `preferences.store.ts`, `AppNav.vue`, `router/index.ts` |
| 23  | Wire `discoveryStrategy` into create-check requests from preferences                   | `useCreateCheck.ts`, backend/mock clients, `checksApi.ts`                     |

## Historical acceptance criteria

- All routes work from direct URL navigation and refresh.
- URL submissions require `http(s)://`.
- Backend check records include persisted input for refresh-safe loading/error routes.
- Backend response payloads pass frontend Zod contract validation.
- User-facing copy does not claim browser-only processing.
- Tests cover the happy path and at least one API failure path.

## Deferred decisions carried forward

- History storage: local-only, server-backed, or hybrid.
- Frontend i18n.
- Expand `packages/contracts` only as additional backend contracts stabilize.
