# Python Backend Architecture (Archived)

> Archived on 2026-04-20. This document captures the Python backend design as of the last iteration before the planned TypeScript rewrite.

## Overview

The backend is a FastAPI application that performs evidence-oriented credibility checks. Users submit a URL or plain text, the system queries LLM providers with web search grounding, collects structured evidence, synthesizes a result, and returns it via REST + SSE.

## Tech Stack

| Component | Choice |
|-----------|--------|
| Runtime | Python 3.14 |
| Framework | FastAPI + uvicorn |
| Validation | Pydantic v2 |
| ORM | SQLAlchemy 2.0 (async) |
| Database | PostgreSQL (prod via asyncpg) / SQLite (dev via aiosqlite) |
| Config | pydantic-settings + TOML (`config.toml`) + `.env` |
| Logging | Loguru with structured JSON + pretty console |
| LLM SDKs | openai, google-genai |
| HTTP client | httpx (async) |
| Testing | pytest + pytest-asyncio |
| Package manager | uv |

## Directory Structure

```
backend/
├── app/
│   ├── main.py                          # FastAPI app, lifespan, middleware
│   ├── dependencies.py                  # Singleton factories (lru_cache)
│   ├── core/
│   │   ├── config.py                    # Settings (pydantic-settings + TOML)
│   │   ├── exceptions.py               # AppError hierarchy
│   │   ├── error_handlers.py           # Global FastAPI exception handlers
│   │   ├── logging.py                  # Loguru config + context vars
│   │   └── time.py                     # UTC helpers
│   ├── schemas/
│   │   ├── common.py                   # Enums: InputType, CheckStatus, SignalBand, etc.
│   │   ├── checks.py                   # CheckRequest, CheckResult, EvidenceItem, etc.
│   │   ├── providers.py               # ProviderAnalyzeRequest/Result, CueCandidate
│   │   ├── progress.py                # ProgressPhase, ProgressUpdate, ProgressEmitter
│   │   └── errors.py                  # ErrorCode, ErrorCategory, ErrorDetail
│   ├── db/
│   │   ├── base.py                    # SQLAlchemy declarative Base
│   │   ├── models.py                  # Check, CheckEvidence, ProviderTrace, CheckError, CheckProgressEvent
│   │   ├── session.py                 # Engine + async session factory
│   │   ├── repository.py             # Data access functions
│   │   └── init_db.py                # Table creation on startup
│   ├── api/
│   │   ├── checks.py                 # POST /v1/checks, GET /v1/checks/:id, GET /v1/checks/:id/events (SSE)
│   │   └── health.py                 # GET /health
│   ├── services/
│   │   ├── check_execution.py        # Single-provider execution pipeline
│   │   ├── synthesis.py              # Evidence synthesis, signal band derivation
│   │   ├── primary_runner.py         # Background task runner (asyncio.create_task)
│   │   ├── provider_registry.py      # Provider lookup + config validation
│   │   ├── orchestrator.py           # Backward-compat alias for check_execution
│   │   └── adapters/
│   │       ├── base.py               # BaseWebSearchAdapter (abstract)
│   │       ├── _common.py            # Shared: prompts, URL matching, evidence validation
│   │       ├── openai_adapter.py     # OpenAI Responses API + web_search tool
│   │       └── gemini_adapter.py     # Gemini Developer API + google_search grounding
│   └── workers/
│       └── __init__.py               # (Reserved for future background workers)
├── tests/
│   ├── conftest.py
│   ├── test_checks_api.py
│   ├── test_config.py
│   ├── test_logging.py
│   ├── test_openai_adapter.py
│   ├── test_gemini_adapter.py
│   ├── test_primary_runner.py
│   └── test_provider_registry.py
├── .env.example
├── .gitignore
├── config.toml
├── pyproject.toml
├── pyrightconfig.json
├── README.md
└── uv.lock
```

**Source**: ~4,700 lines across 36 Python files. **Tests**: ~2,100 lines across 8 files.

## Database Schema

Five tables with foreign key relationships:

```
checks
├── check_evidence       (check_id FK, CASCADE)
├── provider_traces      (check_id FK, CASCADE)
├── check_errors         (check_id FK, CASCADE)
└── check_progress_events (check_id FK, CASCADE)
```

### checks

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK, auto-generated |
| session_id | VARCHAR(128) | Nullable, client correlation |
| input_type | ENUM(url, text) | |
| input_content | TEXT | |
| status | ENUM(queued, running, completed, failed) | Default: running |
| signal_band | ENUM(evidence_strong, evidence_mixed, evidence_weak, evidence_insufficient) | Nullable |
| uncertainty_level | ENUM(low, medium, high) | Nullable |
| result_json | JSON | Full CheckResult on completion |
| progress_json | JSON | Latest progress snapshot |
| completed_at | DATETIME | Nullable |
| created_at | DATETIME | |
| updated_at | DATETIME | |

