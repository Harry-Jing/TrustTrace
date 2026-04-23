# Dev Tooling

Dev tooling is only active when `import.meta.env.DEV` is true (i.e. running `bun run dev`). It is completely absent from production builds.

## Components

All dev-only components live in `apps/web/src/app/` and are prefixed with `Dev`:

| Component | Purpose |
|---|---|
| `DevNav.vue` | Floating action button (FAB) in the bottom-right corner. Opens a menu to jump between the 5 demo pages. Resets demo check progress when navigating to the loading page. |
| `DevLoadingControls.vue` | Phase switcher rendered inside `ProgressTimeline` via slot. Allows manually stepping through loading phases and triggering the completion flow. |

`DevNav` is mounted in `AppShell.vue` behind an `isDevMode` guard. `DevLoadingControls` is rendered in `CheckLoadingPage.vue` behind the same guard.

## Behavior changes in dev mode

| Area | Dev behavior | Production behavior |
|---|---|---|
| Loading page auto-redirect | Disabled. Stays on loading page so each phase can be inspected. | Automatically redirects to result or error when the check completes or fails. |
| Loading page completion | Must click "done" in the dev controls to trigger the celebration animation and redirect. | Triggered automatically by the status watcher. |
| Demo check reset | `DevNav` calls `devResetCheckProgress()` before navigating to the loading page, resetting the mock check to its initial `accepted` phase. | Not applicable — real API data drives progress. |
| Shorthand routes | `/loading`, `/result`, `/error` redirect to the demo check's corresponding pages. | These routes do not exist. Only `/checks/:checkId/*` routes are registered. |

## API layer

`checksApi.ts` exposes one dev-only function:

- `devResetCheckProgress(checkId)` — Resets a mock check record to its initial `accepted` phase so the loading page can be inspected from the beginning.

## Composable

`useCheckProgress.ts` exposes one dev-only method:

- `setPhase(phase)` — Manually overrides the current check phase with a synthetic progress object. Used by `DevLoadingControls` to step through phases.

Both are annotated with `/** DEV ONLY */` JSDoc comments in the source.

## Guard pattern

All dev code is gated by the `isDevMode` constant from `apps/web/src/app/env.ts`:

```ts
export const isDevMode = import.meta.env.DEV
```

Vite statically replaces `import.meta.env.DEV` with `false` in production builds, so dead-code elimination removes all dev-only branches and components from the final bundle.
