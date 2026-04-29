# Conventions

## Bun Package Management and Workspace Scripts

For the current frontend, Bun is the package manager and workspace script runner. The application itself remains a Vue 3/Vite/Vitest frontend.

- Use `bun install` instead of `npm install` / `yarn install` / `pnpm install`.
- Use `bun run <script>` instead of `npm run <script>` / `yarn` / `pnpm`.
- Root scripts delegate into the `apps/*` and `packages/*` workspaces. `bun run dev` runs the Vite dev server in `apps/web`; `bun run dev:server` runs the Hono API in `apps/server`.
- Do not replace frontend tooling with Bun-native equivalents: use Vite for dev/build, Vitest for unit tests, and `vue-tsc` for Vue-aware type checking.
- Use `bun run test`, not bare `bun test` from the repo root. The root script runs contracts Bun tests, frontend Vitest tests, and backend Bun tests through their workspace scripts.
- Use `bun run build`, not `bun build`, because the root build delegates to the frontend Vite build and the backend type-check build.
- Use `bunx <package>` instead of `npx <package>` when a one-off package runner is needed.
- Bun automatically loads `.env`; don't add `dotenv` unless a future non-Bun runtime explicitly needs it.
- Shared dependency versions that appear in multiple workspaces belong in the root Bun `catalog`; workspace package manifests should reference them with `catalog:`.
- The root `tsconfig.json` is a solution file with `files: []` and references to the active workspace projects.

Bun runtime APIs such as `Bun.serve`, `bun:sqlite`, `Bun.sql`, or `Bun.file` are backend concerns only. Do not use them inside `apps/web` browser code.

## Contracts Workspace

`packages/contracts` is the current `@trusttrace/contracts` package. It owns shared Zod schemas and `z.infer` DTO types for frontend/backend wire contracts.

- Keep contracts limited to HTTP/SSE boundary payloads: request bodies, response DTOs, API error DTOs, progress events, and stable enum-like fields.
- Do not put backend internals, Drizzle schema, repository types, pipeline state, frontend ViewModels, mock fixtures, or UI component types in contracts.
- Frontend code must still validate backend JSON with these Zod schemas at the API boundary, then map DTOs into frontend feature/view-model types.
- Backend code may use the same schemas to validate incoming request bodies and may alias DTO types from contracts when those types describe wire payloads.
- Add new contract modules only when a real boundary exists; avoid catch-all shared utility modules.

## Backend Workspace

`apps/server` is the current `@trusttrace/server` backend. It uses Bun runtime APIs, Hono, Zod, Drizzle, SQLite, pino, the OpenAI SDK, and the Tavily SDK.

- Default port: `8000`. The frontend dev proxy forwards `/v1` to `http://127.0.0.1:8000`.
- Backend TypeScript follows Bun's recommended runtime baseline: `lib`/`target` `ESNext`, `module` `Preserve`, `moduleResolution` `bundler`, `moduleDetection` `force`, and `noEmit`, with project stricter checks kept enabled.
- Default SQLite path: `apps/server/data/trusttrace.sqlite`; leave `TRUSTTRACE_DB_PATH` blank to use it, or set a path relative to `apps/server` when running through `bun run --cwd apps/server ...`. Local database files are ignored by Git.
- `TRUSTTRACE_LOG_LEVEL` is validated against pino's supported levels: `trace`, `debug`, `info`, `warn`, `error`, `fatal`, and `silent`.
- Evidence discovery is split from `EvidenceProvider`: claim analysis, source assessment, and result copy remain LLM evidence-provider responsibilities, while candidate URL discovery uses a `SourceDiscoveryProvider` selected by `discoveryStrategy`.
- Create-check requests must provide allowlisted `discoveryStrategy` values from shared contracts: `search_api` maps to Tavily search and `llm_web` maps to OpenAI Responses API web search. Do not add `auto` or `parallel` modes, do not accept arbitrary provider names from the frontend, and do not silently switch strategies when the selected provider path is unavailable.
- Strategy selection only controls candidate URL discovery and must never bypass backend URL safety, input/source extraction, authority-aware ranking, same-domain dedupe, snippet-only downgrading, persistence, source assessment, or deterministic synthesis.
- URL inputs are fetched as the object being checked and stored separately from candidate evidence; never treat the submitted URL as supporting evidence unless it is rediscovered and verified through the normal source flow.
- Audit persistence includes discovery strategy, claim analysis, input extraction, provider calls, source extractions, and source evaluations. `snippet_only` source rows are weak context and must not independently produce an `evidence_strong` band.
- The server must start without `OPENAI_API_KEY` or `TAVILY_API_KEY`, but checks that require the missing provider should fail with a provider configuration error instead of fabricating placeholder evidence.
- Backend response DTOs must satisfy the shared Zod schemas in `packages/contracts` before frontend mapping.
- Backend implementation directories are organized by responsibility: `types/` for DTO groups, `schema/` for Drizzle tables, `database/` for SQLite initialization/migrations, `repositories/` for persistence facades/mappers, `pipeline/` for evidence pipeline steps, `evidenceProvider/` for claim analysis/assessment/copy provider code, `sourceDiscovery/` for candidate URL discovery providers, `sourceSafety/` and `sources/` for URL/fetch/ranking helpers, and `synthesis/` for deterministic result construction.
- Do not add root-level compatibility barrels for backend internals. Import the concrete module that owns the symbol, for example `database/openDatabase`, `repositories/repositoryFacade`, `repositories/mappers/progressMapper`, `schema/checks`, `sourceSafety/fetchSource`, `sources/ranking`, or `synthesis/buildEvidenceResult`. Directory-local files such as `pipeline/types.ts` or `evidenceProvider/types.ts` are allowed when they define that module's own contract rather than re-exporting old entry points.
- Backend lint currently runs the server TypeScript strict check; use `bun run lint:server` or the root `bun run lint`.
- Backend tests may use `bun test` inside `apps/server`, but run them through `bun run test:server` or the root `bun run test` in normal workflow.
- Keep migrations/schema changes small and explicit. The current SQLite schema stores check records, progress events, claim analysis, input extraction, provider calls, source extraction records, and source evaluations.

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

