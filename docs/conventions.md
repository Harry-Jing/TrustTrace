# Conventions

## Bun Package Management and Workspace Scripts

For the current frontend, Bun is the package manager and workspace script runner. The application itself remains a Vue 3/Vite/Vitest frontend.

- Use `bun install` instead of `npm install` / `yarn install` / `pnpm install`.
- Use `bun run <script>` instead of `npm run <script>` / `yarn` / `pnpm`.
- Root scripts delegate into workspaces, for example `bun run dev` runs the Vite dev server in `apps/web`.
- Do not replace frontend tooling with Bun-native equivalents: use Vite for dev/build, Vitest for unit tests, and `vue-tsc` for Vue-aware type checking.
- Use `bun run test`, not bare `bun test`, because the Vue frontend tests require Vite path aliases, Vue SFC transforms, jsdom, and Vitest mocking APIs such as `vi.hoisted`.
- Use `bun run build`, not `bun build`, because production frontend builds are Vite builds preceded by `vue-tsc`.
- Use `bunx <package>` instead of `npx <package>` when a one-off package runner is needed.
- Bun automatically loads `.env`; don't add `dotenv` unless a future non-Bun runtime explicitly needs it.

Bun runtime APIs such as `Bun.serve`, `bun:sqlite`, `Bun.sql`, or `Bun.file` are backend concerns only. Do not use them inside `apps/web` browser code.

## Frontend Quality Tooling

The frontend in `apps/web` follows the `create-vue` tooling baseline. Project-specific changes should stay small, explicit, and documented here.

### Tooling baseline

| Concern        | Tool                           | Role                                                           |
| -------------- | ------------------------------ | -------------------------------------------------------------- |
| Type checking  | `vue-tsc`                      | TypeScript checks with Vue SFC support.                        |
| Vue linting    | `eslint` + `eslint-plugin-vue` | Vue `<template>` and `<script>` correctness beyond TypeScript. |
| Fast lint pass | `oxlint`                       | Fast correctness-oriented lint pass before ESLint.             |
| Formatting     | `prettier`                     | Owns code formatting. ESLint formatting rules are disabled.    |
| Unit tests     | `vitest` + `@vue/test-utils`   | Vue component tests using the same Vite transform pipeline.    |

### TrustTrace differences from create-vue

- Bun workspaces: root scripts delegate into `apps/web` with `bun run --cwd apps/web ...`.
- Test files: `*.test.ts` or `*.spec.ts` under `apps/web/src` (not `__tests__/`).
- Tailwind CSS v4: enabled through `@tailwindcss/vite` and `@import "tailwindcss"` in `src/style.css`.
- `prettier-plugin-tailwindcss` with `tailwindStylesheet: "./src/style.css"` for theme-aware class sorting.
- `eslint.config.mjs` kept as JavaScript to avoid adding `jiti` for config loading, and sets the Vue ESLint project root explicitly for the monorepo workspace.

### Naming

- ESLint enforces naming for app code. Use `camelCase` for TypeScript identifiers and app-owned JSON/API payload fields.
- Use `PascalCase` for type-like names, Vue component imports, and component files.
- Use `UPPER_SNAKE_CASE` for module-level constants whose values are fixed configuration or fixtures.
- Prefix booleans with intent when practical: `is`, `has`, `can`, `should`, or `show`.
- Keep framework/configuration conventions where required (for example Vite environment variables and TypeScript config paths).
- Name shared app-level UI primitives with the `Base*` prefix (for example `BaseTagBadge` and `BasePageFooter`).
- Keep check feature type boundaries explicit: API DTOs, events, progress, evidence, list items, and result ViewModels live in focused files under `features/checks/types/`.
- Validate backend JSON at the frontend API boundary with Zod before mapping it into check feature types. Keep these schemas in `apps/web` until the backend DTOs are stable enough to extract into a shared `packages/contracts` package.
- CSS naming follows the utility-first rules below.

### Enforced TypeScript and Vue standards

These are hard rules for production code under `apps/web/src`:

- TypeScript stays strict. `exactOptionalPropertyTypes` and `noUncheckedIndexedAccess` are enabled so optional properties and indexed reads must be handled explicitly.
- Use `unknown` plus Zod or a type guard for untrusted data. Do not use `any`.
- Use `import type` for type-only imports. ESLint enforces this with `@typescript-eslint/consistent-type-imports`.
- Do not use non-null assertions (`!`) in production code. Prove the value exists, provide a fallback, or narrow the type.
- Use `null` for business-level “known absent” values such as `result`, `error`, or selected IDs. Use omitted properties/`undefined` for JavaScript absence, optional object fields, and Vue attribute removal.
- Backend JSON must be parsed and normalized at the API boundary before it reaches components, stores, or composables.
- Vue templates use the `eslint-plugin-vue` recommended rules: semantic component naming, explicit emits, keyed `v-for`, no `v-if` with `v-for` on the same element, prop casing consistency, and community-recommended consistency checks.
- Test files may use small test ergonomics exceptions, including local test components and non-null assertions around known test fixtures.

#### MUST

- Run and pass `bun run check` before a PR is ready.
- Keep formatting in Prettier and code-quality checks in ESLint/Oxlint; do not add formatting rules to ESLint.
- Keep API/runtime contracts validated with Zod at boundaries before mapping into app types.
- Keep production code free of `any`, non-null assertions, and unvalidated backend payloads.

#### SHOULD

