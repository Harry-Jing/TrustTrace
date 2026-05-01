# 0000. Use Architecture Decision Records

Status: Accepted
Date: 2026-05-01
Related: [ADR index](README.md)

## Context

TrustTrace has a small but growing architecture: frontend, backend, shared contracts, provider choices, persistence, and evidence-safety rules. Some decisions need rationale that is more durable than commit messages or roadmap notes.

## Options

- Keep decisions only in implementation docs and commit history.
- Adopt heavyweight architecture documentation for every change.
- Use lightweight ADRs only for important, long-lived decisions.

## Decision

Use lightweight ADRs for important decisions. Keep each ADR short and link to current docs for details.

## Consequences

- Important decisions have a clear rationale and date.
- Documentation stays small because ADRs do not duplicate full architecture docs.
- Trivial changes should not create ADR noise.

## Confirmation

The ADR index and template live in `docs/adr/`.
