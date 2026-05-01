# TrustTrace

Evidence-oriented credibility checking service. Submit a URL or text, query web discovery providers, collect structured evidence, synthesize results, and present non-binary credibility context.

## Repository Status

- **Current:** `apps/web` is the active Vue 3 frontend with mock/backend modes.
- **Current:** `apps/server` is the Hono backend with SQLite persistence, selectable Tavily/OpenAI-backed source discovery, backend URL safety/extraction, and progress SSE.
- **Current:** `packages/contracts` provides shared Zod schemas and inferred DTO types for frontend/backend API boundaries.
- **Current P1.5 accepted:** create-check requests require `discoveryStrategy` (`search_api` or `llm_web`); all discovered URLs still pass through the same backend evidence gate.
- **Current frontend settings:** `/settings` exposes discovery strategy and theme (light/dark/auto), persisted to `localStorage`. Bring-your-own keys, search depth, and reasoning rigor are visible as disabled "coming soon" placeholders.

## Tech Stack

Current frontend: Vue 3, TypeScript, Vite, Tailwind CSS v4, Vue Router, Pinia, vue-tsc, Oxlint, ESLint, Prettier, Vitest.

For the current frontend, Bun is used for dependency installation and script orchestration only; dev/build/test remain Vite/Vitest/vue-tsc workflows.

Current backend: Bun runtime, Hono, Zod, Drizzle, SQLite, pino, the OpenAI SDK, and the Tavily SDK. Planned later provider integration: Gemini provider SDK.

Current contracts package: Zod schemas plus `z.infer` DTO types for HTTP/SSE wire payloads only, with typed ESLint and TypeScript checks.

## Commands

```sh
bun install          # install workspace dependencies
bun run dev          # start the frontend dev server
bun run dev:server   # start the backend API server on port 8000
bun run dev:all      # start frontend and backend dev servers together
bun run start:server # start the backend API server without watch mode
bun run format       # format files
bun run lint         # lint checks
bun run typecheck    # type checks
bun run test         # run tests
bun run build        # type-check and build
bun run check        # full quality gate: format:check → lint → typecheck → test → build
```

Use `bun run test`, not bare `bun test` from the repo root. Contracts and backend tests run through Bun workspace scripts; frontend tests run through Vitest/Vite.

## Project Structure

```txt
apps/web/            # Current: @trusttrace/web — Vue 3 frontend
apps/server/         # Current: @trusttrace/server — Hono backend slice
packages/contracts/  # Current: @trusttrace/contracts — shared API Zod schemas + DTO types
docs/                # Project documentation
```

## Workflow

- When code, workflow, project structure, APIs, conventions, or tech stack changes, update the corresponding file under `docs/` in the same change.
- If the user explicitly asks for analysis or an opinion before changes, do not modify files until asked to proceed.
- For every task, consider whether the approach aligns with current best practices.
- Read and follow the `karpathy-guidelines` skill when writing, reviewing, or refactoring code.

## Documentation

- [conventions.md](conventions.md) — Bun package/scripts policy, frontend quality tooling, CSS architecture
- [dev-tooling.md](dev-tooling.md) — dev-only FAB navigation, loading phase controls, guard pattern
- [roadmap.md](roadmap.md) — frontend readiness priorities and backlog
- [claim-checking-pipeline.md](claim-checking-pipeline.md) — backend claim-checking pipeline design