### check_evidence

| Column | Type |
|--------|------|
| id | INTEGER PK |
| check_id | UUID FK |
| provider | VARCHAR(32) |
| stance | ENUM(supports, contradicts, contextual) |
| url | TEXT |
| domain | VARCHAR(255) |
| title | TEXT |
| snippet | TEXT |
| publisher | VARCHAR(255) |
| published_at | VARCHAR(64) |

### provider_traces

| Column | Type |
|--------|------|
| id | INTEGER PK |
| check_id | UUID FK |
| provider | VARCHAR(32) |
| request_id | VARCHAR(128) |
| latency_ms | INTEGER |
| success | BOOLEAN |
| error_code | VARCHAR(64) |
| meta_json | JSON |
| created_at | DATETIME |

### check_errors

| Column | Type |
|--------|------|
| id | INTEGER PK |
| check_id | UUID FK |
| code | VARCHAR(64) |
| category | VARCHAR(64) |
| message | TEXT |
| retryable | BOOLEAN |
| stage | VARCHAR(64) |
| provider | VARCHAR(32) |
| provider_error_code | VARCHAR(64) |
| trace_id | VARCHAR(64) |
| request_id | VARCHAR(128) |
| context_json | JSON |
| created_at | DATETIME |

### check_progress_events

| Column | Type |
|--------|------|
| id | INTEGER PK |
| check_id | UUID FK |
| status | ENUM(CheckStatus) |
| phase | ENUM(ProgressPhase) |
| percent | INTEGER |
| message | TEXT |
| provider | VARCHAR(32) |
| step_code | VARCHAR(128) |
| error_json | JSON |
| meta_json | JSON |
| created_at | DATETIME |

### Single-Column Indexes

- `check_evidence.check_id` (index=True)
- `check_evidence.provider` (index=True)
- `provider_traces.check_id` (index=True)
- `check_errors.check_id` (index=True)
- `check_progress_events.check_id` (index=True)

### Composite Indexes

- `ix_checks_status_created_at` (checks.status, checks.created_at)
- `ix_check_progress_events_check_id_id` (check_progress_events.check_id, check_progress_events.id)
- `ix_check_errors_check_id_created_at` (check_errors.check_id, check_errors.created_at)
- `ix_check_errors_code_created_at` (check_errors.code, check_errors.created_at)
- `ix_check_errors_provider_created_at` (check_errors.provider, check_errors.created_at)

## API Endpoints

### POST /v1/checks

Create a new credibility check. Returns 202 with initial progress. Background task starts immediately.

```json
// Request
{
  "input": { "type": "url" | "text", "content": "..." },
  "session_id": "optional-client-id"
}

// Response 202
{
  "check_id": "uuid",
  "status": "running",
  "progress": { "phase": "accepted", "percent": 5, "message": "...", "event_seq": 1, "updated_at": "..." },
  "events_url": "/v1/checks/{id}/events",
  "created_at": "..."
}
```

### GET /v1/checks/{check_id}

Retrieve check status and result.

```json
// Response 200
{
  "check_id": "uuid",
  "status": "completed",
  "progress": { ... },
  "result": {
    "summary_card": { "headline": "...", "signal_band": "evidence_mixed", "key_points": ["..."] },
    "credibility_cues": [{ "cue_type": "source_context", "observation": "...", "why_it_matters": "..." }],
    "evidence_items": [{ "stance": "supports", "title": "...", "url": "...", "publisher": "...", "snippet": "..." }],
    "uncertainty": { "level": "medium", "reasons": ["..."] },
    "plausibility_vs_evidence": { "sounds_plausible_but": "...", "evidence_gap": "..." },
    "reflection_prompt": { "question": "...", "rationale": "..." },
    "decision_options": [{ "id": "share", "label": "Share", "kind": "local_only" }]
  },
  "error": null,
  "created_at": "...",
  "updated_at": "...",
  "completed_at": "..."
}
```

### GET /v1/checks/{check_id}/events

SSE stream of progress events. Supports `?after_seq=N` for resumption.

```
id: 1
event: progress
data: {"seq":1,"check_id":"...","status":"running","phase":"accepted","percent":5,"message":"..."}

id: 2
event: progress
data: {"seq":2,"check_id":"...","status":"running","phase":"analyzing","percent":20,"message":"openai analysis started","provider":"openai","step_code":"openai.start","error":null,"created_at":"..."}

...
```

Full `ProgressEvent` fields: `seq`, `check_id`, `status`, `phase`, `percent`, `message`, `provider` (nullable), `step_code` (nullable), `error` (nullable), `created_at`.

Keepalive `:keepalive\n\n` every 10 seconds. Stream closes on `completed` or `failed` phase.

## Error Handling

Hierarchical exception classes, all extending `AppError`:

