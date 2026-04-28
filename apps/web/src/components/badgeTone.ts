import type { BadgeTone } from "@/types/ui";

export const BADGE_TONE_CLASSES: Record<BadgeTone, string> = {
  default: "border border-line bg-surface-alt text-ink-2",
  accent: "border border-accent-light bg-accent-light text-accent",
  warn: "border border-warn-light bg-warn-light text-warn",
  good: "border border-good-light bg-good-light text-good",
  dark: "border border-ink bg-ink text-surface",
};

export function badgeToneClasses(tone: BadgeTone): string {
  return BADGE_TONE_CLASSES[tone];
}
