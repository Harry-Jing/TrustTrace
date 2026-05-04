# Product Overview

TrustTrace helps a user inspect the credibility of a URL or text claim by collecting structured evidence and showing uncertainty. It is not a binary fact-check oracle.

## Product goal

Give users a compact, inspectable evidence context:

- what claim was checked,
- which sources were found and read,
- how each source relates to the claim,
- where evidence is strong, mixed, weak, thin, or missing,
- what uncertainty remains.

## Target users

- Readers who want to understand whether an online claim is supported by available sources.
- Researchers or journalists doing a first-pass source scan.
- Product users who need a visible trail of evidence before trusting a generated summary.

## Non-goals

TrustTrace should not:

- label claims as simply true or false,
- ask an LLM to judge from model memory,
- treat search snippets as strong evidence,
- hide uncertainty behind confident copy,
- pretend official or primary sources are automatically complete or neutral.

## Current maturity

The project has moved past frontend-only mocks. The current stack includes:

- a Vue frontend with backend and mock modes,
- a Hono/Bun backend with SQLite persistence,
- shared Zod API contracts,
- selectable discovery strategy (`search_api` or `llm_web`),
- backend URL safety, content extraction, source assessment, deterministic synthesis, and SSE progress.

P1.5 is accepted. Future work should focus on P2 evidence quality, coverage, evaluation, and operational hardening rather than reopening automatic or parallel discovery modes.
