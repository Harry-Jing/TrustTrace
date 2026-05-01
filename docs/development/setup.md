# Local Setup

## Prerequisites

- Bun matching the root `packageManager` field.
- Provider keys only when you want live backend checks that use those providers.

## Install

```sh
bun install
```

The root `prepare` script installs Lefthook-managed Git hooks.

## VS Code

Open the repository root as the VS Code workspace so `.vscode` settings and extension recommendations apply.

After `bun install`, accept the workspace TypeScript prompt. VS Code uses the root `node_modules/typescript/lib` SDK, Prettier owns formatting, and ESLint fixes do not run on save.

## Environment files

Use the examples as templates:

```sh
cp apps/web/.env.example apps/web/.env
cp apps/server/.env.example apps/server/.env
```

Common defaults:

- Frontend API mode defaults to `backend`.
- Frontend API base URL defaults to `/v1`.
- Backend port defaults to `8000`.
- Backend SQLite path defaults to `apps/server/data/trusttrace.sqlite`.

See [../operations/configuration.md](../operations/configuration.md) for all environment variables.

## Run locally

Frontend and backend together:

```sh
bun run dev:all
```

Separate terminals:

```sh
bun run dev
bun run dev:server
```

The Vite dev server proxies `/v1` to `http://127.0.0.1:8000`.

## Mock mode

Set this in `apps/web/.env` when you intentionally want fixture-backed UI/demo mode:

```sh
VITE_TRUSTTRACE_API_MODE=mock
```

Mock/dev panel details live in [dev-tooling.md](dev-tooling.md).

## First checks

```sh
bun run format:check
bun run test
```

Before a PR is ready, run:

```sh
bun run check
```
