# Quality

`bun run check` is the canonical local and CI quality gate.

## Full gate

```txt
format:check
→ lint
→ typecheck
→ test
→ build
```

Details:

1. `format:check` runs Prettier from the root without cache.
2. `lint` runs contracts typed ESLint, frontend Oxlint/ESLint, and backend typed ESLint with warnings denied.
3. `typecheck` runs contracts `tsc`, frontend `vue-tsc`, and backend `tsc`.
4. `test` runs contracts Bun tests, frontend Vitest, and backend Bun tests.
5. `build` runs workspace builds sequentially so dependency packages build before consumers.

Use `bun run test`, not bare `bun test`, at the repo root.

## Formatting and linting

- Prettier owns formatting.
- ESLint/Oxlint own code-quality checks.
- Do not add formatting rules to ESLint.
- Root Prettier scripts pass `--no-cache` so hooks and CI do not trust stale formatter caches.
- Root Prettier config owns Tailwind class sorting; keep theme-aware class ordering out of ESLint.
- ESLint check scripts run uncached, lint-only, and with `--max-warnings=0`.
- Use monorepo-safe ignores for generated output (`**/dist/**`, `**/coverage/**`) and narrow workspace ignores for runtime artifacts such as server `data/**`.

## Git hooks

Lefthook manages local hooks from `lefthook.yml`.

| Hook         | Command                                   | Purpose                                    |
| ------------ | ----------------------------------------- | ------------------------------------------ |
| `pre-commit` | `bun run format:check` and `bun run lint` | Fast feedback before local commits.        |
| `commit-msg` | `bun run commitlint --edit {1}`           | Enforce Conventional Commits.              |
| `pre-push`   | `bun run check`                           | Full local gate before publishing commits. |

Hooks are a safety net, not the source of truth. CI still must pass.

## Commit messages

Commitlint uses the official Conventional Commit preset. Allowed types are listed in [../../CONTRIBUTING.md](../../CONTRIBUTING.md).

## CI

GitHub Actions runs `bun ci`, commitlint for the current commit message, then `bun run check`. See [../operations/ci.md](../operations/ci.md).
