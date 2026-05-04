# Roadmap

TrustTrace has completed the P1/P1.5 backend integration path. Current roadmap items should improve evidence quality, coverage, evaluation, and operational reliability.

## Current baseline

Done:

- Vue frontend supports backend mode by default and explicit mock mode.
- `/settings` persists theme and discovery strategy preferences.
- `POST /v1/checks` requires `discoveryStrategy`.
- `search_api` uses Tavily discovery; `llm_web` uses OpenAI web search discovery.
- All discovered URLs pass through backend URL safety, extraction, ranking, source assessment, persistence, deterministic synthesis, and frontend contract validation.
- Backend exposes `/v1/health`, check creation, check retrieval, check listing, and progress SSE.

Do not reopen P1.5 by adding `auto` or `parallel` discovery modes unless a future ADR explicitly changes the strategy.

## Near-term P2 priorities

- Domain-aware source authority registry.
- Optional critic for high-risk cases: one independent source, no primary source, high-risk domain, strong band without primary evidence, high-quality conflicts, or user-requested deeper check. Critic output should be risk flags plus a recommended action: re-search, downgrade, ask for more context, or continue.
- Better source clustering and original-source tracing.
- More precise claim classification.
- PDF/document extraction.
- Rate limiting and abuse protection.
- Improved scoring explanations and source transparency.
- Small evaluation benchmark with expected bands and required sources.
- Cache strategy and weight versioning.

## Frontend open items

- Decide history strategy: local-only, server-backed, or hybrid. This affects `listChecks` expectations.
- Add minimal browser smoke coverage: submit → loading → result/error, plus settings strategy persistence.
- Accessibility polish: tooltip IDs, loading semantics, icon labels, and reduced-motion checks.

## Longer-term backlog

- Provider comparison, failover, and cost routing.
- Possible Gemini provider SDK integration after current OpenAI/Tavily paths stabilize.
- Large-scale evaluation and freshness strategy.
- User-facing deeper check.
- Privacy and retention policy.
- i18n/localization.
- Design-system cleanup after UI patterns settle.
- Reports, sharing, export.
- Accounts and teams.
- Browser extension, public API, or integrations after the create-check API stabilizes.
- Mobile/PWA, analytics, experiments, visual polish, animation, and performance tuning when usage signals justify them.
