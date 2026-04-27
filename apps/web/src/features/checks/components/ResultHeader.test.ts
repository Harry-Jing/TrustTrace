import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import type { CheckResultViewModel, VerdictBand } from "@/features/checks/types";
import ResultHeader from "./ResultHeader.vue";

function makeResult(verdictBand: VerdictBand): CheckResultViewModel {
  return {
    checkId: "check-1",
    inputText: "A claim to check",
    inputTypeLabel: "text input",
    durationLabel: "7.8s",
    verdictBand,
    verdictLabel: "",
    headline: "",
    description: "",
    atAGlance: {
      evidence: 0,
      independent: 0,
      fullText: 0,
      primary: 0,
      snippet: 0,
      uncertainty: "high",
    },
    cues: [],
    evidence: [],
    uncertaintyLines: [],
    noteText: "",
    summaryText: "",
  };
}

describe("ResultHeader", () => {
  it.each([
    ["evidence_strong", "evidence strong"],
    ["evidence_mixed", "mixed evidence"],
    ["evidence_weak", "weak evidence"],
    ["evidence_thin", "thin evidence"],
    ["needs_context", "needs context"],
    ["system_failed", "system failed"],
  ] as const)("renders fallback copy for %s when backend copy is empty", (band, label) => {
    const wrapper = mount(ResultHeader, {
      props: {
        result: makeResult(band),
      },
    });

    expect(wrapper.text()).toContain(label);
    expect(wrapper.find("h1").text().length).toBeGreaterThan(0);
  });
});
