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
 * Border uses a dedicated `*-border` token (one step deeper than
 * `*-muted`) so the chip edge stays visible on tinted page bg
 * (cream paper at L≈0.95 collapses the chip-vs-page delta-L of a
 * pure muted-fill chip — the GitHub IssueLabel adaptive-border
 * pattern). Dark mode keeps the border invisible by aliasing it to
 * the muted bg.
 */
export const EVIDENCE_RELATION_TONE_BADGE_CLASSES: Record<EvidenceRelationTone, string> = {
  affirm:
    "border border-evidence-relation-affirm-border bg-evidence-relation-affirm-muted text-evidence-relation-affirm",
  oppose:
    "border border-evidence-relation-oppose-border bg-evidence-relation-oppose-muted text-evidence-relation-oppose",
  neutral: "border border-border bg-surface text-foreground-muted",
};

export function evidenceRelationToneBadgeClasses(tone: EvidenceRelationTone): string {
  return EVIDENCE_RELATION_TONE_BADGE_CLASSES[tone];
}
