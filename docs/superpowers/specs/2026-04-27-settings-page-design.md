# Settings page — design spec

Status: approved for implementation
Owner: web (`apps/web`)
Date: 2026-04-27

## Goal

Add a `/settings` page so users can:

1. Pick the discovery strategy (`search_api` vs `llm_web`) used for new checks. (live)
2. Choose theme: light, dark, or auto (follows system). (live)
3. Toggle the "save check history locally" preference. (stored, not yet behavior-gated)
4. See app version, build date, tagline. (live)

Bring-your-own keys, search depth, and reasoning rigor are visible in the UI as **disabled placeholders** with a "Coming soon" pill, matching Option B from brainstorming. The design intentionally signals what the product will support without pretending to wire features that don't exist yet.

## Why

- The backend already accepts `discoveryStrategy` on `POST /v1/checks` and the contract requires it. The frontend currently omits it, which is a real bug. The settings page is the natural place to fix that gap and surface the choice to users.
- The roadmap's deferred history-strategy decision blocks a fully-wired "save locally" toggle, but the preference itself can be persisted now so we don't need a follow-up migration when history strategy lands.
- Theme toggle in the header is binary; the screenshot's three-state Light / Dark / Auto adds a small but expected affordance.

## Non-goals

- Per-check overrides of discovery strategy on the home page.
- BYOK key storage, validation, or transmission.
- Search-depth or reasoning-rigor parameters in the create-check API.
- Server-side history purge when local history is disabled.
- Build-info pulled from CI metadata; date stamping at build time is enough.

## User-facing entry point

`AppNav` gains a new gear icon button placed between the theme toggle and the contextual right-side button. It routes to `/settings`. While on `/settings` the right-side contextual button shows "Done" and routes back to landing. No status badge appears in the center on the settings page (consistent with `/history`).

## Routing

New route in [router/index.ts](apps/web/src/router/index.ts):

```
{
  path: "settings",
  name: "settings",
  meta: { depth: 1, title: "Settings" },
  component: () => import("@/features/settings/pages/SettingsPage.vue"),
}
```

`depth: 1` matches `/history` so the page transition behaves like a sibling navigation.

## Preferences store

Extend [stores/preferences.store.ts](apps/web/src/stores/preferences.store.ts) with three additional persisted keys. All keys use the `tt-` prefix:

| Key                  | Type                          | Default        | localStorage key          |
| -------------------- | ----------------------------- | -------------- | ------------------------- |
| `theme`              | `"light" \| "dark" \| "auto"` | `"light"`      | `tt-theme` (existing)     |
| `discoveryStrategy`  | `"search_api" \| "llm_web"`   | `"search_api"` | `tt-discovery-strategy`   |
| `saveHistoryLocally` | `boolean`                     | `true`         | `tt-save-history-locally` |

### Theme — adding `auto`

