# 0002. Use Shared Zod Contracts for API Boundaries

Status: Accepted
Date: 2026-05-01
Related: [Contracts architecture](../architecture/contracts.md), [API reference](../reference/api.md)

## Context

The frontend and backend need a shared understanding of HTTP and SSE payloads. Type-only sharing is not enough because backend JSON is untrusted at the frontend boundary.

## Options

- Duplicate DTO types in frontend and backend.
- Generate clients from an OpenAPI spec now.
- Share Zod schemas and inferred DTO types in a small contracts package.

## Decision

Use `packages/contracts` for Zod schemas and inferred DTO types at HTTP/SSE boundaries only. Frontend code validates backend JSON with these schemas before mapping into view models; backend code uses the schemas for request validation and DTO conformance.

## Consequences

- Runtime validation and TypeScript types come from one source.
- The package boundary must stay narrow: no backend internals, frontend view models, fixtures, or product copy.
- API changes require coordinated updates to contracts, backend, frontend mapping, and tests.

## Confirmation

`packages/contracts/src/checks.ts` exports the current check schemas and DTO types.
