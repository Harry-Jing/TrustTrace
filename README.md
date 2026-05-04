# TrustTrace

TrustTrace is an evidence-oriented credibility checking service. Submit a URL or text claim; the system discovers candidate sources, verifies what it can read, and presents source-backed credibility context instead of a binary true/false verdict.

## Why it exists

Many credibility tools overstate certainty or ask an LLM to judge from memory. TrustTrace keeps the product promise narrower:

- show the evidence trail behind a claim,
- separate source discovery from evidence verification,
- make uncertainty visible,
- keep final credibility bands grounded in backend-verified evidence.

## Current status

- `apps/web` — Vue 3 frontend with backend mode by default and explicit mock/demo mode.
- `apps/server` — Hono/Bun API with SQLite persistence, Tavily or OpenAI-backed source discovery, backend URL safety/extraction, deterministic synthesis, and progress SSE.
- `packages/contracts` — shared Zod schemas and inferred DTO types for frontend/backend HTTP and SSE boundaries.
- P1.5 is accepted: create-check requests require `discoveryStrategy` (`search_api` or `llm_web`); every discovered URL still passes through the same backend evidence gate.

## Quick start

```sh
bun install
bun run dev:all
```

Then open the Vite frontend and use the backend API on port `8000`. For fixture-backed demo mode, set `VITE_TRUSTTRACE_API_MODE=mock` in `apps/web/.env`.

Useful commands:

```sh
bun run dev          # frontend only
bun run dev:server   # backend only, port 8000 by default
bun run test         # workspace tests; do not use bare bun test at repo root
bun run check        # full quality gate
```

See [docs/development/commands.md](docs/development/commands.md) for the full command reference.

## Project layout

```txt
apps/web/             Vue 3 frontend package
apps/server/          Hono/Bun backend package
packages/contracts/   Shared Zod API contract package
docs/                 Product, architecture, development, operations, and reference docs
```

## Documentation

Start at [docs/README.md](docs/README.md).

- Product intent: [docs/product/overview.md](docs/product/overview.md)
- Evidence model: [docs/product/evidence-model.md](docs/product/evidence-model.md)
- Architecture: [docs/architecture/README.md](docs/architecture/README.md)
- Local development: [docs/development/setup.md](docs/development/setup.md)
- API reference: [docs/reference/api.md](docs/reference/api.md)
- Contributing: [CONTRIBUTING.md](CONTRIBUTING.md)
