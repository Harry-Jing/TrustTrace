/**
 * DEV ONLY — Named mock scenarios.
 *
 * Five recipes covering the variants worth previewing in dev:
 * one happy path, one instant happy path, three distinct failure modes.
 * Anything more granular (slow/fast playback, "stuck at phase X") is reachable
 * by clicking the per-phase buttons in DevLoadingControls — keeping the
 * scenario list flat and short.
 */

import { ACTIVE_PHASES } from "@/features/checks/constants/checkProgress";
import type { ActiveCheckPhase, CheckApiError, CheckPhase } from "@/features/checks/types";

export interface DevScenarioStep {
  readonly phase: CheckPhase;
  readonly percent: number;
  readonly message: string;
}

export type DevScenarioOutcome =
  | { readonly type: "completed" }
  | {
      readonly type: "failed";
      readonly error: Omit<CheckApiError, "occurredAt" | "traceId"> & {
        readonly traceIdSeed: string;
      };
    };

export interface DevScenario {
  readonly id: string;
  readonly label: string;
  readonly description: string;
  readonly stepDelayMs: number;
  readonly steps: readonly DevScenarioStep[];
  readonly outcome: DevScenarioOutcome;
}

const NORMAL_DELAY_MS = 700;

const SUCCESS_PERCENTS: Record<ActiveCheckPhase, number> = {
  understanding: 8,
  strategy: 22,
  discovery: 42,
  verify_read: 62,
  weigh: 80,
  verdict: 94,
};

const SUCCESS_MESSAGES: Record<ActiveCheckPhase, string> = {
  understanding: "Reading the input and parsing it into checkable claims.",
  strategy: "Picking source priorities and drafting queries.",
  discovery: "Searching trusted sources for this claim.",
  verify_read: "Verifying URLs and pulling article bodies.",
  weigh: "Sorting and reading each verified source.",
  verdict: "Composing the explanation from verified evidence.",
};

function fullProgress(): readonly DevScenarioStep[] {
  return [
    ...ACTIVE_PHASES.map((phase) => ({
      phase,
      percent: SUCCESS_PERCENTS[phase],
      message: SUCCESS_MESSAGES[phase],
    })),
    { phase: "completed", percent: 100, message: "Check complete." },
  ];
}

function progressUpTo(stopAt: ActiveCheckPhase): readonly DevScenarioStep[] {
  const stopIndex = ACTIVE_PHASES.indexOf(stopAt);
  return ACTIVE_PHASES.slice(0, stopIndex + 1).map((phase) => ({
    phase,
    percent: SUCCESS_PERCENTS[phase],
    message: SUCCESS_MESSAGES[phase],
  }));
}

export const DEV_SCENARIOS = [
  {
    id: "success",
    label: "Success",
    description: "Plays the full pipeline and lands on the result page.",
    stepDelayMs: NORMAL_DELAY_MS,
    steps: fullProgress(),
    outcome: { type: "completed" },
  },
  {
    id: "success.instant",
    label: "Success · instant",
    description: "Skips straight to a completed result. Fastest way to inspect the result page.",
    stepDelayMs: 0,
    steps: [{ phase: "completed", percent: 100, message: "Check complete." }],
    outcome: { type: "completed" },
  },
  {
    id: "error.timeout",
    label: "Error · provider timeout",
    description: "Fails at the discovery phase with PROVIDER_TIMEOUT (retryable).",
    stepDelayMs: NORMAL_DELAY_MS,
    steps: progressUpTo("discovery"),
    outcome: {
      type: "failed",
      error: {
        code: "PROVIDER_TIMEOUT",
        category: "provider timeout",
        message: "The discovery provider took too long to respond.",
        retryable: true,
        traceIdSeed: "timeout",
      },
    },
  },
  {
    id: "error.input_extraction",
    label: "Error · URL unreachable",
    description: "Fails at understanding with INPUT_EXTRACTION_FAILED (retryable).",
    stepDelayMs: 0,
    steps: [],
    outcome: {
      type: "failed",
      error: {
        code: "INPUT_EXTRACTION_FAILED",
        category: "input extraction",
        message: "The submitted URL could not be safely fetched and extracted: connect ETIMEDOUT.",
        retryable: true,
        traceIdSeed: "extraction",
      },
    },
  },
  {
    id: "error.provider_config",
    label: "Error · provider misconfigured",
    description: "Fails immediately with PROVIDER_CONFIGURATION_ERROR (non-retryable).",
    stepDelayMs: 0,
    steps: [],
    outcome: {
      type: "failed",
      error: {
        code: "PROVIDER_CONFIGURATION_ERROR",
        category: "provider configuration",
        message: "OpenAI credentials are missing on the server.",
        retryable: false,
        traceIdSeed: "config",
      },
    },
  },
] as const satisfies readonly DevScenario[];

export const DEFAULT_SCENARIO_ID = "success" as const;

export type DevScenarioId = (typeof DEV_SCENARIOS)[number]["id"];

const SCENARIO_BY_ID: Record<string, DevScenario> = Object.fromEntries(
  DEV_SCENARIOS.map((scenario) => [scenario.id, scenario]),
);

const DEFAULT_SCENARIO: DevScenario =
  DEV_SCENARIOS.find((scenario) => scenario.id === DEFAULT_SCENARIO_ID) ?? DEV_SCENARIOS[0];

export function isDevScenarioId(value: unknown): value is DevScenarioId {
  return typeof value === "string" && value in SCENARIO_BY_ID;
}

export function getScenario(id: string): DevScenario {
  return SCENARIO_BY_ID[id] ?? DEFAULT_SCENARIO;
}

/**
 * Per-phase percent + message lookup for the active scenario. Lets manual
 * phase clicks in DevLoadingControls show the same numbers the auto-played
 * stream emits, so jumping back and forth feels coherent.
 */
export function buildPhaseLookup(
  scenario: DevScenario,
): Record<ActiveCheckPhase, { percent: number; message: string }> {
  const lookup = {} as Record<ActiveCheckPhase, { percent: number; message: string }>;
  for (const phase of ACTIVE_PHASES) {
    lookup[phase] = { percent: SUCCESS_PERCENTS[phase], message: SUCCESS_MESSAGES[phase] };
  }
  for (const step of scenario.steps) {
    if (step.phase === "completed" || step.phase === "failed") continue;
    lookup[step.phase] = { percent: step.percent, message: step.message };
  }
  return lookup;
}
