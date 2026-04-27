import type { EvidenceItemDto, VerdictBand } from "../types/results";

export function verdictLabel(verdictBand: VerdictBand): string {
  switch (verdictBand) {
    case "evidence_strong":
      return "evidence strong";
    case "evidence_mixed":
      return "evidence mixed";
    case "evidence_weak":
      return "evidence weak";
    case "evidence_thin":
      return "evidence thin";
    case "system_failed":
      return "system failed";
    case "needs_context":
      return "needs context";
  }
}

export function headline(verdictBand: VerdictBand): string {
  switch (verdictBand) {
    case "evidence_strong":
      return "Verified sources give this check a stronger evidence base.";
    case "evidence_mixed":
      return "Verified sources point in more than one direction.";
    case "evidence_weak":
      return "Some verified evidence is relevant, but it is not decisive.";
    case "evidence_thin":
      return "Only thin verified evidence was found for this claim.";
    case "system_failed":
      return "The evidence pipeline could not complete.";
    case "needs_context":
      return "The sources found do not give enough direct context.";
  }
}

export function description(
  verdictBand: VerdictBand,
  supports: number,
  contradicts: number,
  evidenceCount: number,
): string {
  if (verdictBand === "needs_context") {
    return "TrustTrace fetched sources, but they did not directly resolve the submitted claim.";
  }
  return `TrustTrace verified ${String(evidenceCount)} fetched source${evidenceCount === 1 ? "" : "s"}: ${String(supports)} supporting, ${String(contradicts)} contradicting, and ${String(evidenceCount - supports - contradicts)} neutral.`;
}

export function uncertaintyLines(
  verdictBand: VerdictBand,
  evidenceCount: number,
  snippetCount: number,
): string[] {
  if (verdictBand === "needs_context") {
    return [
      "The fetched sources may be background context rather than direct evidence.",
      "A deeper check should broaden source discovery and look for primary documents.",
    ];
  }

  return [
    `${String(evidenceCount)} source${evidenceCount === 1 ? " was" : "s were"} fetched and evaluated in this first evidence-discovery slice.`,
    "Source independence is currently approximated by domain, so shared-origin reporting may still be overcounted.",
    ...(snippetCount > 0
      ? [
          "Snippet-only context is shown as weak evidence and cannot create a strong band on its own.",
        ]
      : []),
  ];
}

export function summaryText(
  verdictBand: VerdictBand,
  supports: number,
  contradicts: number,
  evidenceCount: number,
): string {
  if (verdictBand === "needs_context") {
    return "Verified source discovery completed, but the fetched sources did not directly settle the claim.";
  }
  return `Verified source discovery completed with ${String(evidenceCount)} evidence item${evidenceCount === 1 ? "" : "s"}, including ${String(supports)} support relation${supports === 1 ? "" : "s"} and ${String(contradicts)} contradiction relation${contradicts === 1 ? "" : "s"}.`;
}

export function cues(evidence: readonly EvidenceItemDto[], independent: number) {
  return [
    {
      name: "Verified sources",
      text: `${String(evidence.length)} fetched source${evidence.length === 1 ? "" : "s"}`,
      note: "Sources passed backend URL safety checks and text extraction before evaluation.",
      strength: Math.min(5, evidence.length),
      tooltip: "Only backend-verified http(s) URLs can appear as evidence.",
    },
    {
      name: "Independence",
      text: `${String(independent)} independent domain${independent === 1 ? "" : "s"}`,
      note: "Same-domain sources are weighted lower in this first slice.",
      strength: Math.min(5, independent),
      tooltip: "Domain-level independence is a simple MVP proxy for source independence.",
    },
  ];
}
