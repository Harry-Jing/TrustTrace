# TrustTrace Agent Guide

TrustTrace is an evidence-oriented credibility checking service. Users submit a URL or text; the system discovers sources, verifies evidence, synthesizes a non-binary credibility band, and shows source context.

## Agent rules

- Do not modify files unless the user explicitly asks for implementation or edits.
- When using subagents, use the best available model with maximum effort.
- Keep changes small and surgical; avoid broad rewrites that are not required by the task.
- Update the corresponding file under `docs/` when code, workflow, project structure, APIs, conventions, or tech stack changes.
- Consider whether the approach follows current best practices before changing code or docs.

## Current system

- `apps/web` is the active Vue 3 frontend with backend mode by default and explicit mock mode.
- `apps/server` is the Hono/Bun backend with SQLite persistence, selectable Tavily/OpenAI-backed source discovery, backend URL safety/extraction, deterministic synthesis, and progress SSE.
- `packages/contracts` provides shared Zod schemas plus `z.infer` DTO types for frontend/backend HTTP and SSE boundaries.
- Create-check requests require `discoveryStrategy` (`search_api` or `llm_web`); discovery strategy only selects candidate URL discovery and must not bypass the backend evidence gate.
- `/settings` exposes discovery strategy and theme (light/dark/auto), persisted to `localStorage`. Bring-your-own keys, search depth, and reasoning rigor are visible as disabled coming-soon placeholders.

## Tech stack

- Frontend: Vue 3, TypeScript, Vite, Tailwind CSS v4, Vue Router, Pinia, vue-tsc, Oxlint, ESLint, Prettier, Vitest.
- Backend: Bun runtime, Hono, Zod, Drizzle, SQLite, pino, OpenAI SDK, Tavily SDK.
- Contracts: Zod schemas and inferred DTO types for wire payloads only.

## Commands

```sh
bun install
bun run dev
bun run dev:server
bun run dev:all
bun run start:server
bun run format
bun run lint
bun run typecheck
bun run test
bun run build
bun run check
```

Use `bun run test`, not bare `bun test`, from the repo root.

## Documentation map

Start at [docs/README.md](docs/README.md). Key current-truth docs:

- [docs/product/evidence-model.md](docs/product/evidence-model.md)
- [docs/architecture/evidence-pipeline.md](docs/architecture/evidence-pipeline.md)
- [docs/development/conventions.md](docs/development/conventions.md)
- [docs/development/dev-tooling.md](docs/development/dev-tooling.md)
- [docs/reference/api.md](docs/reference/api.md)
