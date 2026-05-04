# Contracts Architecture

`packages/contracts` owns the shared Zod schemas and `z.infer` DTO types for TrustTrace HTTP and SSE wire payloads.

## What belongs here

- Request bodies.
- Response DTOs.
- API error DTOs.
- Progress/SSE events.
- Stable enum-like fields used across frontend and backend, such as `verdictBand`, `discoveryStrategy`, and persisted check error codes.

## What does not belong here

- Backend internals, Drizzle schema, repositories, pipeline state, or provider state.
- Frontend view models, UI components, mock fixtures, product copy, retry guidance, or presentation tone/color tokens.
- Shared utility modules that are not a real wire boundary.

## Current exports

- `@trusttrace/contracts`
- `@trusttrace/contracts/checks`

The checks module exports schemas and DTO types for check status, discovery strategy, phases, verdict bands, errors, check records, check results, check lists, and progress events.

## Boundary flow

- Backend validates incoming request bodies with contract schemas and returns DTOs that should satisfy the same schemas.
- Frontend validates backend JSON at the API boundary, then maps DTOs into feature/view-model types.
- User-facing copy and UI-specific explanations remain in `apps/web`.

## Lint and test strictness

Contracts sit on the frontend/backend boundary, so they stay stricter than ordinary implementation tests:

- use the typed ESLint baseline plus TSDoc syntax warnings;
- keep `strict-boolean-expressions` and `no-unnecessary-condition` as errors for source and tests;
- do not inherit the backend test suite's broader unsafe-fixture relaxations;
- keep `bun run lint:contracts` lint-only and `bun run typecheck:contracts` as the TypeScript contract check.

## Adding a contract

1. Add a schema only when a real HTTP or SSE boundary exists.
2. Export the schema and inferred DTO type.
3. Update backend validation/mapping.
4. Update frontend runtime validation and DTO-to-view-model mapping.
5. Add focused schema tests when the boundary has non-trivial validation or transforms.
