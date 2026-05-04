# Contributing

Thanks for contributing to TrustTrace. Keep changes small, focused, and easy to review.

## Workflow

1. Install dependencies with `bun install`.
2. Create a focused branch.
3. Make the change and update docs when behavior, workflow, APIs, tooling, or conventions change.
4. Run the relevant checks locally.
5. Open a PR with what changed, why, and which checks you ran.

## Branch and merge policy

`main` is protected: do not push directly to it. Open a focused PR, wait for `Quality / check` to pass, and squash merge with a Conventional Commit title.

## Local checks

Run the full gate before a PR is ready:

```sh
bun run check
```

For smaller feedback loops, use focused commands:

```sh
bun run format
bun run lint
bun run typecheck
bun run test
bun run build
```

Use `bun run test`, not bare `bun test`, from the repository root. Frontend tests run through Vitest/Vite; contracts and backend tests run through their workspace scripts.

More detail:

- Setup: [docs/development/setup.md](docs/development/setup.md)
- Commands: [docs/development/commands.md](docs/development/commands.md)
- Quality gate, hooks, CI: [docs/development/quality.md](docs/development/quality.md)
- Conventions: [docs/development/conventions.md](docs/development/conventions.md)

## Commit messages

Commits use Conventional Commits:

```txt
<type>[optional scope]: <description>
```

Allowed types: `build`, `chore`, `ci`, `docs`, `feat`, `fix`, `perf`, `refactor`, `revert`, `style`, `test`.

Examples:

```txt
feat(web): add evidence summary
fix(router): preserve query params
docs: reorganize architecture docs
```

For breaking changes, use `!` or a `BREAKING CHANGE:` footer.

## PR checklist

- Explain what changed and why.
- Link related issues when applicable.
- Include screenshots for UI changes.
- Mention the checks you ran.
- Update documentation for changed behavior, APIs, workflow, tooling, or conventions.
- Do not commit secrets, API keys, credentials, local database files, or local environment files.
