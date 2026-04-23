import { computed, ref } from 'vue'

import { getCheckHistory } from '@/features/checks/api/checksApi'
import { CUE_ORDER } from '@/features/checks/fixtures/demoChecks'
import type { CheckHistorySort } from '@/features/checks/types'
import { useAsyncData } from '@/shared/composables/useAsyncData'

export function useCheckHistory() {
  const search = ref('')
  const sortBy = ref<CheckHistorySort>('date')
  const state = useAsyncData(getCheckHistory)

  const items = computed(() => {
    const query = search.value.toLowerCase()
    let filtered = (state.data.value ?? []).filter(
      (h) =>
        !query || h.claim.toLowerCase().includes(query) || h.snippet.toLowerCase().includes(query),
    )

    if (sortBy.value === 'cue') {
      filtered = filtered.sort((a, b) => (CUE_ORDER[a.cue] ?? 99) - (CUE_ORDER[b.cue] ?? 99))
    } else {
      filtered = filtered.sort((a, b) => b.ts - a.ts)
    }

    return filtered
  })

  return { search, sortBy, items, ...state }
}
