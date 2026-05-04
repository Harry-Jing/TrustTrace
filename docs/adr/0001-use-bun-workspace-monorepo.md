# 0001. Use Bun Workspace Monorepo

Status: Accepted
Date: 2026-05-01
Related: [Commands](../development/commands.md), [Conventions](../development/conventions.md)

## Context

TrustTrace has tightly coupled frontend, backend, and shared contracts. The project needs one local workflow for dependency installation, scripts, and quality gates while keeping each package independently understandable.

## Options

- Separate repositories for frontend, backend, and contracts.
- Node/npm workspaces.
- Bun workspace monorepo.

## Decision

Use a Bun workspace monorepo with `apps/web`, `apps/server`, and `packages/contracts`. Bun handles dependency installation and script orchestration; the frontend still uses Vite, Vitest, and `vue-tsc` rather than Bun-native replacements.

## Consequences

- Root scripts can run consistent repo-wide gates.
- Shared contracts can be consumed through workspace dependencies.
- Developers must use `bun run` scripts and avoid bare `bun test` at the root.
- Bun runtime APIs are backend-only and must not leak into browser code.

## Confirmation

The root `package.json` declares workspaces and package scripts; development docs describe the command policy.
