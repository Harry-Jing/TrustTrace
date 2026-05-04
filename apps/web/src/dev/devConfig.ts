/**
 * DEV ONLY — Single source of truth for dev-tooling configuration.
 *
 * Imports of this module must always sit behind `showDevTools` so that the
 * dev fixtures and scenario registry can be tree-shaken from production
 * bundles via `import.meta.env.DEV`.
 */

export { DEMO_CHECK_ID as PRIMARY_DEMO_CHECK_ID } from "@/features/checks/fixtures/demoChecks";

export const DEV_STORAGE_KEYS = {
  scenario: "tt-dev-scenario",
  panelOpen: "tt-dev-panel-open",
  demoCheckId: "tt-dev-demo-check-id",
  collapsedSections: "tt-dev-collapsed-sections",
} as const;

/**
 * Section keys for the DevPanel's collapsible regions. Persisted as a
 * comma-joined string in `localStorage[DEV_STORAGE_KEYS.collapsedSections]`.
 * Default open state is chosen so the two pickers (scenario + claim) stay
 * visible and the two action rows (jump / state) start collapsed — common
 * inspection flows don't need them.
 */
export const DEV_PANEL_SECTIONS = ["scenario", "claim", "jump", "state"] as const;
export type DevPanelSection = (typeof DEV_PANEL_SECTIONS)[number];

export const DEFAULT_COLLAPSED_SECTIONS: ReadonlySet<DevPanelSection> = new Set<DevPanelSection>([
  "jump",
  "state",
]);

export const DEV_QUERY_PARAMS = {
  scenario: "scenario",
} as const;
