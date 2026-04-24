import { computed } from 'vue'

import { listChecks } from '@/features/checks/api/checksApi'
import { useAsyncData } from '@/shared/composables/useAsyncData'

const RECENT_LIMIT = 5

export function useRecentChecks() {
  const state = useAsyncData(() => listChecks({ limit: RECENT_LIMIT }))
  const recentChecks = computed(() => state.data.value ?? [])

  return { recentChecks, ...state }
}
