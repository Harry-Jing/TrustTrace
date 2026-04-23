import { computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { getCheck } from '@/features/checks/api/checksApi'
import { readCheckId } from '@/features/checks/utils'
import { useAsyncData } from '@/shared/composables/useAsyncData'

export function useCheckResult() {
  const route = useRoute()
  const router = useRouter()
  const checkId = computed(() => readCheckId(route.params.checkId))
  const state = useAsyncData(
    () => {
      if (!checkId.value) {
        return Promise.reject(new Error('Missing checkId route parameter'))
      }

      return getCheck(checkId.value)
    },
    { immediate: false },
  )
  const record = computed(() => state.data.value)
  const checkStatus = computed(() => record.value?.status ?? 'queued')
  const result = computed(() => (record.value?.status === 'completed' ? record.value.result : null))

  watch(
    checkId,
    () => {
      void state.reload()
    },
    { immediate: true },
  )

  watch(record, (nextRecord) => {
    if (!nextRecord) return

    if (nextRecord.status === 'queued' || nextRecord.status === 'running') {
      void router.replace({ name: 'loading', params: { checkId: nextRecord.checkId } })
    } else if (nextRecord.status === 'failed') {
      void router.replace({ name: 'error', params: { checkId: nextRecord.checkId } })
    }
  })

  return {
    checkId,
    record,
    checkStatus,
    result,
    isLoading: state.isLoading,
    isError: state.isError,
    error: state.error,
    reload: state.reload,
  }
}
