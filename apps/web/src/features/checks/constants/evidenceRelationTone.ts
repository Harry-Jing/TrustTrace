import type { EvidenceRelation } from "@/features/checks/types";

/**
 * Domain semantic token for the *polarity* of a single piece of
 * evidence relative to the claim under check. Distinct from
 * `EvidenceTone` (verdict-card surface) because polarity describes
 * the source's stance toward one claim, not the overall verdict.
 *
 * Names are deliberately polarity-only — `affirm` / `oppose` —
 * rather than value-laden `good` / `warn`. A source that opposes a
 * false claim is precisely what TrustTrace wants to surface; coding
 * "contradicts = warn" misreads as "this is a problem state".
 */
export type EvidenceRelationTone = "affirm" | "oppose" | "neutral";

export const EVIDENCE_RELATION_TONES = {
  supports: "affirm",
  contradicts: "oppose",
  neutral: "neutral",
} as const satisfies Record<EvidenceRelation, EvidenceRelationTone>;

export function evidenceRelationToneFor(relation: EvidenceRelation): EvidenceRelationTone {
  return EVIDENCE_RELATION_TONES[relation];
}

/**
 * Badge classes — color/style only. The `EvidenceRelationBadge`
 * wrapper owns shape (rounded pill, padding, font). The cool-warm
 * pair (teal affirm / maroon oppose) is intentionally equal-chroma
 * and equal-weight: neither side reads as reward or alarm.
 *
 * No border on affirm/oppose: at the muted-bg saturation level
 * (~32% S, 74% L) the chip-vs-cream-paper delta-L is ~0.21, large
 * enough to define the chip edge without an additional stroke.
 * Layering a border on top of an already-saturated tonal fill
 * over-emphasizes the chip and competes with text legibility.
 *
 * Neutral keeps a 1px border because its bg matches surface — there
 * is no fill to define the chip edge, so the border carries it.
 */
export const EVIDENCE_RELATION_TONE_BADGE_CLASSES: Record<EvidenceRelationTone, string> = {
  affirm: "bg-evidence-relation-affirm-muted text-evidence-relation-affirm",
  oppose: "bg-evidence-relation-oppose-muted text-evidence-relation-oppose",
  neutral: "border border-border bg-surface text-foreground-muted",
};

export function evidenceRelationToneBadgeClasses(tone: EvidenceRelationTone): string {
  return EVIDENCE_RELATION_TONE_BADGE_CLASSES[tone];
}
