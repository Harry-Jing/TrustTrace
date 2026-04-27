# TrustTrace

Evidence-oriented credibility checking service. Submit a URL or text, the system gathers evidence from web discovery providers, and presents cues, uncertainty, and source context instead of a binary true/false verdict.

## Status

- **Current:** `apps/web` — Vue 3 frontend with mock/backend modes.
- **Current:** `apps/server` — Hono backend with SQLite persistence, OpenAI-backed source discovery, backend URL safety/extraction, and progress SSE.
- **Current:** `packages/contracts` — shared Zod schemas and inferred DTO types for TrustTrace API boundaries.
- **Planned P1.5:** user-selectable source discovery strategy: dedicated search API or LLM web search; all discovered URLs still pass through the same backend evidence gate.

## Commands

Bun is used for dependency installation and script orchestration; the frontend remains Vue/Vite/Vitest.

```sh
bun install          # install workspace dependencies
bun run dev          # start the frontend dev server
bun run dev:server   # start the backend API server on port 8000
bun run format       # format files
bun run lint         # lint checks
bun run typecheck    # type checks
bun run test         # run tests
bun run build        # type-check and build
bun run check        # full quality gate: format:check → lint → test → build
```

## Project Structure

```txt
apps/web/            # @trusttrace/web — Vue 3 frontend
apps/server/         # @trusttrace/server — Hono backend slice
packages/contracts/  # @trusttrace/contracts — shared API Zod schemas + DTO types
docs/                # Project documentation
```

## Documentation

See [docs/](docs/) for conventions, architecture, and roadmap.
