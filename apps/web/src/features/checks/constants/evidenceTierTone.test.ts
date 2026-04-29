import { describe, expect, it } from "vitest";

import {
  EVIDENCE_TIER_TONE_BAR_CLASSES,
  EVIDENCE_TIER_TONE_BORDER_LEFT_CLASSES,
  EVIDENCE_TIER_TONE_NUMBER_CLASSES,
  EVIDENCE_TIER_TONES,
  evidenceTierToneBarClasses,
  evidenceTierToneBorderLeftClasses,
  evidenceTierToneFor,
  evidenceTierToneNumberClasses,
  type EvidenceTierTone,
} from "./evidenceTierTone";
import type { EvidenceTier } from "@/features/checks/types";

const ALL_TONES: readonly EvidenceTierTone[] = ["tier-1", "tier-2", "tier-3", "tier-4"];

describe("evidenceTierToneFor", () => {
  it.each([
    [1, "tier-1"],
    [2, "tier-2"],
    [3, "tier-3"],
    [4, "tier-4"],
  ] as const satisfies readonly (readonly [EvidenceTier, EvidenceTierTone])[])(
    "maps tier %s to tone %s",
    (tier, tone) => {
      expect(evidenceTierToneFor(tier)).toBe(tone);
    },
  );

  it("never collapses two distinct tiers onto the same tone", () => {
    const tiers: readonly EvidenceTier[] = [1, 2, 3, 4];
    const tones = tiers.map((tier) => EVIDENCE_TIER_TONES[tier]);
    expect(new Set(tones).size).toBe(tiers.length);
  });
});

describe("EvidenceTierTone class maps", () => {
  it("uses the dedicated evidence-tier-* token family, not nominal-hue --success / --warning / --accent", () => {
    // Tier is ordinal data; reusing the categorical role palette
    // (success/warning/accent) implies "tier-4 is bad" rather than
    // "tier-4 has lower weight". The ramp must stay on its own
    // single-hue lightness scale.
    for (const tone of ALL_TONES) {
      expect(EVIDENCE_TIER_TONE_NUMBER_CLASSES[tone]).not.toMatch(
        /text-success|text-warning|text-good|bg-success|bg-warning/,
      );
      expect(EVIDENCE_TIER_TONE_BORDER_LEFT_CLASSES[tone]).not.toMatch(
        /border-success|border-warning|border-l-success|border-l-warning|border-l-accent/,
      );
      expect(EVIDENCE_TIER_TONE_BAR_CLASSES[tone]).not.toMatch(/bg-success|bg-warning/);
    }
  });

  it("exposes a border-left stripe for every tier", () => {
    for (const tone of ALL_TONES) {
      expect(evidenceTierToneBorderLeftClasses(tone)).toMatch(/^border-l-\[3px\] border-l-/);
    }
  });

  it("exposes number-circle classes that include border + bg + text for every tier", () => {
    for (const tone of ALL_TONES) {
      const classes = evidenceTierToneNumberClasses(tone);
      expect(classes).toMatch(/border-/);
      expect(classes).toMatch(/bg-/);
      expect(classes).toMatch(/text-/);
    }
  });

  it("exposes a scope-bar fill class for every tier", () => {
    for (const tone of ALL_TONES) {
      expect(evidenceTierToneBarClasses(tone)).toMatch(/^bg-evidence-tier-/);
    }
  });

  it("references each tier number in its own corresponding token (no cross-tier reuse)", () => {
    // Guard against a copy-paste regression where tier-3 accidentally
    // points at the tier-1 token.
    const tones: readonly EvidenceTierTone[] = ["tier-1", "tier-2", "tier-3", "tier-4"];
    for (const tone of tones) {
      expect(EVIDENCE_TIER_TONE_BAR_CLASSES[tone]).toContain(`bg-evidence-${tone}`);
      expect(EVIDENCE_TIER_TONE_BORDER_LEFT_CLASSES[tone]).toContain(`border-l-evidence-${tone}`);
    }
  });
});
