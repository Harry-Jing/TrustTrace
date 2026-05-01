# TrustTrace Contracts

`@trusttrace/contracts` provides shared Zod schemas and inferred DTO types for TrustTrace HTTP and SSE boundaries.

## Exports

```ts
import { createCheckRequestSchema } from "@trusttrace/contracts";
import { progressEventSchema } from "@trusttrace/contracts/checks";
```

Export paths:

- `@trusttrace/contracts`
- `@trusttrace/contracts/checks`

## What belongs here

- HTTP request bodies and response DTOs.
- API error DTOs.
- Progress/SSE events.
- Stable wire enums such as check status, phases, verdict bands, discovery strategy, and error codes.

## What does not belong here

- Backend internals, Drizzle schema, repository types, provider state, or pipeline state.
- Frontend view models, components, mock fixtures, product copy, retry guidance, or UI tone/color tokens.
- Generic shared utilities without a real API boundary.

## Adding a contract

1. Add or update the Zod schema in `src/`.
2. Export the schema and `z.infer` DTO type.
3. Update backend validation and DTO mapping.
4. Update frontend boundary validation and DTO-to-view-model mapping.
5. Add tests for non-trivial validation, transforms, or enum behavior.

## Checks

```sh
bun run lint
bun run typecheck
bun run test
bun run build
```

From the repository root, use `bun run lint:contracts`, `bun run typecheck:contracts`, `bun run test:contracts`, or `bun run check`.

See [contracts architecture](../../docs/architecture/contracts.md).
