# API Reference

The backend serves JSON over `/v1` plus one SSE endpoint. Shared schemas and DTOs live in `packages/contracts/src/checks.ts`.

## Health

```http
GET /v1/health
```

Response:

```json
{ "status": "ok" }
```

## Create check

```http
POST /v1/checks
Content-Type: application/json
```

Request:

```json
{
  "input": { "type": "text", "content": "Seat belts reduce crash deaths" },
  "discoveryStrategy": "search_api"
}
```

Rules:

- `input.type` is `text` or `url`.
- Text content is trimmed and must be 3–10,000 characters.
- URL content must be an absolute `http(s)` URL.
- `discoveryStrategy` is required and must be `search_api` or `llm_web`.

Success response: `201 CreateCheckResponseDto` with `checkId`, `status`, `discoveryStrategy`, initial `progress`, `eventsUrl`, and `createdAt`.

Validation failure: `400 { code: "INVALID_CHECK_INPUT", message }`.

## Get check

```http
GET /v1/checks/:checkId
```

Success response: `CheckRecordDto`.

Not found: `404 { code: "CHECK_NOT_FOUND", message: "Check not found." }`.

## List checks

```http
GET /v1/checks?limit=20&offset=0
```

Query:

- `limit`: integer 1–50, default `20`.
- `offset`: integer `>= 0`, default `0`.

Success response: `CheckListResponseDto`.

Invalid query: `400 { code: "INVALID_LIST_QUERY", message }`.

## Progress stream

```http
GET /v1/checks/:checkId/events?afterSeq=0
Accept: text/event-stream
```

Query:

- `afterSeq`: integer `>= 0`, default `0`; server replays events after this sequence.

The stream emits `progress` events:

```txt
event: progress
data: { ...ProgressEventDto }
```

The server also sends `: keep-alive` comment lines. Streams close after `completed` or `failed` status.

Invalid query: `400 { code: "INVALID_EVENTS_QUERY", message }`.

## HTTP error model

Transport-level API errors use:

```ts
{
  code: string;
  message: string;
}
```

Known codes:

- `INTERNAL_ERROR`
- `INVALID_CHECK_INPUT`
- `INVALID_LIST_QUERY`
- `INVALID_EVENTS_QUERY`
- `CHECK_NOT_FOUND`

Pipeline failures are persisted on `CheckRecordDto.error` with:

```ts
{
  code: CheckErrorCodeDto;
  category: string;
  message: string;
  retryable: boolean;
  traceId: string | null;
  occurredAt: string;
}
```

Known pipeline codes:

- `INPUT_EXTRACTION_FAILED`
- `SOURCE_DISCOVERY_FAILED`
- `SOURCE_EXTRACTION_FAILED`
- `CLAIM_ANALYSIS_FAILED`
- `PROVIDER_TIMEOUT`
- `PROVIDER_ERROR`
- `PROVIDER_CONFIGURATION_ERROR`
- `PIPELINE_ERROR`

## Main enums

```ts
type CheckStatusDto = "queued" | "running" | "completed" | "failed";
type DiscoveryStrategyDto = "search_api" | "llm_web";
type CheckPhaseDto =
  | "understanding"
  | "strategy"
  | "discovery"
  | "verify_read"
  | "weigh"
  | "verdict"
  | "completed"
  | "failed";
type VerdictBandDto =
  | "evidence_strong"
  | "evidence_mixed"
  | "evidence_weak"
  | "evidence_thin"
  | "needs_context"
  | "system_failed";
```
