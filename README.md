# TrustTrace

Evidence-oriented credibility checking service. Submit a URL or text, the system gathers evidence from web-grounded LLM providers, and presents cues, uncertainty, and source context instead of a binary true/false verdict.

## Status

- **Current:** `apps/web` — Vue 3 frontend running with demo/static data.
- **Planned:** `apps/server` and `packages/shared` — TypeScript backend and shared Zod schemas.

## Commands

Bun is used for dependency installation and script orchestration; the frontend remains Vue/Vite/Vitest.

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

## Project Structure

```txt
apps/web/            # @trusttrace/web — Vue 3 frontend
apps/server/         # Planned: @trusttrace/server — Hono backend
packages/shared/     # Planned: @trusttrace/shared — Zod schemas + types
docs/                # Project documentation
```

## Documentation

See [docs/](docs/) for conventions, architecture, and roadmap.
