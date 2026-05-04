/**
 * DEV ONLY — Pinia-free helpers for reading/writing the active scenario.
 *
 * The mock client and the dev store both need to know the active scenario,
 * but the mock client should not depend on Pinia. This module owns the
 * URL+localStorage truth; the dev store keeps a reactive copy on top.
 */

import { DEV_QUERY_PARAMS, DEV_STORAGE_KEYS } from "@/dev/devConfig";
import {
  DEFAULT_SCENARIO_ID,
  type DevScenario,
  type DevScenarioId,
  getScenario,
  isDevScenarioId,
} from "@/dev/scenarios";

export function readUrlScenarioId(): DevScenarioId | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const value = params.get(DEV_QUERY_PARAMS.scenario);
  return isDevScenarioId(value) ? value : null;
}

export function readStoredScenarioId(): DevScenarioId | null {
  if (typeof localStorage === "undefined") return null;
  const stored = localStorage.getItem(DEV_STORAGE_KEYS.scenario);
  return isDevScenarioId(stored) ? stored : null;
}

export function persistScenarioId(id: DevScenarioId) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(DEV_STORAGE_KEYS.scenario, id);
}

export function syncUrlScenarioId(id: DevScenarioId) {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  if (url.searchParams.get(DEV_QUERY_PARAMS.scenario) === id) return;
  url.searchParams.set(DEV_QUERY_PARAMS.scenario, id);
  window.history.replaceState(window.history.state, "", url.toString());
}

/** Best-effort read used by the mock client where Pinia may not be active. */
export function readActiveScenarioId(): DevScenarioId {
  return readUrlScenarioId() ?? readStoredScenarioId() ?? DEFAULT_SCENARIO_ID;
}

export function readActiveScenario(): DevScenario {
  return getScenario(readActiveScenarioId());
}
