# Commands

Bun is the package manager and workspace script runner. Use `bun run <script>` instead of npm/yarn/pnpm equivalents.

## Root commands

| Command                | Purpose                                                           |
| ---------------------- | ----------------------------------------------------------------- |
| `bun install`          | Install workspace dependencies and hooks.                         |
| `bun run dev`          | Start the frontend dev server.                                    |
| `bun run dev:server`   | Start the backend API server on port `8000` by default.           |
| `bun run dev:all`      | Start frontend and backend dev servers together.                  |
| `bun run start:server` | Start the backend API server without watch mode.                  |
| `bun run format`       | Format files with root Prettier config.                           |
| `bun run format:check` | Check formatting without writing.                                 |
| `bun run lint`         | Run workspace lint scripts.                                       |
| `bun run typecheck`    | Run workspace TypeScript checks.                                  |
| `bun run test`         | Run workspace tests; frontend uses Vitest/Vite, backend uses Bun. |
| `bun run build`        | Run workspace builds/type-check builds.                           |
| `bun run check`        | Full gate: format check → lint → typecheck → test → build.        |

Use `bun run test`, not bare `bun test`, from the repo root.

## Focused aliases

| Command                       | Purpose              |
| ----------------------------- | -------------------- |
| `bun run lint:web`            | Frontend lint.       |
| `bun run lint:server`         | Backend lint.        |
| `bun run lint:contracts`      | Contracts lint.      |
| `bun run typecheck:web`       | Frontend typecheck.  |
| `bun run typecheck:server`    | Backend typecheck.   |
| `bun run typecheck:contracts` | Contracts typecheck. |
| `bun run test:web`            | Frontend tests.      |
| `bun run test:server`         | Backend tests.       |
| `bun run test:contracts`      | Contracts tests.     |

Focused aliases use `bun run --cwd ...`; aggregate scripts use Bun workspace fanout and prefixed output.

## Package commands

Inside a workspace package, use that package's scripts. Examples:

```sh
cd apps/web && bun run dev
cd apps/server && bun run test
cd packages/contracts && bun run typecheck
```

Do not replace Vite, Vitest, or `vue-tsc` with Bun-native equivalents in the frontend. Use `bun run build`, not `bun build`, because the root build delegates to package build scripts.
