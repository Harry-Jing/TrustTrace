# Evidence Pipeline

The backend pipeline is the source of truth for claim checking. Frontend loading phases are a user-facing grouping over more detailed backend steps.

## Current invariant

Discovery tools are selectable, but evidence is not trusted until the backend verifies it.

- `search_api` uses Tavily candidate URL discovery.
- `llm_web` uses OpenAI web search candidate URL discovery.
- No `auto`, arbitrary provider name, silent fallback, or parallel discovery mode exists in the accepted P1.5 baseline.
- Strategy selection only controls candidate URL discovery. It must not bypass URL safety, extraction, ranking, same-domain dedupe, snippet-only downgrading, persistence, source assessment, or deterministic synthesis.

## Execution order

```txt
input classification
→ input URL extraction when needed
→ claim analysis
→ source strategy
→ query planning
→ source discovery
→ URL safety gate
→ content extraction
→ candidate ranking and clustering
→ source assessment
→ deterministic synthesis
→ optional future critic
→ bounded result copy
```

## Frontend phase mapping

The frontend exposes six active phases plus terminal states.

| Phase           | Backend work                                                                                       |
| --------------- | -------------------------------------------------------------------------------------------------- |
| `understanding` | Classify text/URL/long article, extract submitted URL content when needed, parse checkable claims. |
| `strategy`      | Choose source standards and plan neutral, authoritative, original, opposing, and tracing queries.  |
| `discovery`     | Use selected discovery provider to produce candidate URLs with provenance.                         |
| `verify_read`   | Run URL safety, fetch/extract content, downgrade snippet-only rows, rank and same-domain dedupe.   |
| `weigh`         | Assess each verified source against the claim: relation, directness, scope, primary/independent.   |
| `verdict`       | Compute deterministic band and generate bounded display copy from the verified evidence matrix.    |
| `completed`     | Terminal success.                                                                                  |
| `failed`        | Terminal pipeline or provider failure.                                                             |

## Input handling

- Text inputs are trimmed and must contain at least three characters.
- URL inputs must be absolute `http(s)` URLs.
- A submitted URL is the object being checked. It may be fetched to understand the claim, but it is not evidence unless rediscovered and verified through the normal source flow.

## Discovery

Source discovery must cover supporting, contradicting, and background sources. Each candidate records strategy/provider provenance so later evaluation can measure recall, extractability, snippet-only ratio, failure rate, cost, and latency.

## URL safety and extraction

Before a candidate becomes evidence, the backend gate should:

- allow only `http` and `https`,
- reject local/private network targets,
- validate DNS-resolved IPs,
- re-check redirects with a redirect limit,
- apply timeout and size limits,
- record resolved URL, status, timestamp, content hash, and extraction method.

Extraction preference:

1. direct fetch plus readable full text,
2. provider extraction,
3. snippet-only fallback.

Snippet-only rows are weak context and cannot independently produce `evidence_strong`.

## Ranking, clustering, and assessment

Ranking weighs relevance, authority, primary-source status, independence, freshness, scope match, and contradicting evidence. MVP independence uses simple same-domain dedupe: ten articles citing one original report should not count as ten independent sources.

Source assessment is LLM-assisted but bounded: it receives the claim, source metadata, and extracted passages; it does not search again. It classifies relation, directness, scope match, and source role. Extracted text may contain prompt-injection content, so source text must be isolated and outputs validated.

## Synthesis and copy

Backend rules compute the final band. System failure is distinct from evidence insufficiency: provider timeouts, blocked URLs, or extraction failures should not be shown as "thin evidence".

After the band is fixed, LLM copy can write user-facing title, description, cues, uncertainty lines, and summary text. It must not add sources, introduce facts outside the evidence matrix, hide uncertainty, convert the result into true/false, or inflate confidence.