The `Theme` type widens to `"light" | "dark" | "auto"`. `applyTheme()` resolves auto → effective theme via `window.matchMedia("(prefers-color-scheme: dark)")`. The store registers a media-query change listener once at app boot (added to `applyTheme`'s sibling `initTheme` action, called from `main.ts` like `applyTheme()` is today). When the user is in auto mode and the OS theme changes, the listener calls `applyTheme()` again. Listeners are not torn down — settings runs for the lifetime of the page.

`Theme` constant in `types/app.ts` widens. All existing call sites (`AppNav` toggle button) stay valid because they only check `theme !== "dark"`; that comparison still works (auto + light system → renders sun icon, auto + dark system → still renders sun, since the explicit theme value is "auto"). The header toggle keeps its existing two-state behavior — clicking it cycles light ↔ dark, never lands on auto. Auto is reachable only from the settings page. This keeps the header simple and matches the screenshot.

### Validation on read

`readStoredValue` already validates against the type guard. New guards are added for the discovery strategy and a `parseBoolean` helper for the toggle. Invalid stored values fall back to defaults silently (no console warning — these are user-private prefs).

## Create-check wiring (the bug fix)

[backendChecksClient.ts:107-119](apps/web/src/features/checks/api/backendChecksClient.ts) currently sends `{ input }` without `discoveryStrategy`. Change:

```ts
// before
export async function createCheck(input: CheckInputDraft): Promise<CreateCheckResponse> {
  ...
  body: JSON.stringify({ input: { type: input.mode, content: input.value } }),
  ...
}

// after
export async function createCheck(
  input: CheckInputDraft,
  discoveryStrategy: DiscoveryStrategy,
): Promise<CreateCheckResponse> {
  ...
  body: JSON.stringify({
    input: { type: input.mode, content: input.value },
    discoveryStrategy,
  }),
  ...
}
```

[checksApi.ts](apps/web/src/features/checks/api/checksApi.ts) and [mockChecksClient.ts](apps/web/src/features/checks/api/mockChecksClient.ts) get the same signature change. The mock records `discoveryStrategy` on the in-memory record (it currently hard-codes `"search_api"`).

[useCreateCheck.ts](apps/web/src/features/checks/composables/useCreateCheck.ts) reads the strategy from `usePreferencesStore`:

```ts
const preferences = usePreferencesStore();
async function createCheck(input: CheckInputDraft) {
  const response = await createCheckRequest(input, preferences.discoveryStrategy);
  ...
}
```

Existing tests for `useCreateCheck` and `backendChecksClient` get updated to assert the new request body shape.

## Build metadata

Add to [vite.config.ts](apps/web/vite.config.ts):

```ts
define: {
  __APP_VERSION__: JSON.stringify(pkg.version),
  __APP_BUILD_DATE__: JSON.stringify(new Date().toISOString().slice(0, 10)),
}
```

`pkg` is read via `import pkg from "./package.json" with { type: "json" }` at the top of `vite.config.ts`. A `vite-env.d.ts` augmentation declares `__APP_VERSION__` and `__APP_BUILD_DATE__` as `string` constants. The settings page imports them via a thin module:

```ts
// apps/web/src/features/settings/constants/meta.ts
export const APP_VERSION = __APP_VERSION__;
export const APP_BUILD_DATE = __APP_BUILD_DATE__;
export const APP_TAGLINE = "evidence-first credibility";
export const APP_BUILD_LABEL = "trace";
```

The version label rendered in the About section also includes a "mvp" pill matching the screenshot. The pill text is a static constant for now.

## Page composition

```
SettingsPage.vue
├── header block
│     ├── eyebrow: "settings · trusttrace"  (mono uppercase, accent)
│     ├── h1 (Newsreader): "Tune how TrustTrace looks for evidence."
│     └── subtitle (ink-2): "Defaults work for most claims. Open a section
│                             to adjust how sources are discovered and
│                             what the trace shows you."
└── two-column grid (lg+: 180px sidebar | content; below lg: stacked)
      ├── SettingsSidebar
      │     scroll-spies the active section as the user scrolls; clicking
      │     scrolls smoothly to the section. Sticky inside the column.
      └── content
            SettingsSection (Discovery, live)
              SettingsRow "Discovery strategy"
                two SettingsRadioCard side-by-side
              SettingsRow "Search depth" (disabled, "Coming soon")
                SettingsRangeSlider
              SettingsRow "Reasoning rigor" (disabled, "Coming soon")
                SettingsSegmented (Fast / Balanced / Strict)

            SettingsSection (Keys, all-disabled, "Coming soon" badge in header)
              note row: "Bring-your-own keys aren't wired yet — TrustTrace
                          uses server-side credentials in this build."
              SettingsRow "Search provider"
                disabled select + masked input
              SettingsRow "LLM provider"
                disabled select + masked input
              The provider is "OpenAI", not "Anthropic Claude", because
              that matches the actual backend.

            SettingsSection (Appearance, live)
              SettingsRow "Theme"
                SettingsSegmented (Light / Dark / Auto)

            SettingsSection (Privacy, live)
              SettingsRow "Save check history locally"
                SettingsToggle bound to preferences.saveHistoryLocally
              caveat note: "History strategy is still being finalized — this
                            preference is remembered but doesn't yet purge
                            server-side records."

            SettingsSection (About, live, static)
              SettingsRow "Version" → "<APP_VERSION> · mvp"
              SettingsRow "Build" → "<APP_BUILD_LABEL> · <APP_BUILD_DATE>"
              SettingsRow "Tagline" → "<APP_TAGLINE>"
                helper: "Shown at the foot of every check."

      BasePageFooter "TrustTrace · evidence-first credibility"
```

## Components

All new files live under `apps/web/src/features/settings/`.

### SettingsPage.vue

Top-level page. Owns the section anchor IDs, scroll-spy state, and binds form state to the preferences store via direct mutations (`preferences.setTheme`, `preferences.setDiscoveryStrategy`, `preferences.setSaveHistoryLocally`).

### SettingsSidebar.vue

- Props: `sections: { id: string; label: string }[]`, `activeId: string`.
- Emits `select` with the section id when a link is clicked.
- Uses `<a :href="'#' + section.id">` so it remains accessible to keyboard users; click handler `preventDefault()`s and emits to parent for smooth scroll. Keyboard activation works via the link's default behavior on Enter (jump-scroll without animation), which is acceptable.
- Active link: `text-ink font-medium`; inactive: `text-muted hover:text-ink`. Left border indicator on active.

### SettingsSection.vue

- Slots: default (rows), `header-extra` (right-aligned badge slot used for "Coming soon").
- Props: `id`, `eyebrow`, `title`, `description`, `disabled?: boolean`.
- When `disabled`, applies `opacity-60 pointer-events-none` to the slot wrapper and exposes an `aria-disabled="true"` on the inner section. The header (eyebrow + title + description) stays full-opacity so the user can still read what the section is for.
- Adds a top hairline divider between sections (`border-t border-line`) except for the first.

### SettingsRow.vue

- Slots: default (control), `label`, `helper`, `header-extra`.
- Props: `label: string`, `helper?: string`, `comingSoon?: boolean`, `disabled?: boolean`.
- Layout: two-column on `md+`: label/helper on the left, control on the right; stacked on small. Uses `border-b border-line pb-5 mb-5` for inter-row separation, dropped on the last row.
- "Coming soon" pill is a `BaseTagBadge tone="default"` placed in the header-extra position when `comingSoon` is true.

### SettingsRadioCard.vue

- Props: `value: T`, `modelValue: T`, `label: string` (mono code-style), `headline: string` (Newsreader), `description: string`, `badge?: { tone: BadgeTone; label: string }`, `disabled?: boolean`.
- Emits `update:modelValue`.
- Renders as a `<label>` so the entire card is clickable. Hidden native radio for keyboard/a11y. Visible radio dot rendered in CSS.
- Selected state: `border-ink shadow-input-rest bg-accent-fade`.
- Unselected: `border-line bg-card`.
- Hover (when not disabled): `border-line-strong`.

### SettingsSegmented.vue

- Props: `options: { value: T; label: string }[]`, `modelValue: T`, `disabled?: boolean`, `ariaLabel: string`.
- Same sliding-pill mechanic as `ClaimInputCard`'s mode toggle (relative isolate + absolute positioned indicator + transition `left`). Selected option text is `text-surface`, others are `text-muted`.

### SettingsToggle.vue

- Props: `modelValue: boolean`, `disabled?: boolean`, `ariaLabel: string`.
- Standard switch with translate-x animation on the thumb. Track color: `bg-ink` when on, `bg-line-strong` when off.
- Touch target: 48×28 to keep the 44px minimum.

### SettingsRangeSlider.vue

- Props: `min`, `max`, `value`, `unit?: string`, `disabled?: boolean`.
- Used disabled-only in this iteration. Native `<input type="range">` styled to match the screenshot (track + thumb), with the bar-chart histogram below as a non-interactive decorative `<svg>` (5 grouped bar columns). Histogram renders as static SVG so we don't take a chart library dep just for a placeholder.

### Disabled-section rendering rules

- `aria-disabled="true"` on the section root.
- Form controls within receive `disabled` attribute and `tabindex="-1"`.
- All visible text keeps full color contrast — the disabled affordance is the "Coming soon" pill plus the explanatory note row, not a global opacity blur. (We use `opacity-60` only on the controls' container, not the headings.)

## State flow

```
SettingsPage
   │
   ├── reads preferences.theme, preferences.discoveryStrategy, preferences.saveHistoryLocally
   │
   ├── on user input → calls preferences.setTheme/setDiscoveryStrategy/setSaveHistoryLocally
   │       │
   │       └─ store writes to localStorage and (for theme) re-applies data-theme
   │
   └── store changes are reactive → next call to useCreateCheck picks up new strategy
```

The home page's `useCreateCheck` reads the strategy fresh from the store at submit time, so no extra synchronization is needed.

## Tests

Add or update:

- [stores/preferences.store.test.ts](apps/web/src/stores/preferences.store.test.ts) (new): default values; light/dark/auto theme application; auto resolves to dark when `matchMedia` returns dark; persisted prefs round-trip through localStorage; invalid stored values fall back to defaults.
- [composables/useCreateCheck.test.ts](apps/web/src/features/checks/composables/useCreateCheck.test.ts) (update): asserts the underlying `createCheckRequest` is called with the strategy from the store.
- [api/backendChecksClient.test.ts](apps/web/src/features/checks/api/backendChecksClient.test.ts) (update): assert the request body now includes `discoveryStrategy`.
- [features/settings/pages/SettingsPage.test.ts](apps/web/src/features/settings/pages/SettingsPage.test.ts) (new): smoke test that all five sections render; toggling theme calls the store action; clicking a discovery card calls the action; keys section is `aria-disabled`.

Existing tests that build a fake `createCheck` response need to include `discoveryStrategy: "search_api"` to satisfy the contract schema in [backendCheckSchemas.ts](apps/web/src/features/checks/api/backendCheckSchemas.ts).

## Accessibility

- All form controls have visible labels via `SettingsRow`.
- Disabled controls retain text-color contrast; the "disabled" affordance is the "Coming soon" pill and `aria-disabled`, not low contrast.
- Sidebar links use real anchors; scroll-spy is a progressive enhancement.
- Sliding-pill segmented controls expose the active option via `aria-pressed`.
- Theme toggle in `AppNav` keeps its existing `aria-label="Toggle theme"`.

## Reduced motion

The existing global `prefers-reduced-motion` media query in [style.css](apps/web/src/style.css) caps animations to ~0ms, so the segmented-control sliding indicator and any new transitions inherit the same reduction without per-component handling.

## Open follow-ups (not blocking this work)

- Wire `saveHistoryLocally` to actual history filtering once the history-storage strategy is decided (roadmap item #12).
- Replace disabled placeholders with real implementations as the API grows (BYOK keys, search depth, reasoning rigor).
- Consider adding `discoveryStrategy: "search_api"` to all existing test fixtures in `mockChecksClient` rather than only on the create path.
