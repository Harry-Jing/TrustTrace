import { mount } from "@vue/test-utils";
import { createPinia } from "pinia";
import { defineComponent, nextTick } from "vue";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AppShell from "@/app/AppShell.vue";

type AfterEachHook = (to: { meta: { depth?: number } }, from: { meta: { depth?: number } }) => void;

const shellState = vi.hoisted(() => ({
  afterEachHook: null as AfterEachHook | null,
  shouldThrow: true,
  route: {
    fullPath: "/checks/bad/result",
    path: "/checks/bad/result",
    meta: { depth: 2 },
  },
}));

vi.mock("vue-router", () => {
  return {
    useRouter: () => ({
      afterEach: (hook: AfterEachHook) => {
        shellState.afterEachHook = hook;
      },
    }),
    useRoute: () => shellState.route,
  };
});

const ThrowingPage = defineComponent({
  name: "ThrowingPage",
  setup() {
    throw new Error("render failed");
  },
  template: "<div />",
});

const SafePage = defineComponent({
  name: "SafePage",
  template: "<div>Safe route</div>",
});

const RouterViewStub = defineComponent({
  name: "RouterView",
  setup(_, { slots }) {
    return () =>
      slots.default?.({
        Component: shellState.shouldThrow ? ThrowingPage : SafePage,
      });
  },
});

describe("AppShell", () => {
  beforeEach(() => {
    shellState.afterEachHook = null;
    shellState.shouldThrow = true;
  });

  it("clears captured render errors after route changes", async () => {
    const wrapper = mount(AppShell, {
      global: {
        plugins: [createPinia()],
        stubs: {
          AppNav: true,
          DevNav: true,
          RouterView: RouterViewStub,
        },
      },
    });

    await nextTick();
    expect(wrapper.text()).toContain("Something went wrong");

    shellState.shouldThrow = false;
    shellState.afterEachHook?.({ meta: { depth: 0 } }, { meta: { depth: 2 } });
    await nextTick();

    expect(wrapper.text()).not.toContain("Something went wrong");
    expect(wrapper.text()).toContain("Safe route");
  });
});
