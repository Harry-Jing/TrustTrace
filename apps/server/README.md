# TrustTrace Server

`@trusttrace/server` is the Hono/Bun backend for TrustTrace. It owns persistence, source discovery selection, URL safety/extraction, evidence assessment, deterministic synthesis, and progress SSE.

## Run

```sh
bun run dev      # watch mode
bun run start    # no watch
bun run lint
bun run typecheck
bun run test
bun run test:watch
bun run build
```

From the repository root, use `bun run dev:server`, `bun run test:server`, or `bun run check`.

## Defaults

- Port: `8000`.
- Health: `GET /v1/health`.
- SQLite path: `apps/server/data/trusttrace.sqlite`.
- Frontend dev proxy: `/v1` → `http://127.0.0.1:8000`.

## Environment

See `.env.example`.

| Variable                             | Meaning                  |
| ------------------------------------ | ------------------------ |
| `TRUSTTRACE_PORT`                    | API port.                |
| `TRUSTTRACE_DB_PATH`                 | SQLite path override.    |
| `TRUSTTRACE_LOG_LEVEL`               | pino log level.          |
| `OPENAI_API_KEY`                     | OpenAI provider key.     |
| `TRUSTTRACE_OPENAI_MODEL`            | OpenAI model.            |
| `TRUSTTRACE_OPENAI_REASONING_EFFORT` | OpenAI reasoning effort. |
| `TAVILY_API_KEY`                     | Tavily discovery key.    |
| `TRUSTTRACE_MAX_CANDIDATE_SOURCES`   | Candidate source cap.    |
| `TRUSTTRACE_MAX_EVIDENCE_SOURCES`    | Evidence source cap.     |

The server can start without provider keys. Checks requiring a missing provider fail with a provider configuration error instead of placeholder evidence.

## Provider behavior

- `search_api` uses Tavily source discovery.
- `llm_web` uses OpenAI web search discovery.
- OpenAI also handles claim analysis, source assessment, and result copy.
- All discovered URLs still pass through backend URL safety, extraction, ranking, source assessment, and deterministic synthesis.

## API

Current endpoints:

- `GET /v1/health`
- `POST /v1/checks`
- `GET /v1/checks`
- `GET /v1/checks/:checkId`
- `GET /v1/checks/:checkId/events`

See [API reference](../../docs/reference/api.md).

## Related docs

- [Backend architecture](../../docs/architecture/backend.md)
- [Evidence pipeline](../../docs/architecture/evidence-pipeline.md)
- [Configuration](../../docs/operations/configuration.md)
