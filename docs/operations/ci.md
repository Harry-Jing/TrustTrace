# CI

GitHub Actions workflow: [../../.github/workflows/quality.yml](../../.github/workflows/quality.yml)

## Workflow

The `Quality` workflow runs on pushes and pull requests.

Steps:

1. Check out the pushed commit or PR head commit.
2. Set up Bun from the root `packageManager` field.
3. Install with `bun ci` so `bun.lock` is enforced.
4. Lint the current commit message with Commitlint.
5. Run `bun run check`.

## Permissions

The workflow grants `contents: read` only.

## Required branch protection

Protect `main` so changes require a pull request, `Quality / check` passes, force pushes/deletions are blocked, and pull requests use squash merge. Local hooks can be bypassed; GitHub Actions is the shared source of truth.

## Keeping CI small

Prefer adding checks to the existing package/root scripts before expanding CI. CI should verify the same gate developers run locally unless a check is truly CI-specific.
