# Configuration

## Frontend environment

Template: [../../apps/web/.env.example](../../apps/web/.env.example)

| Variable                       | Default | Meaning                                     |
| ------------------------------ | ------- | ------------------------------------------- |
| `VITE_TRUSTTRACE_API_MODE`     | backend | `backend` or `mock`; selects checks client. |
| `VITE_TRUSTTRACE_API_BASE_URL` | `/v1`   | Backend API base URL for the frontend.      |

Local Vite development proxies `/v1` to `http://127.0.0.1:8000`.

## Backend environment

Template: [../../apps/server/.env.example](../../apps/server/.env.example)

| Variable                             | Default                              | Meaning                                                            |
| ------------------------------------ | ------------------------------------ | ------------------------------------------------------------------ |
| `TRUSTTRACE_PORT`                    | `8000`                               | API server port.                                                   |
| `TRUSTTRACE_DB_PATH`                 | `apps/server/data/trusttrace.sqlite` | SQLite database path.                                              |
| `TRUSTTRACE_LOG_LEVEL`               | `info`                               | pino log level.                                                    |
| `OPENAI_API_KEY`                     | blank                                | OpenAI claim analysis, LLM web discovery, source assessment, copy. |
| `TRUSTTRACE_OPENAI_MODEL`            | `gpt-5.5`                            | OpenAI model used by backend providers.                            |
| `TRUSTTRACE_OPENAI_REASONING_EFFORT` | `low`                                | OpenAI reasoning effort.                                           |
| `TAVILY_API_KEY`                     | blank                                | Tavily `search_api` discovery.                                     |
| `TRUSTTRACE_MAX_CANDIDATE_SOURCES`   | `10`                                 | Candidate source cap, max `25`.                                    |
| `TRUSTTRACE_MAX_EVIDENCE_SOURCES`    | `6`                                  | Evidence source cap, max `10`.                                     |

`TRUSTTRACE_LOG_LEVEL` accepts `trace`, `debug`, `info`, `warn`, `error`, `fatal`, or `silent`.

## Provider behavior

The server can boot without provider keys. A check that needs a missing provider should fail with `PROVIDER_CONFIGURATION_ERROR` instead of returning placeholder evidence.

Discovery strategy mapping:

- `search_api` → Tavily candidate source discovery, requires `TAVILY_API_KEY` for live checks.
- `llm_web` → OpenAI web search candidate source discovery, requires `OPENAI_API_KEY` for live checks.

OpenAI is also used for claim analysis, source assessment, and result copy when live pipeline work reaches those steps.

## SQLite

Default local database files live under `apps/server/data/` and are ignored by Git. Leave `TRUSTTRACE_DB_PATH` blank for the default or set a custom path. When running commands through `bun run --cwd apps/server ...`, relative DB paths resolve from `apps/server`.

## Secrets

Do not commit `.env` files, provider keys, credentials, or local databases. Keep deployment-specific secret injection outside the repository.
