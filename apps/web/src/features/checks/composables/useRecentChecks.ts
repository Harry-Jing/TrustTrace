import { computed } from 'vue'

import { getRecentChecks } from '@/features/checks/api/checksApi'
import { useAsyncData } from '@/shared/composables/useAsyncData'

export function useRecentChecks() {
  const state = useAsyncData(getRecentChecks)
  const recentChecks = computed(() => state.data.value ?? [])

  return { recentChecks, ...state }
}
