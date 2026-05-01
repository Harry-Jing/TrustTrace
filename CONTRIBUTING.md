# Contributing

Thanks for contributing to TrustTrace. Please keep changes small, focused, and easy to review.

## Setup

```sh
bun install
bun run dev
```

`bun install` also installs the Lefthook-managed Git hooks for local commit, commit-message, and push checks.

## Before Opening a PR

Run the quality gate:

```sh
bun run check
```

For quicker local checks, run the focused gate that matches your change:

```sh
bun run format
bun run lint
bun run typecheck
bun run test
bun run build
```

Use `bun run lint` for lint-only checks and `bun run typecheck` for TypeScript checks; workspace lint scripts intentionally do not hide type-checking work. Use `bun run test`, not bare `bun test`, because frontend tests run through Vitest/Vite for Vue SFC transforms, path aliases, jsdom, and Vitest mocking APIs.

Lefthook runs faster checks locally before commit and the full quality gate before push. Git hooks are not a substitute for CI; pushes and pull requests must pass the GitHub Actions quality workflow.

## Commit Messages

Commits must follow [Conventional Commits 1.0.0](https://www.conventionalcommits.org/en/v1.0.0/):

```txt
<type>[optional scope]: <description>
```

Allowed types: `build`, `chore`, `ci`, `docs`, `feat`, `fix`, `perf`, `refactor`, `revert`, `style`, `test`.

Examples:

```txt
feat(web): add evidence summary
fix(router): preserve query params
docs: add contributing guide
```

For breaking changes, use `!` or a `BREAKING CHANGE:` footer:

```txt
feat(api)!: rename score field
```

## PR Guidelines

- Explain what changed and why.
- Link related issues when applicable.
- Include screenshots for UI changes.
- Mention the checks you ran.
- Update docs when changing behavior, workflow, APIs, tooling, or conventions.

Do not commit secrets, API keys, credentials, or local environment files.
