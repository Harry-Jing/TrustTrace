import { setActivePinia, createPinia } from "pinia";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { usePreferencesStore } from "@/stores/preferences.store";

interface FakeMediaQueryList {
  matches: boolean;
  addEventListener: ReturnType<typeof vi.fn>;
  removeEventListener: ReturnType<typeof vi.fn>;
  dispatchEvent?: () => boolean;
}

function installMatchMedia(matches: boolean) {
  const media: FakeMediaQueryList = {
    matches,
    addEventListener: vi.fn<(type: string, listener: () => void) => void>(),
    removeEventListener: vi.fn<(type: string, listener: () => void) => void>(),
  };
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: vi.fn<(query: string) => FakeMediaQueryList>().mockReturnValue(media),
  });
  return media;
}

describe("usePreferencesStore", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("falls back to defaults when storage is empty", () => {
    const store = usePreferencesStore();

    expect(store.theme).toBe("light");
    expect(store.discoveryStrategy).toBe("search_api");
    expect(store.saveHistoryLocally).toBe(true);
  });

  it("falls back when storage holds an invalid value", () => {
    localStorage.setItem("tt-theme", "neon");
    localStorage.setItem("tt-discovery-strategy", "rss");
    localStorage.setItem("tt-save-history-locally", "maybe");

    const store = usePreferencesStore();

    expect(store.theme).toBe("light");
    expect(store.discoveryStrategy).toBe("search_api");
    expect(store.saveHistoryLocally).toBe(true);
  });

  it("persists theme changes through setTheme and toggles dark mode marker", () => {
    installMatchMedia(false);
    const store = usePreferencesStore();

    store.setTheme("dark");

    expect(store.theme).toBe("dark");
    expect(localStorage.getItem("tt-theme")).toBe("dark");
    expect(document.documentElement.dataset.theme).toBe("dark");

    store.setTheme("light");
    expect(document.documentElement.dataset.theme).toBeUndefined();
  });

  it("resolves auto theme to dark when the OS prefers dark", () => {
    installMatchMedia(true);
    const store = usePreferencesStore();

    store.setTheme("auto");

    expect(store.theme).toBe("auto");
    expect(store.effectiveTheme).toBe("dark");
    expect(document.documentElement.dataset.theme).toBe("dark");
  });

  it("resolves auto theme to light when the OS prefers light", () => {
    installMatchMedia(false);
    const store = usePreferencesStore();

    store.setTheme("auto");

    expect(store.effectiveTheme).toBe("light");
    expect(document.documentElement.dataset.theme).toBeUndefined();
  });

  it("toggleTheme alternates between light and dark even when starting in auto", () => {
    installMatchMedia(true);
    const store = usePreferencesStore();
    store.setTheme("auto");

    store.toggleTheme();
    expect(store.theme).toBe("light");

    store.toggleTheme();
    expect(store.theme).toBe("dark");
  });

  it("persists discoveryStrategy via setter", () => {
    const store = usePreferencesStore();

    store.setDiscoveryStrategy("llm_web");

    expect(store.discoveryStrategy).toBe("llm_web");
    expect(localStorage.getItem("tt-discovery-strategy")).toBe("llm_web");
  });

  it("persists saveHistoryLocally via setter", () => {
    const store = usePreferencesStore();

    store.setSaveHistoryLocally(false);

    expect(store.saveHistoryLocally).toBe(false);
    expect(localStorage.getItem("tt-save-history-locally")).toBe("false");

    store.setSaveHistoryLocally(true);
    expect(localStorage.getItem("tt-save-history-locally")).toBe("true");
  });

  it("re-applies theme when the system listener fires while on auto", () => {
    const media = installMatchMedia(false);
    const store = usePreferencesStore();
    store.setTheme("auto");
    store.initSystemThemeListener();

    expect(media.addEventListener).toHaveBeenCalledTimes(1);

    media.matches = true;
    const handler = media.addEventListener.mock.calls[0]?.[1] as (() => void) | undefined;
    handler?.();

    expect(document.documentElement.dataset.theme).toBe("dark");
  });
});
