import { mount } from "@vue/test-utils";
import { createPinia } from "pinia";
import { describe, expect, it } from "vitest";

import CheckHomePage from "./CheckHomePage.vue";

function mountPage() {
  return mount(CheckHomePage, {
    global: {
      plugins: [createPinia()],
      stubs: {
        RouterLink: { template: "<a><slot /></a>" },
      },
    },
  });
}

describe("CheckHomePage", () => {
  it("renders the landing page", () => {
    const wrapper = mountPage();

    expect(wrapper.text()).toContain("Check the claim");
    expect(wrapper.text()).toContain("Run credibility check");
  });

  it("marks the active input mode with aria-pressed", async () => {
    const wrapper = mountPage();
    const buttons = wrapper.findAll('[aria-label="Claim input type"] button');
    const textButton = buttons[0]!;
    const urlButton = buttons[1]!;

    expect(textButton.text()).toBe("text");
    expect(textButton.attributes("aria-pressed")).toBe("true");
    expect(urlButton.attributes("aria-pressed")).toBe("false");

    await urlButton.trigger("click");

    expect(textButton.attributes("aria-pressed")).toBe("false");
    expect(urlButton.attributes("aria-pressed")).toBe("true");
  });
});
