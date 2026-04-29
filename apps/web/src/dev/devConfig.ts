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
} as const;

export const DEV_QUERY_PARAMS = {
  scenario: "scenario",
} as const;
