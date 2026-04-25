import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import type { ComputedRef, Ref } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { PHASE_DEFINITIONS } from '@/features/checks/constants/checkProgress'
import CheckLoadingPage from './CheckLoadingPage.vue'

const pushMock = vi.hoisted(() => vi.fn<(location: unknown) => void>())
const retryMock = vi.hoisted(() => vi.fn<() => void>())
const loadingState = vi.hoisted(() => ({
  statusRef: null as Ref<string> | null,
  eventErrorRef: null as Ref<unknown> | null,
  isErrorRef: null as Ref<boolean> | null,
  recordRef: null as Ref<Record<string, unknown> | null> | null,
  progressRef: null as Ref<Record<string, unknown> | null> | null,
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
  const constants = await vi.importActual<
    typeof import('@/features/checks/constants/checkProgress')
  >('@/features/checks/constants/checkProgress')

  loadingState.statusRef = vue.ref('running')
  loadingState.eventErrorRef = vue.ref(null)
  loadingState.isErrorRef = vue.ref(false)
  loadingState.recordRef = vue.ref(null)
  loadingState.progressRef = vue.ref(null)
  loadingState.progressErrorRef = vue.computed(
    () => loadingState.isErrorRef!.value || loadingState.eventErrorRef!.value,
  )

  return {
    useCheckProgress: () => ({
      checkId: vue.ref('check-123'),
      phases: constants.CHECK_PHASES,
      activePhases: constants.ACTIVE_PHASES,
      status: loadingState.statusRef,
      phase: vue.ref('understanding'),
      phaseIndex: vue.ref(0),
      activePhaseKey: vue.ref('understanding'),
      phaseDefinition: vue.ref(PHASE_DEFINITIONS.understanding),
      progress: loadingState.progressRef,
      record: loadingState.recordRef,
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
    setActivePinia(createPinia())
    vi.useFakeTimers()
    pushMock.mockReset()
    retryMock.mockReset()
    loadingState.statusRef!.value = 'running'
    loadingState.eventErrorRef!.value = null
    loadingState.isErrorRef!.value = false
    loadingState.recordRef!.value = null
    loadingState.progressRef!.value = null
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

  it('shows the persisted check input after a page refresh clears the store', () => {
    loadingState.recordRef!.value = {
      input: { mode: 'text', value: 'A persisted claim from the backend record' },
    }

    const wrapper = mount(CheckLoadingPage, {
      global: {
        stubs: {
          DevLoadingControls: true,
        },
      },
    })

    expect(wrapper.text()).toContain('A persisted claim from the backend record')
    expect(wrapper.text()).not.toContain('Preparing the claim')
  })

  it('does not echo the backend progress message back as a live status pill', () => {
    loadingState.progressRef!.value = {
      message: 'Backend verified 9 of 12 source URLs.',
      percent: 62,
    }

    const wrapper = mount(CheckLoadingPage, {
      global: {
        stubs: {
          DevLoadingControls: true,
        },
      },
    })

    expect(wrapper.text()).not.toContain('Backend verified 9 of 12 source URLs.')
    expect(wrapper.text()).not.toContain('62%')
    expect(wrapper.text()).not.toMatch(/\b\d{1,3}%/)
  })

  it('does not render a "Check complete." pill when the mock script finishes', () => {
    loadingState.progressRef!.value = {
      message: 'Check complete.',
      percent: 100,
    }

    const wrapper = mount(CheckLoadingPage, {
      global: {
        stubs: {
          DevLoadingControls: true,
        },
      },
    })

    // Phase header + trust line still present, no live status pill.
    expect(wrapper.text()).toContain(
      'Sources are verified for safety and substance before they become evidence.',
    )
    expect(wrapper.text()).not.toContain('Check complete.')
    // Only two aria-live regions: the claim heading and the phase header
    // (which announces phase changes to screen readers). No status pill.
    expect(wrapper.findAll('[aria-live="polite"]').length).toBe(2)
  })

  it('keeps the trust line as the only quiet content under the phase header', () => {
    loadingState.progressRef!.value = null

    const wrapper = mount(CheckLoadingPage, {
      global: {
        stubs: {
          DevLoadingControls: true,
        },
      },
    })

    expect(wrapper.text()).toContain(
      'Sources are verified for safety and substance before they become evidence.',
    )
    expect(wrapper.findAll('[aria-live="polite"]').length).toBe(2)
  })
})
