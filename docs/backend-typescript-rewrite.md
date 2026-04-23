# TrustTrace — Planned TypeScript Rewrite Architecture

> **Status: Planned.** Created 2026-04-20. This document describes the target TypeScript backend/shared-package architecture. The current implementation is the Vue frontend in `apps/web`; `apps/server` and `packages/shared` are not current implementation directories yet. Previous backend design is archived in [python-backend.md](archive/python-backend.md).

## Planned Tech Stack

| Layer | Choice |
|-------|--------|
| Runtime & package manager | Bun |
| HTTP framework | Hono |
| Validation & shared types | Zod |
| ORM | Drizzle |
| Database | SQLite (dev) / PostgreSQL (prod) |
| Config | @t3-oss/env-core |
| Logging | pino |
| LLM SDKs | openai, @google/genai |
| Testing | Vitest |
| OpenAPI | @hono/zod-openapi |
| Frontend | Vue 3 + Vite + Tailwind CSS |
| Frontend quality | vue-tsc, Oxlint, ESLint, Prettier |

## Target Monorepo Structure

```
TrustTrace/                    # Target structure; some entries are planned
├── apps/
│   ├── server/                      # Planned: @trusttrace/server — Hono backend
│   │   └── src/
│   │       ├── index.ts             # Hono app + server entry
│   │       ├── db/
│   │       │   ├── schema.ts        # Drizzle table definitions
│   │       │   ├── client.ts        # DB connection
│   │       │   ├── migrate.ts       # Drizzle Kit migrations
│   │       │   └── repository.ts    # Data access layer
│   │       ├── lib/
│   │       │   ├── env.ts           # @t3-oss/env-core typed config
│   │       │   ├── logger.ts        # pino instance + child loggers
│   │       │   ├── errors.ts        # AppError hierarchy + global handler
│   │       │   └── constants.ts     # Shared constants
│   │       ├── middleware/
│   │       │   ├── trace-id.ts      # X-Trace-Id injection
│   │       │   └── request-logger.ts
│   │       ├── routes/
│   │       │   ├── checks.ts        # /v1/checks REST + SSE
│   │       │   └── health.ts        # /health
│   │       └── services/
│   │           ├── check-execution.ts
│   │           ├── synthesis.ts
│   │           ├── provider-registry.ts
│   │           └── providers/
│   │               ├── base.ts      # Abstract adapter
│   │               ├── openai.ts    # OpenAI Responses API adapter
│   │               ├── gemini.ts    # Gemini grounding adapter
│   │               └── common.ts    # Shared prompts, URL matching, evidence validation
│   │
│   └── web/                         # Current: @trusttrace/web — Vue 3 frontend
│       └── src/
│
├── packages/
│   └── shared/                      # Planned: @trusttrace/shared — Zod schemas + types
│       └── src/
│           ├── index.ts             # Public API barrel
│           ├── enums.ts             # InputType, CheckStatus, SignalBand, etc.
│           └── schemas/
│               ├── checks.ts        # CheckInput, CheckResult, EvidenceItem, etc.
│               ├── progress.ts      # ProgressPhase, CheckProgress, ProgressEvent
│               ├── errors.ts        # ErrorCode, ErrorDetail, ErrorResponse
│               └── providers.ts     # ProviderAnalyzeRequest/Result
│
├── archive/                         # Previous Python backend + frontend
├── docs/
├── package.json                     # Bun workspaces: ["apps/*", "packages/*"]
├── tsconfig.base.json
└── .gitignore
```

## Planned Design Decisions

1. **Shared package** — Zod schemas in `@trusttrace/shared` are the single source of truth. Both frontend and backend import types from here. No type drift.

2. **API compatibility** — New backend exposes the exact same REST + SSE endpoints. JSON fields stay `snake_case`. Frontend should need zero changes.

3. **Provider adapter pattern** — Abstract `BaseWebSearchAdapter` with `OpenAI` and `Gemini` implementations under `services/providers/`, same as before.

4. **Background tasks** — Fire-and-forget Promises (equivalent to Python's `asyncio.create_task`).

5. **Error hierarchy** — Same `AppError` → `ProviderError` → `ProviderTimeoutError` etc. structure in `lib/errors.ts`, with a global `app.onError()` handler.

6. **Config** — `@t3-oss/env-core` + `.env` in `lib/env.ts` replaces pydantic-settings + TOML. All config via environment variables, validated with Zod at startup.

7. **Logging** — pino in `lib/logger.ts` with `child()` loggers per request, replacing Loguru + contextvars.

## Python → TypeScript Mapping

| Python | TypeScript |
|--------|-----------|
| Pydantic BaseModel | Zod schema + `z.infer<>` |
| pydantic-settings + TOML | @t3-oss/env-core + .env |
| SQLAlchemy models | Drizzle table definitions |
| FastAPI Depends() | Hono middleware `c.set()`/`c.get()` |
| asyncio.create_task | Fire-and-forget Promise |
| contextvars | pino child() |
| StreamingResponse | Hono streamSSE() |
| @lru_cache singletons | Module-level const |

## Planned Implementation Order

Each planned phase should be independently verifiable before moving on. Tests should be written alongside each phase, not at the end.

| Phase | Scope | Verification |
|-------|-------|-------------|
| 1 | Root workspace + `packages/shared` (enums, Zod schemas) | `bun install` passes, shared package importable |
| 2 | Frontend `apps/web/`, import types from `@trusttrace/shared` | Runs in browser, types come from shared |
| 3 | Server skeleton: `index.ts`, `lib/` (env, logger, errors, constants), `middleware/`, `routes/health.ts` | `curl localhost:8000/health` returns 200 |
| 4 | DB: schema, client, migrate, repository + tests | `drizzle-kit push` creates tables, drizzle studio shows schema |
| 5 | Synthesis service (pure logic, no external deps) + unit tests | `bun test` passes |
| 6 | Provider adapters (common, base, openai, gemini) + integration tests | Real API call returns structured evidence |
| 7 | Full pipeline: provider-registry, check-execution, `routes/checks.ts` (POST + GET) | `curl POST /v1/checks` runs end-to-end, GET returns result |
| 8 | SSE streaming: `GET /v1/checks/:id/events` | Browser EventSource receives real-time progress |

Frontend development (Phase 2) can proceed in parallel with backend phases 3-8. During frontend development, mock the backend using either the archived Python backend or MSW (Mock Service Worker).
