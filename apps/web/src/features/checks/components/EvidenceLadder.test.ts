import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import type { EvidenceItem } from "@/features/checks/types";
import EvidenceLadder from "./EvidenceLadder.vue";

function makeEvidence(url: string): EvidenceItem {
  return {
    sourceName: "nhtsa.gov",
    domain: "nhtsa.gov",
    credibilityLabel: "GOV",
    date: "2025",
    title: "Facts About Seat Belt Use",
    text: "Seat belts reduce serious injury in crashes.",
    url,
    relation: "supports",
    tier: 1,
    scopeMatch: 0.95,
  };
}

describe("EvidenceLadder", () => {
  it("renders safe http evidence URLs with external-link protections", () => {
    const wrapper = mount(EvidenceLadder, {
      props: {
        evidence: [makeEvidence("https://www.nhtsa.gov/vehicle-safety/seat-belts")],
      },
    });

    const link = wrapper.find("a");

    expect(link.exists()).toBe(true);
    expect(link.attributes("href")).toBe("https://www.nhtsa.gov/vehicle-safety/seat-belts");
    expect(link.attributes("target")).toBe("_blank");
    expect(link.attributes("rel")).toBe("noopener noreferrer");
  });

  it("does not render clickable links for unsafe evidence URLs", () => {
    const wrapper = mount(EvidenceLadder, {
      props: {
        evidence: [makeEvidence("javascript:alert(1)")],
      },
    });

    expect(wrapper.find("a").exists()).toBe(false);
    expect(wrapper.text()).toContain("link unavailable");
  });
});
