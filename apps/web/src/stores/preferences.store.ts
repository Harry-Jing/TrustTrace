import { defineStore } from "pinia";

import type { DiscoveryStrategy } from "@/features/checks/types/progress";
import type { EffectiveTheme, Theme } from "@/types/app";

const THEMES = ["light", "dark", "auto"] as const;
const DISCOVERY_STRATEGIES: DiscoveryStrategy[] = ["search_api", "llm_web"];

const STORAGE_KEYS = {
  theme: "tt-theme",
  discoveryStrategy: "tt-discovery-strategy",
} as const;

const DARK_QUERY = "(prefers-color-scheme: dark)";

function isTheme(value: string): value is Theme {
  return (THEMES as readonly string[]).includes(value);
}

function isDiscoveryStrategy(value: string): value is DiscoveryStrategy {
  return (DISCOVERY_STRATEGIES as readonly string[]).includes(value);
}

function readStoredValue<T extends string>(
  key: string,
  fallback: T,
  isValid: (value: string) => value is T,
): T {
  if (typeof localStorage === "undefined") return fallback;

  const stored = localStorage.getItem(key);
  return stored && isValid(stored) ? stored : fallback;
}

function writeStoredValue(key: string, value: string) {
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(key, value);
  }
}

function resolveSystemTheme(): EffectiveTheme {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return "light";
  }
  return window.matchMedia(DARK_QUERY).matches ? "dark" : "light";
}

function resolveEffectiveTheme(theme: Theme): EffectiveTheme {
  if (theme === "auto") return resolveSystemTheme();
  return theme;
}

let systemThemeListenerAttached = false;

export const usePreferencesStore = defineStore("preferences", {
  state: () => ({
    theme: readStoredValue<Theme>(STORAGE_KEYS.theme, "light", isTheme),
    discoveryStrategy: readStoredValue<DiscoveryStrategy>(
      STORAGE_KEYS.discoveryStrategy,
      "search_api",
      isDiscoveryStrategy,
    ),
  }),
  getters: {
    effectiveTheme: (state): EffectiveTheme => resolveEffectiveTheme(state.theme),
  },
  actions: {
    applyTheme() {
      if (typeof document === "undefined") return;

      // style.css's dark-mode tokens are gated on `[data-theme="dark"]`;
      // toggling this attribute on `<html>` is the single source of
      // truth for theme. Removing the attribute (vs setting "light")
      // lets `:root` defaults apply unmodified.
      if (resolveEffectiveTheme(this.theme) === "dark") {
        document.documentElement.setAttribute("data-theme", "dark");
      } else {
        document.documentElement.removeAttribute("data-theme");
      }
    },
    setTheme(theme: Theme) {
      this.theme = theme;
      writeStoredValue(STORAGE_KEYS.theme, theme);
      this.applyTheme();
    },
    toggleTheme() {
      // Header toggle alternates light ↔ dark only. Auto is reachable from
      // the settings page; clicking the header sun/moon never lands on it.
      this.setTheme(resolveEffectiveTheme(this.theme) === "dark" ? "light" : "dark");
    },
    setDiscoveryStrategy(strategy: DiscoveryStrategy) {
      this.discoveryStrategy = strategy;
      writeStoredValue(STORAGE_KEYS.discoveryStrategy, strategy);
    },
    initSystemThemeListener() {
      if (systemThemeListenerAttached) return;
      if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;

      const media = window.matchMedia(DARK_QUERY);
      media.addEventListener("change", () => {
        if (this.theme === "auto") this.applyTheme();
      });
      systemThemeListenerAttached = true;
    },
  },
});
