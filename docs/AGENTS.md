# TrustTrace

Evidence-oriented credibility checking service. Submit a URL or text, query LLM providers with web search grounding, collect structured evidence, synthesize results, and present non-binary credibility context.

## Repository Status

- **Current:** `apps/web` is the active Vue 3 frontend, running with static/demo data.
- **Planned:** `apps/server` for the TypeScript backend.

## Tech Stack

Current frontend: Vue 3, TypeScript, Vite, Tailwind CSS v4, Vue Router, Pinia, vue-tsc, Oxlint, ESLint, Prettier, Vitest.

For the current frontend, Bun is used for dependency installation and script orchestration only; dev/build/test remain Vite/Vitest/vue-tsc workflows.

Planned backend: Bun, Hono, Zod, Drizzle, SQLite, pino, OpenAI and Gemini provider SDKs.

## Commands

```sh
bun install          # install workspace dependencies
bun run dev          # start the frontend dev server
bun run format       # format files
bun run lint         # lint checks
bun run typecheck    # type checks
bun run test         # run tests
bun run build        # type-check and build
bun run check        # full quality gate: format:check → lint → test → build
```

Use `bun run test`, not bare `bun test` — frontend tests run through Vitest/Vite for Vue SFC transforms, path aliases, jsdom, and Vitest mocking APIs.

## Project Structure

```txt
apps/web/            # Current: @trusttrace/web — Vue 3 frontend
apps/server/         # Planned: @trusttrace/server — Hono backend
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
