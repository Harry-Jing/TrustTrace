import { computed, ref } from "vue";

import { listChecks } from "@/features/checks/api/checksApi";
import { CUE_ORDER } from "@/features/checks/constants/history";
import type { CheckListSort } from "@/features/checks/types";
import { useAsyncData } from "@/shared/composables/useAsyncData";

export function useCheckHistory() {
  const search = ref("");
  const sortBy = ref<CheckListSort>("date");
  const state = useAsyncData(() => listChecks());

  const items = computed(() => {
    const query = search.value.toLowerCase();
    let filtered = (state.data.value ?? []).filter(
      (historyItem) =>
        !query ||
        historyItem.claim.toLowerCase().includes(query) ||
        historyItem.snippet.toLowerCase().includes(query),
    );

    if (sortBy.value === "cue") {
      filtered = filtered.sort((a, b) => (CUE_ORDER[a.cue] ?? 99) - (CUE_ORDER[b.cue] ?? 99));
    } else {
      filtered = filtered.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }

    return filtered;
  });

  return { search, sortBy, items, ...state };
}
