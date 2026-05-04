# Glossary

| Term               | Meaning                                                                                                                |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| Claim              | A checkable statement parsed from user text or a submitted URL.                                                        |
| Submitted URL      | The URL object being checked. It is not supporting evidence unless rediscovered and verified.                          |
| Discovery          | Candidate source lookup through `search_api` or `llm_web`. Discovery output is not evidence yet.                       |
| Discovery strategy | Required create-check field selecting Tavily search (`search_api`) or OpenAI web search (`llm_web`).                   |
| Evidence gate      | Backend safety, extraction, ranking, dedupe, and assessment process before a source appears as evidence.               |
| Source             | A candidate or verified URL with metadata.                                                                             |
| Evidence item      | A verified source row shown to the user with relation, scope, tier, text, and URL.                                     |
| Snippet-only       | A source row that has only provider snippet/summary context after URL verification. Weak context only.                 |
| Scope match        | Whether evidence matches the claim's time, geography, population, metric, quote, or causal scope.                      |
| Primary source     | Original report, official record, study, filing, statement, or source closest to the claim. Not automatically neutral. |
| Independent source | A source not merely repeating the same upstream report or domain cluster.                                              |
| Verdict band       | Non-binary credibility band such as `evidence_strong`, `evidence_mixed`, or `needs_context`.                           |
| System failure     | Provider, safety, or extraction failure that prevents evidence gathering; separate from thin evidence.                 |
| SSE                | Server-Sent Events stream used for progress updates.                                                                   |
| DTO                | Data transfer object at the HTTP/SSE wire boundary.                                                                    |
| View model         | Frontend-specific shape derived from DTOs for rendering.                                                               |
