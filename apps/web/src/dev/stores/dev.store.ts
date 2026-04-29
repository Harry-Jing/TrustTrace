/**
 * DEV ONLY — Pinia store for the dev tooling layer.
 *
 * Holds the active scenario id (persisted to localStorage and seedable from
 * the `?scenario=` URL parameter on first load) plus a "is the panel open"
 * flag, also persisted so the dev's preferred view sticks across reloads.
 */

import { defineStore } from "pinia";

import { DEV_STORAGE_KEYS } from "@/dev/devConfig";
import { DEFAULT_SCENARIO_ID, type DevScenarioId, getScenario } from "@/dev/scenarios";
import {
  persistScenarioId,
  readStoredScenarioId,
  readUrlScenarioId,
  syncUrlScenarioId,
} from "@/dev/scenarioState";

function readPanelOpen(): boolean {
  if (typeof localStorage === "undefined") return false;
  return localStorage.getItem(DEV_STORAGE_KEYS.panelOpen) === "1";
}

function persistPanelOpen(open: boolean) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(DEV_STORAGE_KEYS.panelOpen, open ? "1" : "0");
}

interface DevState {
  scenarioId: DevScenarioId;
  panelOpen: boolean;
}

export const useDevStore = defineStore("dev", {
  state: (): DevState => ({
    scenarioId: readUrlScenarioId() ?? readStoredScenarioId() ?? DEFAULT_SCENARIO_ID,
    panelOpen: readPanelOpen(),
  }),
  getters: {
    scenario: (state) => getScenario(state.scenarioId),
  },
  actions: {
    setScenario(id: DevScenarioId) {
      this.scenarioId = id;
      persistScenarioId(id);
      syncUrlScenarioId(id);
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
  },
});
