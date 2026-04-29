import { describe, expect, it } from "vitest";

import { UNCERTAINTY_LEVEL_TEXT_CLASSES } from "./uncertaintyLevelClasses";
import type { UncertaintyLevel } from "@/features/checks/types";

const ALL_LEVELS: readonly UncertaintyLevel[] = ["low", "med", "high"];

describe("UNCERTAINTY_LEVEL_TEXT_CLASSES", () => {
  it("does not paint uncertainty with --success / --warning generic state hues", () => {
    // High uncertainty is not a warning state — it is a fact about
    // the evidence. Reusing the generic warning palette codes the
    // user's read as "this is broken" rather than "less is known".
    for (const level of ALL_LEVELS) {
      expect(UNCERTAINTY_LEVEL_TEXT_CLASSES[level]).not.toMatch(
        /text-success|text-warning|text-good/,
      );
    }
  });

  it("rides the foreground lightness ramp for every level", () => {
    for (const level of ALL_LEVELS) {
      expect(UNCERTAINTY_LEVEL_TEXT_CLASSES[level]).toMatch(/^text-foreground/);
    }
  });

  it("ramps from low (quietest) to high (loudest) on the foreground scale", () => {
    expect(UNCERTAINTY_LEVEL_TEXT_CLASSES.low).toBe("text-foreground-subtle");
    expect(UNCERTAINTY_LEVEL_TEXT_CLASSES.med).toBe("text-foreground-muted");
    expect(UNCERTAINTY_LEVEL_TEXT_CLASSES.high).toBe("text-foreground");
  });
});
