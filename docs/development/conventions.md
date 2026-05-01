# Development Conventions

## Bun and workspace policy

- Use `bun install` for dependencies.
- Use `bun run <script>` for scripts.
- Use `bunx <package>` instead of `npx <package>` for one-off runners.
- Shared dependency versions used by multiple workspaces belong in the root Bun `catalog`; workspace manifests should reference them with `catalog:`.
- Use `bun outdated -r --no-cache` for dependency audits. Prefer non-major updates within the current runtime/tooling baseline.
- Bun automatically loads `.env`; do not add `dotenv` unless a future non-Bun runtime requires it.
- The root `tsconfig.json` is a solution file with `files: []` and references to active workspace projects.
- Package-specific runtime dependencies belong in the owning workspace manifest; root scripts should orchestrate workspaces, not hide package ownership.

Bun runtime APIs such as `Bun.serve`, `bun:sqlite`, `Bun.sql`, or `Bun.file` are backend-only and must not be used in browser code.

## Contracts

- Keep `packages/contracts` limited to HTTP/SSE wire payloads.
- Stable API enums belong in contracts; UI copy, retry guidance, and presentation tones belong in `apps/web`.
- Do not put backend internals, Drizzle schema, repository types, pipeline state, frontend view models, mock fixtures, or UI component types in contracts.
- Add new contract modules only when a real boundary exists.

## Backend

- Backend TypeScript follows Bun's runtime baseline: `lib`/`target` `ESNext`, `module` `Preserve`, `moduleResolution` `bundler`, `moduleDetection` `force`, and `noEmit`.
- Strict checks remain enabled, including `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`, `isolatedModules`, `noImplicitReturns`, and `noUncheckedSideEffectImports`.
- Backend responses must satisfy shared Zod schemas before frontend mapping.
- Keep migrations/schema changes small and explicit.
- Do not add compatibility barrels for backend internals; import the module that owns the symbol.

## Frontend tooling baseline

| Concern        | Tool                           | Role                                 |
| -------------- | ------------------------------ | ------------------------------------ |
| Type checking  | `vue-tsc`                      | TypeScript checks with Vue SFCs.     |
| Vue linting    | `eslint` + `eslint-plugin-vue` | Template and script correctness.     |
| Fast lint pass | `oxlint`                       | Fast correctness-oriented lint pass. |
| Formatting     | `prettier`                     | Code and docs formatting.            |
| Unit tests     | `vitest` + `@vue/test-utils`   | Vue tests through the Vite pipeline. |

Project differences from create-vue:

- Prefer the default create-vue shape unless a TrustTrace-specific difference is documented here.
- Keep `eslint-plugin-vue` even with Oxlint; Vue template-aware checks still belong to ESLint.
- Test files live as `*.test.ts` or `*.spec.ts` under `apps/web/src`.
- Tailwind CSS v4 is enabled through `@tailwindcss/vite` and `@import "tailwindcss"` in `src/style.css`.
- `eslint.config.mjs` stays JavaScript to avoid adding `jiti` for config loading.
- Flat configs use `name` fields for "what" and short comments for "why".
- Comment only non-default tradeoffs, exceptions, or tool interactions; keep JSON configs comment-free unless the format supports JSONC.
- `.editorconfig` applies UTF-8, LF endings, two-space indentation, trimming, and final newlines; Markdown trailing whitespace is preserved.

## TypeScript and Vue standards

Production code should:

- use `unknown` plus Zod or type guards for untrusted data;
- avoid `any` and non-null assertions;
- use `import type` for type-only imports;
- prefer `??` and optional chaining for nullable/fallback logic;
- prefer small typed helpers over casts when narrowing optional or indexed values;
- use `null` for business-level known-absent state and `undefined`/omitted fields for JavaScript absence;
- delete dead assignments instead of preserving them as scheduler or state placeholders;
- parse backend JSON at the API boundary before it reaches components, stores, or composables;
- use Vue `<script setup lang="ts">`, type-based props/emits, explicit button `type`, typed refs, and keyed `v-for`;
- prefer stable domain keys over array indexes in `v-for`; index keys are only for static display-only lists that never reorder;
- avoid `v-if` and `v-for` on the same element;
- avoid static inline `style` attributes.

