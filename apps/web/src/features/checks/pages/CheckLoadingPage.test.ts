import { mount } from '@vue/test-utils'
import type { ComputedRef, Ref } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import CheckLoadingPage from './CheckLoadingPage.vue'

const pushMock = vi.hoisted(() => vi.fn<(location: unknown) => void>())
const retryMock = vi.hoisted(() => vi.fn<() => void>())
const loadingState = vi.hoisted(() => ({
  statusRef: null as Ref<string> | null,
  eventErrorRef: null as Ref<unknown> | null,
  isErrorRef: null as Ref<boolean> | null,
  progressErrorRef: null as ComputedRef<unknown> | null,
  showDevTools: false,
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}))

vi.mock('@/app/env', () => ({
  get showDevTools() {
    return loadingState.showDevTools
  },
}))

vi.mock('@/features/checks/composables/useCheckProgress', async () => {
  const vue = await vi.importActual<typeof import('vue')>('vue')
  loadingState.statusRef = vue.ref('running')
  loadingState.eventErrorRef = vue.ref(null)
  loadingState.isErrorRef = vue.ref(false)
  loadingState.progressErrorRef = vue.computed(
    () => loadingState.isErrorRef!.value || loadingState.eventErrorRef!.value,
  )

  return {
    useCheckProgress: () => ({
      checkId: vue.ref('check-123'),
      phases: ['accepted', 'analyzing', 'synthesizing', 'persisting', 'completed'],
      status: loadingState.statusRef,
      phase: vue.ref('accepted'),
      phaseIndex: vue.ref(0),
      tip: vue.ref('Think about where you first saw this claim.'),
      evidenceItems: vue.ref([]),
      isLoading: vue.ref(false),
      isError: loadingState.isErrorRef,
      eventError: loadingState.eventErrorRef,
      progressError: loadingState.progressErrorRef,
      retry: retryMock,
      setPhase: vi.fn<(phase: unknown) => void>(),
    }),
  }
})

describe('CheckLoadingPage', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    pushMock.mockReset()
    retryMock.mockReset()
    loadingState.statusRef!.value = 'running'
    loadingState.eventErrorRef!.value = null
    loadingState.isErrorRef!.value = false
    loadingState.showDevTools = false
  })

  it('auto-redirects completed checks when dev tools are not shown', async () => {
    const wrapper = mount(CheckLoadingPage, {
      global: {
        stubs: {
          DevLoadingControls: true,
        },
      },
    })

    loadingState.statusRef!.value = 'completed'
    await wrapper.vm.$nextTick()
    await vi.runAllTimersAsync()

    expect(pushMock).toHaveBeenCalledWith({ name: 'result', params: { checkId: 'check-123' } })
  })

  it('shows a retryable progress error instead of waiting forever', async () => {
    loadingState.eventErrorRef!.value = new Error('SSE disconnected')
    const wrapper = mount(CheckLoadingPage, {
      global: {
        stubs: {
          DevLoadingControls: true,
        },
      },
    })

    expect(wrapper.text()).toContain('Could not load progress')
    await wrapper.find('button').trigger('click')

    expect(retryMock).toHaveBeenCalledOnce()
  })
})