```
AppError
├── ValidationError          (400)
├── NotFoundError            (404)
├── ConfigurationError       (500)
├── ProviderError            (502)
│   ├── ProviderTimeoutError    (504, retryable)
│   ├── ProviderRateLimitError  (503, retryable)
│   ├── ProviderAuthError       (502)
│   ├── ProviderBadResponseError (502)
│   └── ProviderUnknownError    (502)
├── OrchestrationError       (500)
├── PersistenceError         (500, retryable)
└── InternalError            (500)
```

All errors serialize to a consistent `ErrorDetail` JSON shape with `code`, `category`, `message`, `retryable`, `stage`, `provider`, `trace_id`, and `occurred_at`.

## Enums

```python
InputType:        url, text
CheckStatus:      queued, running, completed, failed
SignalBand:       evidence_strong, evidence_mixed, evidence_weak, evidence_insufficient
UncertaintyLevel: low, medium, high
CueType:          source_context, authorship, publication_type, recency, cross_source_consistency, claim_specificity
EvidenceStance:   supports, contradicts, contextual
ProgressPhase:    accepted, analyzing, synthesizing, persisting, completed, failed
ErrorCode:        CHECK_NOT_FOUND, CONFIG_INVALID, VALIDATION_FAILED, PROVIDER_TIMEOUT, PROVIDER_RATE_LIMITED, PROVIDER_AUTH_FAILED, PROVIDER_BAD_RESPONSE, PROVIDER_UNKNOWN, ORCHESTRATION_FAILED, PERSISTENCE_FAILED, INTERNAL_ERROR
ErrorCategory:    validation, configuration, not_found, provider, orchestration, persistence, internal
DecisionOptionKind: local_only, local_placeholder
ProviderErrorCode: timeout, rate_limited, bad_response, auth_error, unknown
```

## Execution Flow

1. `POST /v1/checks` creates a DB record and an initial `accepted` progress event
2. `schedule_primary_check()` fires `asyncio.create_task(run_primary_check(check_id))`
3. Background runner loads a detached snapshot, calls `CheckExecutionService.execute()`
4. Execution service calls the configured provider adapter's `analyze()` method
5. Provider adapter (OpenAI/Gemini) sends an LLM request with web search tool, parses structured response, validates evidence URLs against official sources
6. `SynthesisService` derives signal band, uncertainty level, credibility cues, and builds the full `CheckResult`
7. Result and provider traces are persisted; terminal progress event is emitted
8. On failure, error is recorded and check is marked failed with a failed progress event

## Provider Adapter Pattern

Both adapters share:
- `BaseWebSearchAdapter` abstract class with `analyze()` (template method) and abstract `_analyze()`
- Common prompt builder (`build_evidence_collection_prompts`)
- Common evidence URL validation against official provider sources (`build_validated_evidence_items`, `match_official_source`)
- Consistent error mapping to the `ProviderError` hierarchy

### OpenAI Adapter
- Uses `AsyncOpenAI` client with Responses API (`responses.parse`)
- Web search via `{"type": "web_search"}` tool
- Structured output via `text_format` parameter
- Sources extracted from `web_search_call.action.sources` + `url_citation` annotations

### Gemini Adapter
- Uses `google.genai.Client` with `aio.models.generate_content`
- Web search via `GoogleSearch()` tool (grounding)
- Structured output via `response_mime_type: application/json` + `response_schema`
- Sources extracted from `grounding_metadata.grounding_chunks`

## Synthesis Logic

Pure computation, no I/O:
- Deduplicates evidence by (url, stance), caps at 12 items
- Derives `SignalBand` from support/contradict counts
- Derives `UncertaintyLevel` from signal count, source diversity, and provider uncertainty signals
- Builds credibility cues from provider candidates or generates fallback cues
- Produces static `PlausibilityVsEvidence`, `ReflectionPrompt`, and `DecisionOption` blocks

## Configuration

Layered: init values < TOML (`config.toml`) < `.env` file < environment variables.

TOML uses grouped sections (`[app]`, `[logging]`, `[server]`, `[database]`, `[providers]`, `[providers.openai]`, `[providers.gemini]`) which are flattened into the `Settings` model via a custom `TrustTraceTomlConfigSettingsSource`.

## Logging

Loguru-based with:
- `contextvars.ContextVar` for per-request log context (trace_id, check_id, provider, method, path, etc.)
- Pretty console format (dev) or serialized JSON (prod)
- Optional rotating file sink
- stdlib intercept handler for uvicorn/sqlalchemy logs
- Configurable message truncation and SQL noise suppression

## Dependencies (pyproject.toml)

```
aiosqlite, alembic, anthropic*, asyncpg, fastapi, google-genai, greenlet,
httpx, loguru, openai, pydantic, pydantic-settings, sqlalchemy, tenacity, uvicorn
```

\* `anthropic` is declared in dependencies but not actively used — no Anthropic adapter was implemented.

Test extras: `asgi-lifespan, pytest, pytest-asyncio, pytest-cov`
