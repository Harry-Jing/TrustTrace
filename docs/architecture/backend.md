# Backend Architecture

`apps/server` is the TrustTrace API service. It runs on Bun with Hono, Zod, Drizzle, SQLite, pino, the OpenAI SDK, and the Tavily SDK.

## HTTP surface

Routes are intentionally thin: parse/validate requests, delegate to repositories or the pipeline, and return DTOs.

- `GET /v1/health`
- `POST /v1/checks`
- `GET /v1/checks`
- `GET /v1/checks/:checkId`
- `GET /v1/checks/:checkId/events`

See [../reference/api.md](../reference/api.md) for request and response details.

## Runtime and configuration

- Default port: `8000`.
- Default SQLite path: `apps/server/data/trusttrace.sqlite`.
- `TRUSTTRACE_DB_PATH` may override the database path.
- `TRUSTTRACE_LOG_LEVEL` accepts `trace`, `debug`, `info`, `warn`, `error`, `fatal`, or `silent`.
- The server starts without `OPENAI_API_KEY` or `TAVILY_API_KEY`; checks requiring a missing provider fail with provider configuration errors instead of fabricated evidence.

## Module layout

```txt
src/app.ts                 Hono route definitions and SSE stream
src/config.ts              Environment parsing and defaults
src/services.ts            Service composition and provider wiring
src/database/              SQLite open/init/migration helpers
src/schema/                Drizzle table definitions
src/repositories/          Persistence facade and mappers
src/pipeline/              Evidence pipeline orchestration and steps
src/evidenceProvider/      Claim analysis, assessment, and result-copy provider code
src/sourceDiscovery/       Tavily and OpenAI candidate URL discovery providers
src/sourceSafety/          URL safety, fetch, body, and text extraction helpers
src/sources/               Ranking helpers
src/synthesis/             Band rules and result construction
src/types/                 Backend DTO and domain type groups
```

## Persistence

SQLite stores check records, progress events, claim analysis, input extraction, provider calls, source extraction records, and source evaluations. Migrations/schema changes should stay small and explicit.

## Provider split

- `EvidenceProvider` handles claim analysis, source assessment, and result copy.
- `SourceDiscoveryProvider` handles candidate URL discovery selected by `discoveryStrategy`.

This split ensures user strategy selection cannot skip the evidence gate.

## Import conventions

Do not add root-level compatibility barrels for backend internals. Import the concrete module that owns the symbol, for example `database/openDatabase`, `repositories/repositoryFacade`, `repositories/mappers/progressMapper`, `schema/checks`, `sourceSafety/fetchSource`, `sources/ranking`, or `synthesis/buildEvidenceResult`.

Directory-local files such as `pipeline/types.ts` or `evidenceProvider/types.ts` are allowed when they define that module's own contract rather than re-exporting old entry points.

## Testing and checks

Backend tests may use Bun test inside `apps/server`, but normal workflow should call root or workspace scripts:

```sh
bun run test:server
bun run typecheck:server
bun run lint:server
```

Run `bun run check` for the full repository gate.
