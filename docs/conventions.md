# Conventions

## Bun Runtime

Default to Bun instead of Node.js.

- Use `bun <file>` instead of `node <file>` or `ts-node <file>`
- Use `bun test` instead of `jest` or `vitest`
- Use `bun build <file>` instead of `webpack` or `esbuild`
- Use `bun install` instead of `npm install` / `yarn install` / `pnpm install`
- Use `bun run <script>` instead of `npm run <script>` / `yarn` / `pnpm`
- Use `bunx <package>` instead of `npx <package>`
- Bun automatically loads `.env` — don't use dotenv.

### Bun APIs

- `Bun.serve()` for HTTP/WebSockets/HTTPS. Don't use express.
- `bun:sqlite` for SQLite. Don't use better-sqlite3.
- `Bun.redis` for Redis. Don't use ioredis.
- `Bun.sql` for Postgres. Don't use pg or postgres.js.
- `WebSocket` is built-in. Don't use ws.
- Prefer `Bun.file` over `node:fs` readFile/writeFile.
- `Bun.$` `` ` `` instead of execa.

### Bun Testing

```ts
import { test, expect } from "bun:test";

test("hello world", () => {
  expect(1).toBe(1);
});
```

## Frontend Quality Tooling

The frontend in `apps/web` follows the `create-vue` tooling baseline. Project-specific changes should stay small, explicit, and documented here.

### Tooling baseline

| Concern | Tool | Role |
|---|---|---|
| Type checking | `vue-tsc` | TypeScript checks with Vue SFC support. |
| Vue linting | `eslint` + `eslint-plugin-vue` | Vue `<template>` and `<script>` correctness beyond TypeScript. |
| Fast lint pass | `oxlint` | Fast correctness-oriented lint pass before ESLint. |
| Formatting | `prettier` | Owns code formatting. ESLint formatting rules are disabled. |
| Unit tests | `vitest` + `@vue/test-utils` | Vue component tests using the same Vite transform pipeline. |

### TrustTrace differences from create-vue

- Bun workspaces: root scripts delegate into `apps/web` with `bun run --cwd apps/web ...`.
- Test files: `*.test.ts` or `*.spec.ts` under `apps/web/src` (not `__tests__/`).
- Tailwind CSS v4: enabled through `@tailwindcss/vite` and `@import "tailwindcss"` in `src/style.css`.
- `prettier-plugin-tailwindcss` with `tailwindStylesheet: "./src/style.css"` for theme-aware class sorting.
- `eslint.config.mjs` kept as JavaScript to avoid adding `jiti` for config loading.

### Naming

- Use `camelCase` for TypeScript identifiers and app-owned JSON/API payload fields.
- Keep framework/configuration conventions where required (for example Vite environment variables and TypeScript config paths).
- Name shared app-level UI primitives with the `Base*` prefix (for example `BaseTagBadge` and `BasePageFooter`).
- Keep check feature type boundaries explicit: API DTOs, events, progress, evidence, list items, and result ViewModels live in focused files under `features/checks/types/`.
- Validate backend JSON at the frontend API boundary with Zod before mapping it into check feature types. Keep these schemas in `apps/web` until the backend DTOs are stable enough to extract into a shared `packages/contracts` package.
- CSS naming follows the utility-first rules below.

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

`bun run check` runs the full local quality gate:

1. `format:check`
2. `lint`
3. `test`
4. `build` (includes `typecheck` before `vite build`)

Use `bun run test`, not bare `bun test` — the repository has archived code under `archive/` and Bun's test runner would scan too broadly.

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
```

### VS Code workspace

`create-vue` workspace workflow: Explorer file nesting, Prettier as default formatter, format-on-save. Recommended extensions in `.vscode/extensions.json`. `.editorconfig` + `.gitattributes` for consistent editor and line-ending behavior.

### Rules of thumb

- Keep formatting and linting separate: Prettier formats; ESLint catches code-quality and Vue issues.
- Keep `eslint-plugin-vue` even with Oxlint — Vue template-aware checks still belong to ESLint.
- Put frontend dependencies in `apps/web/package.json`; root scripts only orchestrate workspaces.
- Prefer the default `create-vue` shape unless a TrustTrace-specific difference is documented here.
- For theme-dependent segmented controls, keep selected labels on an explicit contrast token and verify both light and dark mode states.
