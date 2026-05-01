# Evidence Model

TrustTrace is evidence-first. LLMs may help understand inputs, plan searches, assess verified excerpts, and write bounded user-facing copy, but final evidence must come from backend-verified sources.

## Core principles

1. **Discovery is not evidence.** Search APIs and LLM web search only produce candidate URLs.
2. **Every evidence item must pass the backend gate.** URLs are safety-checked, fetched or extracted, normalized, ranked, and stored before they appear in the evidence list.
3. **Snippets are weak context.** A provider snippet or summary can guide discovery, but snippet-only rows cannot independently produce a strong evidence band.
4. **The submitted URL is the object being checked.** It is not supporting evidence unless rediscovered and verified through the normal source flow.
5. **Bands are deterministic.** Backend synthesis calculates the credibility band from the verified evidence matrix; LLM copy must not override it.
6. **Uncertainty is product output.** Missing scope, stale data, conflicting sources, or thin source coverage should be visible.

## Evidence quality signals

Each source is weighed by signals such as:

- relation to the claim: supports, contradicts, neutral, or background;
- directness: direct vs. indirect evidence;
- scope match: whether time, geography, population, quote, metric, or causal scope actually matches;
- source role: primary, official, academic, independent, or derivative;
- freshness and authority for the domain;
- extractability: full text vs. provider extraction vs. snippet-only;
- independence: multiple articles citing one original report are not multiple independent sources.

Important caveats:

- `primary` does not mean neutral.
- `official` does not mean complete.
- `unknown` does not mean low quality.
- high authority still needs scope match.
- scope mismatch is the most common evidence failure mode; check it explicitly before trusting a source relation.

## Credibility bands

Current wire bands live in `packages/contracts`:

| Band              | Meaning                                                                 |
| ----------------- | ----------------------------------------------------------------------- |
| `evidence_strong` | Verified evidence strongly supports or refutes the scoped claim.        |
| `evidence_mixed`  | Credible sources conflict or support narrower/different scopes.         |
| `evidence_weak`   | Some signal exists, but it is indirect, thin, or weakly replicated.     |
| `evidence_thin`   | Not enough verified evidence to support a confident credibility read.   |
| `needs_context`   | The input is too broad, vague, underspecified, or context-dependent.    |
| `system_failed`   | The system failed to gather/read evidence; separate from thin evidence. |

The product should avoid recasting these as true/false labels.

## Claim types and evidence standards

Different claim types need different evidence:

- statistics need exact metric, range, date, and source methodology;
- quotations need original wording, speaker, venue, and date;
- causal claims need more than correlation;
- health/science claims should prefer official health bodies, peer-reviewed literature, and clear scope;
- legal/financial claims need current jurisdiction and date;
- product claims need official specs and independent testing where possible.

Domain source priorities:

- health claims: official health agencies, clinical guidance, and peer-reviewed literature;
- science claims: academic papers, primary datasets, and official research institutions;
- law claims: current statutes, regulations, court records, and jurisdiction-specific primary sources;
- financial claims: current filings, regulator releases, and dated market/economic data;
- product claims: official specifications plus independent tests or reviews;
- news/current-event claims: original documents, named records, and multiple independent reports;
- quote claims: original audio/video/transcripts or official statements before secondary summaries.

## Evaluation notes

A small future evaluation set should cover health, science, politics, products, legal/financial claims, and ambiguous general claims. Each row should record:

- the claim,
- expected band,
- key sources that should appear,
- common traps such as stale data, scope mismatch, source duplication, or quote laundering.
