import { describe, expect, it } from "vitest";

import {
  EVIDENCE_RELATION_TONE_BADGE_CLASSES,
  EVIDENCE_RELATION_TONES,
  evidenceRelationToneBadgeClasses,
  evidenceRelationToneFor,
  type EvidenceRelationTone,
} from "./evidenceRelationTone";
import type { EvidenceRelation } from "@/features/checks/types";

const ALL_TONES: readonly EvidenceRelationTone[] = ["affirm", "oppose", "neutral"];

describe("evidenceRelationToneFor", () => {
  it.each([
    ["supports", "affirm"],
    ["contradicts", "oppose"],
    ["neutral", "neutral"],
  ] as const satisfies readonly (readonly [EvidenceRelation, EvidenceRelationTone])[])(
    "maps relation %s to tone %s",
    (relation, tone) => {
      expect(evidenceRelationToneFor(relation)).toBe(tone);
    },
  );

  it("never collapses two distinct relations onto the same tone", () => {
    const relations = ["supports", "contradicts", "neutral"] as const;
    const tones = relations.map((relation) => EVIDENCE_RELATION_TONES[relation]);
    expect(new Set(tones).size).toBe(relations.length);
  });
});

describe("EvidenceRelationTone class map", () => {
  it("uses the dedicated evidence-relation-* token family, not generic --success / --warning / --good", () => {
    // Polarity surface owns its own tokens so palette tweaks here
    // don't bleed into toasts / settings badges, and so the cool/warm
    // pair stays semantically separate from the verdict-card ramp.
    expect(EVIDENCE_RELATION_TONE_BADGE_CLASSES.affirm).toContain("evidence-relation-affirm");
    expect(EVIDENCE_RELATION_TONE_BADGE_CLASSES.affirm).not.toMatch(
      /text-success|text-warn|text-good|text-evidence-strong/,
    );
    expect(EVIDENCE_RELATION_TONE_BADGE_CLASSES.oppose).toContain("evidence-relation-oppose");
    expect(EVIDENCE_RELATION_TONE_BADGE_CLASSES.oppose).not.toMatch(
      /text-success|text-warn|text-good|text-evidence-thin/,
    );
  });

  it("exposes badge classes that include border + bg + text for every EvidenceRelationTone", () => {
    for (const tone of ALL_TONES) {
      const classes = evidenceRelationToneBadgeClasses(tone);
      expect(classes).toContain("border");
      expect(classes).toMatch(/bg-/);
      expect(classes).toMatch(/text-/);
    }
  });
});