Test files may use small ergonomics exceptions around local test components and known fixtures.

## Naming

- `camelCase` for TypeScript identifiers and app-owned JSON/API payload fields.
- `PascalCase` for type-like names, Vue component imports, and component files.
- `UPPER_SNAKE_CASE` for fixed module-level constants or fixtures.
- Boolean names should show intent when practical: `is`, `has`, `can`, `should`, or `show`.
- Shared UI primitives use the `Base*` prefix.
- Check feature DTO contracts live in `packages/contracts`; frontend events, progress, evidence, list items, and result view models live under `features/checks/types/`.

## CSS architecture

- `apps/web/src/style.css` owns theme custom properties, Tailwind `@theme` bridge, base defaults, shared component classes, and motion utilities.
- Prefer Tailwind utilities in Vue templates.
- Prefer canonical theme utilities over arbitrary values when they express the same value.
- Keep arbitrary values for one-off external constraints, complex expressions, or cases where the literal CSS is clearer.
- Extract a Vue component before adding global CSS when utility combinations repeat.
- Add custom CSS only for theme tokens, global base defaults, Vue transitions, reusable cross-component behavior, or motion helpers.
- Use `@layer base`, `@layer components`, and `@utility` for Tailwind-aware custom CSS.
- Custom class/keyframe identifiers use lower-kebab-case; app-wide shared classes use the `tt-` prefix.
- Generic design tokens use semantic role names such as `--background`, `--foreground`, `--accent`, `--warning`, and `--success`.
- Domain-scoped evidence tokens are reserved for evidence surfaces and should not bleed into generic UI.
- Keep generic UI tone (`BadgeTone`) separate from domain-semantic evidence tones (`EvidenceTone`, `EvidenceRelationTone`, `EvidenceTierTone`).
- Evidence verdict, relation, and tier surfaces must not reuse generic status hues such as `--success` or `--warning`; those imply product meanings like "approved" or "danger" that evidence bands do not carry.
- Create a domain tone enum only when it scopes a domain palette and carries a meaningful rename/merge from the source enum; otherwise a direct `Record<DomainEnum, string>` is enough.
- Ordinal data such as evidence tier or strength meters should use sequential lightness on one hue, not unrelated nominal hues.
- Avoid no-op marker classes, BEM by default, raw CSS color strings in fixtures/stores/API-shaped data, and `!important` except for accessibility overrides.
- Bind narrow CSS custom properties only for dynamic values such as animation delays or progress ratios.
- Prefer semantic attributes over style class names in tests.
- For theme-dependent segmented controls, keep selected labels on an explicit contrast token and verify light and dark states.
- Remove unused custom CSS utilities and keyframes when templates no longer reference them.

## Frontend testing policy

Protect boundaries and workflows that silently break: API/runtime validation, unsafe URL handling, create-check requests, SSE/poll fallback, refresh-safe persisted input, settings persistence, and core flows.

Prefer user-observable behavior and boundary effects. Avoid assertions on Tailwind class strings, copy-only details, fixture contents, or DOM structure unless guarding a known regression.

Do not chase one-test-per-component or coverage targets while the product surface is moving. Presentational components and visual polish are usually manual-review or future browser-smoke territory; if a page test needs deep router/env/composable/fixture mocking, prefer a smaller composable/API test.

## Frontend documentation rule

Frontend code has fewer inline comments than the backend, so cross-file behavior belongs in docs. If a change spans routes, pages, composables, stores, API clients, theme tokens, or dev tooling — and the behavior cannot be understood from one file — update the matching frontend architecture, convention, or dev-tooling doc. Use code comments for local tricky implementation only; put product semantics and cross-module contracts in documentation.
