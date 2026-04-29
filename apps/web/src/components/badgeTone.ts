import type { BadgeTone } from "@/types/ui";

export const BADGE_TONE_CLASSES: Record<BadgeTone, string> = {
  default: "border border-border bg-surface text-foreground-muted",
  accent: "border border-accent-muted bg-accent-muted text-accent",
  warn: "border border-warning-muted bg-warning-muted text-warning",
  good: "border border-success-muted bg-success-muted text-success",
  dark: "border border-foreground bg-foreground text-background",
};

export function badgeToneClasses(tone: BadgeTone): string {
  return BADGE_TONE_CLASSES[tone];
}