- Bun workspaces: root scripts delegate into `apps/web`, `apps/server`, and `packages/contracts` with `bun run --cwd ...`.
- Test files: `*.test.ts` or `*.spec.ts` under `apps/web/src` (not `__tests__/`).
- Tailwind CSS v4: enabled through `@tailwindcss/vite` and `@import "tailwindcss"` in `src/style.css`.
- Root-owned Prettier config follows Prettier defaults for semicolons and quotes, with `prettier-plugin-tailwindcss` and `tailwindStylesheet: "./apps/web/src/style.css"` for theme-aware class sorting.
- `eslint.config.mjs` kept as JavaScript to avoid adding `jiti` for config loading, and sets the Vue ESLint project root explicitly for the monorepo workspace.
- `.editorconfig` applies repo-wide UTF-8, LF line endings, two-space indentation, trailing whitespace trimming, and final newlines, with Markdown trailing whitespace preserved.

### Naming

- ESLint enforces naming for app code. Use `camelCase` for TypeScript identifiers and app-owned JSON/API payload fields.
- Use `PascalCase` for type-like names, Vue component imports, and component files.
- Use `UPPER_SNAKE_CASE` for module-level constants whose values are fixed configuration or fixtures.
- Prefix booleans with intent when practical: `is`, `has`, `can`, `should`, or `show`.
- Keep framework/configuration conventions where required (for example Vite environment variables and TypeScript config paths).
- Name shared app-level UI primitives with the `Base*` prefix (for example `BaseTagBadge` and `BasePageFooter`).
- Keep check feature type boundaries explicit: API DTO contracts live in `packages/contracts`; frontend events, progress, evidence, list items, and result ViewModels live in focused files under `features/checks/types/`.
- Validate backend JSON at the frontend API boundary with `@trusttrace/contracts` Zod schemas before mapping it into check feature types.
- CSS naming follows the utility-first rules below.

### Enforced TypeScript and Vue standards

These are hard rules for production code under `apps/web/src`:

