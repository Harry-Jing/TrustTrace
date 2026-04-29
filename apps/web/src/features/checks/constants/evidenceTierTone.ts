import type { EvidenceTier } from "@/features/checks/types";

/**
 * Domain semantic token for the *weight* of an evidence tier in the
 * ladder (1 strongest → 4 weakest). Distinct from `EvidenceTone`
 * (verdict surface) and `EvidenceRelationTone` (per-source polarity)
 * because tier conveys ordinal weight, not credibility judgement.
 *
 * Tier is ordinal data; the underlying token ramp is a single
 * low-chroma slate, varying lightness from heaviest (tier-1) to
 * lightest (tier-4) — Munzner / Bertin / ColorBrewer recommend
 * sequential lightness for ordinal channels rather than nominal
 * hue, which is why this surface deliberately avoids the
 * green/blue/grey/orange palette that turned tier-4 into "warning".
 */
export type EvidenceTierTone = "tier-1" | "tier-2" | "tier-3" | "tier-4";

export const EVIDENCE_TIER_TONES = {
  1: "tier-1",
  2: "tier-2",
  3: "tier-3",
  4: "tier-4",
} as const satisfies Record<EvidenceTier, EvidenceTierTone>;

export function evidenceTierToneFor(tier: EvidenceTier): EvidenceTierTone {
  return EVIDENCE_TIER_TONES[tier];
}

/**
 * Numbered-circle classes (border + bg + text). Tiers 1-2 use the
 * filled-with-card-text recipe (heavy visual weight, AA at darkest
 * stops); tiers 3-4 swap to outline-only with foreground text so
 * the lightness ramp can extend without breaking text contrast on
 * the fill — the field-standard ColorBrewer crossover at midpoint.
 */
export const EVIDENCE_TIER_TONE_NUMBER_CLASSES: Record<EvidenceTierTone, string> = {
  "tier-1": "border-evidence-tier-1 bg-evidence-tier-1 text-card",
  "tier-2": "border-evidence-tier-2 bg-evidence-tier-2 text-card",
  "tier-3": "border-evidence-tier-3 bg-card text-foreground",
  "tier-4": "border-evidence-tier-4 bg-card text-foreground-muted",
};

/**
 * Left-edge stripe applied to each evidence article card. 3px so
 * the tier reads at a glance without a separate label.
 */
export const EVIDENCE_TIER_TONE_BORDER_LEFT_CLASSES: Record<EvidenceTierTone, string> = {
  "tier-1": "border-l-[3px] border-l-evidence-tier-1",
  "tier-2": "border-l-[3px] border-l-evidence-tier-2",
  "tier-3": "border-l-[3px] border-l-evidence-tier-3",
  "tier-4": "border-l-[3px] border-l-evidence-tier-4",
};

/**
 * Scope-match bar fill against `bg-border`. Tier-4 is intentionally
 * the quietest stop — snippet-only sources whose scope match cannot
 * independently support a strong claim should not shout for visual
 * attention.
 */
export const EVIDENCE_TIER_TONE_BAR_CLASSES: Record<EvidenceTierTone, string> = {
  "tier-1": "bg-evidence-tier-1",
  "tier-2": "bg-evidence-tier-2",
  "tier-3": "bg-evidence-tier-3",
  "tier-4": "bg-evidence-tier-4",
};

export function evidenceTierToneNumberClasses(tone: EvidenceTierTone): string {
  return EVIDENCE_TIER_TONE_NUMBER_CLASSES[tone];
}

export function evidenceTierToneBorderLeftClasses(tone: EvidenceTierTone): string {
  return EVIDENCE_TIER_TONE_BORDER_LEFT_CLASSES[tone];
}

export function evidenceTierToneBarClasses(tone: EvidenceTierTone): string {
  return EVIDENCE_TIER_TONE_BAR_CLASSES[tone];
}
