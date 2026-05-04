import { computed, ref } from "vue";

import { listChecks } from "@/features/checks/api/checksApi";
import { verdictBandRank } from "@/features/checks/constants/history";
import type { CheckListItem, CheckListSort } from "@/features/checks/types";
import { useAsyncData } from "@/shared/composables/useAsyncData";

function compareByVerdictBand(a: CheckListItem, b: CheckListItem): number {
  const rankDelta = verdictBandRank(a.verdictBand) - verdictBandRank(b.verdictBand);
  if (rankDelta !== 0) return rankDelta;
  // Tie-break by recency so checks within the same band stay date-ordered.
  return b.createdAt.localeCompare(a.createdAt);
}

function compareByDate(a: CheckListItem, b: CheckListItem): number {
  return b.createdAt.localeCompare(a.createdAt);
}

export function useCheckHistory() {
  const search = ref("");
  const sortBy = ref<CheckListSort>("date");
  const state = useAsyncData(() => listChecks());

  const items = computed(() => {
    const query = search.value.toLowerCase();
    const filtered = (state.data.value ?? []).filter(
      (historyItem) =>
        !query ||
        historyItem.claim.toLowerCase().includes(query) ||
        historyItem.snippet.toLowerCase().includes(query),
    );

    const comparator = sortBy.value === "cue" ? compareByVerdictBand : compareByDate;
    return [...filtered].sort(comparator);
  });

  return { search, sortBy, items, ...state };
}