- Prefer small typed helpers over casts when narrowing optional or indexed values.
- Prefer `null` over sentinel strings for explicit empty business state.
- Prefer stable domain keys over array indexes in `v-for`; index keys are acceptable only for static display-only lists that never reorder.
- Prefer component extraction over new global CSS when utility combinations repeat across features.

### CSS architecture

- `apps/web/src/style.css` owns theme custom properties, the Tailwind `@theme` bridge, base defaults, shared component classes, and motion utilities.
- Prefer Tailwind utility classes directly in Vue templates for layout, spacing, color, typography, state, and responsive behavior.
- When utility combinations become meaningfully duplicated, prefer extracting a Vue component before adding a global CSS class.
- Add custom CSS only when utilities or component extraction would be less clear: theme tokens, global base defaults, Vue transition class names, reusable cross-component behavior, and motion helpers.
- Keep custom CSS in Tailwind-aware layers: `@layer base` for global defaults, `@layer components` for reusable UI, and `@utility` for reusable utility-style helpers.
- Use lower-kebab-case for custom CSS class names, keyframes, and custom identifiers. Use the `tt-` prefix for app-wide shared classes such as `tt-btn`.
- Use `--tt-*` lower-kebab-case custom properties for app tokens, and expose user-facing utility names through Tailwind's `@theme` bridge.
- Do not keep no-op marker classes in templates. A class should either be a Tailwind utility, a Vue transition class, or have a rule in `style.css`.
- Avoid BEM by default in new code. It is acceptable for complex class-based global selectors, but prefer utilities, state/data/ARIA variants, or component extraction first.
- Prefer semantic Tailwind tokens/classes in Vue templates. Don't pass raw CSS color strings through fixtures, stores, or API-shaped data.
- Avoid static inline `style` attributes. Bind narrow CSS custom properties only (animation delays, progress ratios) and keep actual rules in `style.css`.
- `!important` is an accessibility escape hatch only (e.g. `prefers-reduced-motion` override).
- Prefer semantic attributes over style class names in tests (for example `aria-pressed` instead of an active-state CSS class).
- Revisit and remove unused custom CSS utilities/keyframes when templates no longer reference them.

References: [Tailwind utility-first](https://tailwindcss.com/docs/utility-first), [Tailwind custom styles](https://tailwindcss.com/docs/adding-custom-styles), [Vue SFC CSS features](https://vuejs.org/api/sfc-css-features), [Vue component-scoped styling](https://vuejs.org/style-guide/rules-essential.html#use-component-scoped-styling), [MDN CSS casing](https://developer.mozilla.org/en-US/docs/MDN/Writing_guidelines/Code_style_guide/CSS#casing), [BEM naming](https://getbem.com/naming/).

### Quality gate

`bun run check` runs the full local and CI quality gate:

1. `format:check`
2. `lint`
3. `test`
4. `build` (includes `typecheck` before `vite build`)

Use `bun run test`, not bare `bun test` — frontend tests run through Vitest/Vite for Vue SFC transforms, path aliases, jsdom, and Vitest mocking APIs.

### Git hooks and CI

Lefthook manages local Git hooks from `lefthook.yml`. `bun install` runs the root `prepare` script, which installs the configured hooks into `.git/hooks/`.

| Hook         | Command                                   | Purpose                                                                |
| ------------ | ----------------------------------------- | ---------------------------------------------------------------------- |
| `pre-commit` | `bun run format:check` and `bun run lint` | Fast feedback before a local commit is created.                        |
| `commit-msg` | `bun run commitlint --edit {1}`           | Enforce Conventional Commit message types listed in `CONTRIBUTING.md`. |
| `pre-push`   | `bun run check`                           | Run the full local quality gate before publishing commits.             |

Local hooks are a developer safety net and can be bypassed by Git. The GitHub Actions workflow in `.github/workflows/quality.yml` is the source of truth for required checks on pushes and pull requests. Keep CI minimal: install dependencies with Bun and run `bun run check`. To make this non-bypassable on shared branches, configure GitHub branch protection to require the `Quality / check` status before merge.

### Configuration files

```txt
apps/web/eslint.config.mjs       # ESLint flat config for Vue + TS + Vitest + Oxlint
apps/web/.oxlintrc.json          # Oxlint correctness pass
apps/web/.prettierrc.json        # Prettier config with Tailwind class sorting
apps/web/env.d.ts                # Vite client types
apps/web/tsconfig.app.json       # Browser app type-checking
apps/web/tsconfig.node.json      # Tooling config type-checking
apps/web/tsconfig.vitest.json    # Test type-checking
apps/web/vitest.config.ts        # Vitest config merged with Vite config
commitlint.config.mjs             # Conventional Commit message rules
lefthook.yml                      # Local Git hook orchestration
.github/workflows/quality.yml     # CI quality gate for pushes and pull requests
```

### VS Code workspace

`create-vue` workspace workflow: Explorer file nesting, Prettier as default formatter, format-on-save, and automatic ESLint working directory detection for the monorepo. Recommended extensions in `.vscode/extensions.json`. `.editorconfig` + `.gitattributes` for consistent editor and line-ending behavior.

### Rules of thumb

- Keep formatting and linting separate: Prettier formats; ESLint catches code-quality and Vue issues.
- Keep `eslint-plugin-vue` even with Oxlint — Vue template-aware checks still belong to ESLint.
- Put frontend dependencies in `apps/web/package.json`; root scripts only orchestrate workspaces.
- Prefer the default `create-vue` shape unless a TrustTrace-specific difference is documented here.
- For theme-dependent segmented controls, keep selected labels on an explicit contrast token and verify both light and dark mode states.
