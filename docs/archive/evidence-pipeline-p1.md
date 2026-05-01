# Archive: Evidence Pipeline P1/P1.5

Historical context from the original MVP evidence-pipeline plan. Current pipeline truth lives in [../architecture/evidence-pipeline.md](../architecture/evidence-pipeline.md).

## P1.0 — Core verified evidence pipeline

The first backend version aimed to run the simplest reliable flow:

- process one main claim;
- use a main provider with basic authority weighting;
- apply backend URL safety;
- extract content and downgrade snippet-only sources;
- sort candidates and dedupe by domain;
- evaluate about six verified sources per check;
- compute a rule-based band;
- use LLM copy only after synthesis;
- persist raw input, source metadata, passages, provider records, and evaluations;
- avoid caching and keep weights hard-coded.

Completion meant the system could process text or URL input end to end, evidence was real and accessible, output was non-binary, snippet-only could not produce strong evidence, and the frontend no longer relied on demo data.

## Implemented P1.0/P1.5 baseline

- OpenAI remains the claim-analysis, source-assessment, and result-copy provider.
- Discovery is split into `SourceDiscoveryProvider` implementations.
- Text input is parsed into a main claim and query plan.
- URL input is safety-checked and extracted as the checked object, not automatic supporting evidence.
- Candidate URLs go through canonical dedupe, backend safety validation, content extraction, authority weighting, and same-domain dedupe.
- Snippet-only sources may enter as weak context only after URL safety passes.
- Claim analysis, input extraction, provider calls, source extractions, and source evaluations are persisted.
- Final band is computed by deterministic synthesis; OpenAI writes display copy only from the verified evidence matrix, with backend-copy fallback on failure.
- The frontend still validates backend payloads and renders only absolute `http(s)` evidence links.

## P1.5 — User-selectable discovery strategy

Accepted behavior:

- `POST /v1/checks` requires explicit `discoveryStrategy`.
- `search_api` uses Tavily search discovery.
- `llm_web` uses OpenAI web search discovery.
- No `auto` or `parallel` strategy exists.
- The selected strategy controls candidate URL discovery only.
- All discovered URLs still use the same URL safety, extraction, snippet-only downgrade, ranking, same-domain dedupe, source assessment, and deterministic synthesis.
- Candidate sources record strategy/provider provenance.

## Original MVP non-goals

P1.0 did not include:

- automatic true/false labels,
- a large authority registry,
- always-on critic,
- multi-agent debate,
- distributed crawler,
- account/team sharing,
- treating snippets as strong evidence.
