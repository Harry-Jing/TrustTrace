import { VERDICT_BAND_ORDER } from "@trusttrace/contracts/checks";

import type { VerdictBand } from "@/features/checks/types/resultViewModel";

/**
 * Stable sort weight per verdict band. Lower number = stronger / more
 * conclusive evidence, sorted to the top.
 *
 * Source of truth lives in `@trusttrace/contracts` (`VERDICT_BAND_ORDER`)
 * so the backend and any future consumer share the ordering. We just
 * derive a Record-shaped lookup here for O(1) access from the sort
 * comparator.
 */
export const VERDICT_BAND_ORDER_INDEX: Record<VerdictBand, number> = Object.fromEntries(
  VERDICT_BAND_ORDER.map((band, index) => [band, index]),
) as Record<VerdictBand, number>;

/**
 * Weight assigned to checks that don't yet have a verdict band
 * (queued/running). Sorted after every real band so finished checks
 * dominate the top of the list when sorting by credibility.
 */
export const PENDING_VERDICT_RANK = VERDICT_BAND_ORDER.length;

export function verdictBandRank(band: VerdictBand | null): number {
  return band === null ? PENDING_VERDICT_RANK : VERDICT_BAND_ORDER_INDEX[band];
}
