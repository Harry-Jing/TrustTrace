import { defineStore } from "pinia";

import type { Theme } from "@/types/app";

const THEMES = ["light", "dark"] as const;

function isTheme(value: string): value is Theme {
  return THEMES.includes(value as Theme);
}

function readStoredValue<T extends string>(
  key: string,
  fallback: T,
  isValid: (value: string) => value is T,
) {
  if (typeof localStorage === "undefined") return fallback;

  const stored = localStorage.getItem(key);
  return stored && isValid(stored) ? stored : fallback;
}

function writeStoredValue(key: string, value: string) {
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(key, value);
  }
}

export const usePreferencesStore = defineStore("preferences", {
  state: () => ({
    theme: readStoredValue("tt-theme", "light", isTheme),
  }),
  actions: {
    applyTheme() {
      if (typeof document === "undefined") return;

      if (this.theme === "dark") {
        document.documentElement.setAttribute("data-theme", "dark");
      } else {
        document.documentElement.removeAttribute("data-theme");
      }
    },
    setTheme(theme: Theme) {
      this.theme = theme;
      this.applyTheme();
      writeStoredValue("tt-theme", theme);
    },
    toggleTheme() {
      this.setTheme(this.theme === "dark" ? "light" : "dark");
    },
  },
});
