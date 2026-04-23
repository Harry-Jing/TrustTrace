import { computed, shallowRef, type Ref } from 'vue'

import type { AsyncStatus } from '@/types/async'

export interface AsyncDataState<T> {
  data: Ref<T | null>
  error: Ref<unknown>
  status: Ref<AsyncStatus>
  isLoading: Readonly<Ref<boolean>>
  isError: Readonly<Ref<boolean>>
  reload: () => Promise<T | null>
}

export function useAsyncData<T>(
  loader: () => Promise<T>,
  options: { immediate?: boolean } = {},
): AsyncDataState<T> {
  const data = shallowRef<T | null>(null) as Ref<T | null>
  const error = shallowRef<unknown>(null) as Ref<unknown>
  const status = shallowRef<AsyncStatus>('idle') as Ref<AsyncStatus>

  let seq = 0

  async function reload() {
    const current = ++seq
    status.value = 'loading'
    error.value = null

    try {
      const value = await loader()
      if (current !== seq) return null
      data.value = value
      status.value = 'success'
      return value
    } catch (caught) {
      if (current !== seq) return null
      error.value = caught
      status.value = 'error'
      return null
    }
  }

  if (options.immediate !== false) {
    void reload()
  }

  return {
    data,
    error,
    status,
    isLoading: computed(() => status.value === 'loading'),
    isError: computed(() => status.value === 'error'),
    reload,
  }
}
