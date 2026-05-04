import type { UncertaintyLevel } from "@/features/checks/types";

/**
 * At-a-glance uncertainty stat — text-color class per level.
 *
 * Not a domain tone module: uncertainty has no palette of its own,
 * it just rides the generic foreground lightness ramp (subtle →
 * muted → foreground) so high uncertainty looks heaviest, not most
 * alarming. The point is to keep the choice in one place rather
 * than scattering `text-foreground-*` strings across components.
 */
export const UNCERTAINTY_LEVEL_TEXT_CLASSES: Record<UncertaintyLevel, string> = {
  low: "text-foreground-subtle",
  med: "text-foreground-muted",
  high: "text-foreground",
};
