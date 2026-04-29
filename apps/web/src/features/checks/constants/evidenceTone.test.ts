import { describe, expect, it } from "vitest";

import {
  EVIDENCE_TONE_BADGE_CLASSES,
  EVIDENCE_TONE_BORDER_TOP_CLASSES,
  VERDICT_BAND_EVIDENCE_TONES,
  evidenceToneBadgeClasses,
  evidenceToneBorderTop,
  evidenceToneFor,
  type EvidenceTone,
} from "./evidenceTone";
import type { VerdictBand } from "@/features/checks/types";

const ALL_TONES: readonly EvidenceTone[] = [
  "pending",
  "strong",
  "mixed",
  "weak",
  "thin",
  "inconclusive",
  "unavailable",
];

const BAND_TONES: readonly EvidenceTone[] = ["strong", "mixed", "weak", "thin"];

describe("evidenceToneFor", () => {
  it.each([
    ["evidence_strong", "strong"],
    ["evidence_mixed", "mixed"],
    ["evidence_weak", "weak"],
    ["evidence_thin", "thin"],
    ["needs_context", "inconclusive"],
    ["system_failed", "unavailable"],
  ] as const satisfies readonly (readonly [VerdictBand, EvidenceTone])[])(
    "maps band %s to tone %s",
    (band, tone) => {
      expect(evidenceToneFor(band)).toBe(tone);
    },
  );

  it("returns 'pending' when the verdict band is null", () => {
    expect(evidenceToneFor(null)).toBe("pending");
  });

  it("never collapses two distinct evidence bands onto the same tone", () => {
    const evidenceBands = [
      "evidence_strong",
      "evidence_mixed",
      "evidence_weak",
      "evidence_thin",
    ] as const;
    const tones = evidenceBands.map((band) => VERDICT_BAND_EVIDENCE_TONES[band]);
    expect(new Set(tones).size).toBe(evidenceBands.length);
  });
});

describe("EvidenceTone class maps", () => {
  it("uses the dedicated evidence-* token family, not the generic --success / --warning palette", () => {
    // Verdict surface owns its own tokens so palette tweaks here don't
    // bleed into toasts / settings badges and vice versa.
    for (const tone of BAND_TONES) {
      expect(EVIDENCE_TONE_BORDER_TOP_CLASSES[tone]).toContain(`border-t-evidence-${tone}`);
      expect(EVIDENCE_TONE_BADGE_CLASSES[tone]).toContain(`bg-evidence-${tone}-muted`);
      expect(EVIDENCE_TONE_BADGE_CLASSES[tone]).toContain(`text-evidence-${tone}`);
      expect(EVIDENCE_TONE_BADGE_CLASSES[tone]).not.toMatch(/text-success|text-warning|text-good/);
    }
  });

  it("exposes a border-top class for every EvidenceTone", () => {
    for (const tone of ALL_TONES) {
      expect(evidenceToneBorderTop(tone)).toMatch(/^border-t-/);
    }
  });

  it("exposes badge classes that include border + bg + text for every EvidenceTone", () => {
    for (const tone of ALL_TONES) {
      const classes = evidenceToneBadgeClasses(tone);
      expect(classes).toContain("border");
      expect(classes).toMatch(/bg-/);
      expect(classes).toMatch(/text-/);
    }
  });

  it("uses solid borders for every tone (no dashed line-style encoding)", () => {
    for (const tone of ALL_TONES) {
      expect(EVIDENCE_TONE_BORDER_TOP_CLASSES[tone]).not.toContain("dashed");
      expect(EVIDENCE_TONE_BADGE_CLASSES[tone]).not.toContain("border-dashed");
    }
  });
});
