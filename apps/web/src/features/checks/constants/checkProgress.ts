import type { ActiveCheckPhase, CheckPhase } from "@/features/checks/types";

export const CHECK_PHASES = [
  "understanding",
  "strategy",
  "discovery",
  "verify_read",
  "weigh",
  "verdict",
  "completed",
] as const satisfies readonly CheckPhase[];

export const ACTIVE_PHASES = [
  "understanding",
  "strategy",
  "discovery",
  "verify_read",
  "weigh",
  "verdict",
] as const satisfies readonly ActiveCheckPhase[];

export interface PhaseDefinition {
  key: ActiveCheckPhase;
  step: number;
  shortLabel: string;
  nowLabel: string;
  title: string;
  description: string;
}

export const PHASE_DEFINITIONS: Record<ActiveCheckPhase, PhaseDefinition> = {
  understanding: {
    key: "understanding",
    step: 1,
    shortLabel: "Understanding",
    nowLabel: "understanding",
    title: "Reading the claim.",
    description: "Reading the input and turning it into one or more checkable claims.",
  },
  strategy: {
    key: "strategy",
    step: 2,
    shortLabel: "Strategy",
    nowLabel: "strategy",
    title: "Picking how to check it.",
    description: "Choosing which kinds of sources matter most for this kind of claim.",
  },
  discovery: {
    key: "discovery",
    step: 3,
    shortLabel: "Discovery",
    nowLabel: "discovery",
    title: "Looking for sources.",
    description:
      "Searching for primary, official, and independent sources, plus anything that disagrees.",
  },
  verify_read: {
    key: "verify_read",
    step: 4,
    shortLabel: "Verify & read",
    nowLabel: "verify & read",
    title: "Verifying and reading each source.",
    description: "Checking each URL is real and reading the article body — not just the snippet.",
  },
  weigh: {
    key: "weigh",
    step: 5,
    shortLabel: "Weigh",
    nowLabel: "weigh",
    title: "Weighing the evidence.",
    description:
      "Reading each verified source to see whether it supports or contradicts the claim.",
  },
  verdict: {
    key: "verdict",
    step: 6,
    shortLabel: "Verdict",
    nowLabel: "verdict",
    title: "Writing the verdict.",
    description: "Composing the verdict only from sources that passed verification.",
  },
};
