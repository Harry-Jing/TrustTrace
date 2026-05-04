import type { VerdictBand } from "@/features/checks/types";

/**
 * Domain semantic token for the *state of the evidence* surfaced by a
 * check. Distinct from `BadgeTone` (the generic UI palette) so that
 * future palette decisions on the verdict surface don't bleed into
 * toasts / settings badges, and vice versa.
 *
 * The four band tones (strong / mixed / weak / thin) sit on a
 * diverging green → olive → amber → orange spectrum, the convention
 * used by mainstream credibility products (PolitiFact, Ground News,
 * Ad Fontes Media) because it matches users' built-in trust intuition.
 * The two procedural states drop chroma to sit visually off the
 * spectrum.
 */
export type EvidenceTone =
  | "pending"
  | "strong"
  | "mixed"
  | "weak"
  | "thin"
  | "inconclusive"
  | "unavailable";

export const VERDICT_BAND_EVIDENCE_TONES = {
  evidence_strong: "strong",
  evidence_mixed: "mixed",
  evidence_weak: "weak",
  evidence_thin: "thin",
  needs_context: "inconclusive",
  system_failed: "unavailable",
} as const satisfies Record<VerdictBand, EvidenceTone>;

export function evidenceToneFor(band: VerdictBand | null): EvidenceTone {
  return band === null ? "pending" : VERDICT_BAND_EVIDENCE_TONES[band];
}

/**
 * Top-border treatment on list/recent cards. The saturated stop of
 * each tone — visible 3px stripe.
 */
export const EVIDENCE_TONE_BORDER_TOP_CLASSES: Record<EvidenceTone, string> = {
  pending: "border-t-border-strong",
  strong: "border-t-evidence-strong",
  mixed: "border-t-evidence-mixed",
  weak: "border-t-evidence-weak",
  thin: "border-t-evidence-thin",
  inconclusive: "border-t-border-strong",
  unavailable: "border-t-foreground",
};

/**
 * Badge classes — color/style only, the EvidenceBadge wrapper owns
 * shape (rounded, padding, font). Soft "muted background + saturated
 * text" pattern matching the project's existing BaseTagBadge feel.
 */
export const EVIDENCE_TONE_BADGE_CLASSES: Record<EvidenceTone, string> = {
  pending: "border border-border bg-surface text-foreground-muted",
  strong: "border border-evidence-strong-muted bg-evidence-strong-muted text-evidence-strong",
  mixed: "border border-evidence-mixed-muted bg-evidence-mixed-muted text-evidence-mixed",
  weak: "border border-evidence-weak-muted bg-evidence-weak-muted text-evidence-weak",
  thin: "border border-evidence-thin-muted bg-evidence-thin-muted text-evidence-thin",
  inconclusive: "border border-border bg-surface text-foreground-muted",
  unavailable: "border border-foreground bg-foreground text-background",
};

export function evidenceToneBorderTop(tone: EvidenceTone): string {
  return EVIDENCE_TONE_BORDER_TOP_CLASSES[tone];
}

export function evidenceToneBadgeClasses(tone: EvidenceTone): string {
  return EVIDENCE_TONE_BADGE_CLASSES[tone];
}
