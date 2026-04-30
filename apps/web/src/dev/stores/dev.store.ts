/**
 * DEV ONLY — Pinia store for the dev tooling layer.
 *
 * Holds the active scenario id (persisted to localStorage and seedable from
 * the `?scenario=` URL parameter on first load), an "is the panel open"
 * flag, the active demo claim id, and which collapsible sections inside the
 * panel are collapsed. All four pieces persist so the dev's preferred view
 * survives reloads.
 */

import { defineStore } from "pinia";

import {
  DEFAULT_COLLAPSED_SECTIONS,
  DEV_PANEL_SECTIONS,
  type DevPanelSection,
  DEV_STORAGE_KEYS,
  PRIMARY_DEMO_CHECK_ID,
} from "@/dev/devConfig";
import { DEFAULT_SCENARIO_ID, type DevScenarioId, getScenario } from "@/dev/scenarios";
import {
  persistScenarioId,
  readStoredScenarioId,
  readUrlScenarioId,
  syncUrlScenarioId,
} from "@/dev/scenarioState";
import { DEMO_CHECK_IDS } from "@/features/checks/fixtures/demoChecks";

function readPanelOpen(): boolean {
  if (typeof localStorage === "undefined") return false;
  return localStorage.getItem(DEV_STORAGE_KEYS.panelOpen) === "1";
}

function persistPanelOpen(open: boolean) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(DEV_STORAGE_KEYS.panelOpen, open ? "1" : "0");
}

function readDemoCheckId(): string {
  if (typeof localStorage === "undefined") return PRIMARY_DEMO_CHECK_ID;
  const stored = localStorage.getItem(DEV_STORAGE_KEYS.demoCheckId);
  return stored && DEMO_CHECK_IDS.has(stored) ? stored : PRIMARY_DEMO_CHECK_ID;
}

function persistDemoCheckId(id: string) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(DEV_STORAGE_KEYS.demoCheckId, id);
}

function isDevPanelSection(value: string): value is DevPanelSection {
  return (DEV_PANEL_SECTIONS as readonly string[]).includes(value);
}

function readCollapsedSections(): Set<DevPanelSection> {
  if (typeof localStorage === "undefined") return new Set(DEFAULT_COLLAPSED_SECTIONS);
  const stored = localStorage.getItem(DEV_STORAGE_KEYS.collapsedSections);
  if (stored === null) return new Set(DEFAULT_COLLAPSED_SECTIONS);
  const parsed = stored
    .split(",")
    .map((part) => part.trim())
    .filter(isDevPanelSection);
  return new Set(parsed);
}

function persistCollapsedSections(sections: ReadonlySet<DevPanelSection>) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(DEV_STORAGE_KEYS.collapsedSections, [...sections].join(","));
}

interface DevState {
  scenarioId: DevScenarioId;
  panelOpen: boolean;
  demoCheckId: string;
  collapsedSections: Set<DevPanelSection>;
}

export const useDevStore = defineStore("dev", {
  state: (): DevState => ({
    scenarioId: readUrlScenarioId() ?? readStoredScenarioId() ?? DEFAULT_SCENARIO_ID,
    panelOpen: readPanelOpen(),
    demoCheckId: readDemoCheckId(),
    collapsedSections: readCollapsedSections(),
  }),
  getters: {
    scenario: (state) => getScenario(state.scenarioId),
    isSectionCollapsed:
      (state) =>
      (section: DevPanelSection): boolean =>
        state.collapsedSections.has(section),
  },
  actions: {
    setScenario(id: DevScenarioId) {
      this.scenarioId = id;
      persistScenarioId(id);
      syncUrlScenarioId(id);
    },
    setDemoCheckId(id: string) {
      if (!DEMO_CHECK_IDS.has(id)) return;
      this.demoCheckId = id;
      persistDemoCheckId(id);
    },
    openPanel() {
      this.panelOpen = true;
      persistPanelOpen(true);
    },
    closePanel() {
      this.panelOpen = false;
      persistPanelOpen(false);
    },
    togglePanel() {
      this.panelOpen = !this.panelOpen;
      persistPanelOpen(this.panelOpen);
    },
    toggleSection(section: DevPanelSection) {
      const next = new Set(this.collapsedSections);
      if (next.has(section)) next.delete(section);
      else next.add(section);
      this.collapsedSections = next;
      persistCollapsedSections(next);
    },
  },
});
