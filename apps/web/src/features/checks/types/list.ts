import type { VerdictBand } from "@/features/checks/types/resultViewModel";

export type CheckListSort = "date" | "cue";

export interface CheckListItem {
  checkId: string;
  claim: string;
  snippet: string;
  createdAt: string;
  /**
   * Human-readable label for display only (e.g. "evidence strong",
   * "checking", "failed"). Do not parse for sorting — use `verdictBand`.
   */
  cue: string;
  /**
   * Stable enum used for sort order and visual treatment. Null while
   * the check is queued or running (no band has been chosen yet).
   * Tone is derived from this client-side via `evidenceToneFor`.
   */
  verdictBand: VerdictBand | null;
}