- TypeScript stays strict. `exactOptionalPropertyTypes` and `noUncheckedIndexedAccess` are enabled so optional properties and indexed reads must be handled explicitly.
- ESLint extends the Vue-aware `strictTypeChecked` TypeScript ruleset. Keep nullable and fallback logic explicit; prefer `??` for nullish fallback and optional chaining for safe property access.
- Use `unknown` plus Zod or a type guard for untrusted data. Do not use `any`.
- Use `import type` for type-only imports. ESLint enforces this with `@typescript-eslint/consistent-type-imports`.
- Do not use non-null assertions (`!`) in production code. Prove the value exists, provide a fallback, or narrow the type.
- Use `null` for business-level “known absent” values such as `result`, `error`, or selected IDs. Use omitted properties/`undefined` for JavaScript absence, optional object fields, and Vue attribute removal.
- Backend JSON must be parsed and normalized at the API boundary before it reaches components, stores, or composables.
- Vue SFCs use `<script setup lang="ts">`, type-based `defineProps` / `defineEmits`, explicit button `type` attributes, typed `ref` calls, and no static inline `style` attributes.
- Vue templates use the `eslint-plugin-vue` recommended rules: semantic component naming, explicit emits, keyed `v-for`, no `v-if` with `v-for` on the same element, prop casing consistency, known component names, and community-recommended consistency checks.
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
- Prefer Tailwind canonical utilities over arbitrary values when they express the same value through the active theme, for example `max-w-120` instead of `max-w-[480px]` and `gap-0.75` instead of `gap-[3px]`.
- Keep arbitrary values for one-off values outside the theme scale, complex CSS expressions, exact external constraints, and cases where the literal CSS value is clearer than the canonical form.
- When utility combinations become meaningfully duplicated, prefer extracting a Vue component before adding a global CSS class.
- Add custom CSS only when utilities or component extraction would be less clear: theme tokens, global base defaults, Vue transition class names, reusable cross-component behavior, and motion helpers.
- Keep custom CSS in Tailwind-aware layers: `@layer base` for global defaults, `@layer components` for reusable UI, and `@utility` for reusable utility-style helpers.
- Use lower-kebab-case for custom CSS class names, keyframes, and custom identifiers. Use the `tt-` prefix for app-wide shared classes such as `tt-btn`.
- Use unprefixed semantic role names for design tokens (`--background`, `--foreground`, `--accent`, `--warning`, `--success`, etc.) defined in `:root` and `[data-theme="dark"]`, and bridge them through `@theme inline` as `--color-*` so Tailwind utilities resolve them. Names follow Tailwind v4 + W3C DTCG + shadcn/ui conventions: role-based (`-muted`/`-subtle`), never value-based (`-light`/`-dark`).
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
2. `lint` (frontend lint + backend strict TypeScript check)
3. `test` (contracts Bun tests + frontend Vitest + backend Bun tests)
4. `build` (contracts type-check build + frontend `vue-tsc`/Vite build + backend type-check build)

`format:check` is repo-wide and covers app source, docs, and configuration files from the root Prettier config.

Use `bun run test`, not bare `bun test` from the repo root — frontend tests run through Vitest/Vite, and backend tests run through the server workspace script.

### Git hooks and CI

Lefthook manages local Git hooks from `lefthook.yml`. `bun install` runs the root `prepare` script, which installs the configured hooks into `.git/hooks/`.

| Hook         | Command                                   | Purpose                                                                |
| ------------ | ----------------------------------------- | ---------------------------------------------------------------------- |
| `pre-commit` | `bun run format:check` and `bun run lint` | Fast feedback before a local commit is created.                        |
| `commit-msg` | `bun run commitlint --edit {1}`           | Enforce Conventional Commit message types listed in `CONTRIBUTING.md`. |
| `pre-push`   | `bun run check`                           | Run the full local quality gate before publishing commits.             |

Local hooks are a developer safety net and can be bypassed by Git. The GitHub Actions workflow in `.github/workflows/quality.yml` is the source of truth for required checks on pushes and pull requests. Keep CI minimal: install dependencies with Bun and run `bun run check`. To make this non-bypassable on shared branches, configure GitHub branch protection to require the `Quality / check` status before merge.

### Configuration files

Ignore rules are split into root, `apps/web`, `apps/server`, and package layers as needed so shared, frontend-only, and backend-only artifacts stay easy to scan.

```txt
.editorconfig                    # Repo-wide editor defaults
.gitattributes                   # Repo-wide LF line-ending normalization
.gitignore                       # Shared root-level ignore patterns
.prettierrc.json                 # Repo-wide Prettier config with Tailwind class sorting
.prettierignore                  # Repo-wide Prettier ignore patterns
package.json                     # Bun workspace scripts and root repo tooling
tsconfig.json                    # Root TypeScript project references
apps/server/.env.example         # Backend environment variable template
apps/server/.gitignore           # Backend-local Bun/SQLite ignore patterns
apps/server/tsconfig.json        # Backend Bun runtime type-checking
apps/web/.env.example            # Frontend Vite environment variable template
apps/web/.gitignore              # Frontend-local Vite/Vue ignore patterns
apps/web/eslint.config.mjs       # ESLint flat config for Vue + TS + Vitest + Oxlint
apps/web/.oxlintrc.json          # Oxlint correctness pass
apps/web/env.d.ts                # Vite client types
apps/web/tsconfig.json           # Frontend TypeScript project references
apps/web/tsconfig.app.json       # Browser app type-checking
apps/web/tsconfig.node.json      # Tooling config type-checking
apps/web/tsconfig.vitest.json    # Test type-checking
apps/web/vite.config.ts          # Vite config and local /v1 backend proxy
apps/web/vitest.config.ts        # Vitest config merged with Vite config
packages/contracts/package.json  # Shared API contracts package manifest
packages/contracts/tsconfig.json # Contracts package strict type-checking
commitlint.config.mjs             # Official Conventional Commit preset
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
