import { createPinia, setActivePinia } from 'pinia'
import { effectScope, nextTick } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useCheckProgress } from '@/features/checks/composables/useCheckProgress'
import type { CheckEventHandlers, CheckRecord } from '@/features/checks/types'

const routeState = vi.hoisted(() => ({
  params: { checkId: 'check-1' } as Record<string, string>,
}))
const envState = vi.hoisted(() => ({
  showDevTools: false,
}))
const getCheckMock = vi.hoisted(() => vi.fn<() => Promise<CheckRecord>>())
const subscribeCheckEventsMock = vi.hoisted(() =>
  vi.fn<
    (
      checkId: string,
      handlers: CheckEventHandlers,
      options?: { eventsUrl?: string; afterSeq?: number },
    ) => { close: () => void }
  >(),
)

vi.mock('vue-router', () => ({
  useRoute: () => routeState,
}))

vi.mock('@/app/env', () => ({
  get showDevTools() {
    return envState.showDevTools
  },
}))

vi.mock('@/features/checks/api/checksApi', () => ({
  getCheck: getCheckMock,
  subscribeCheckEvents: subscribeCheckEventsMock,
}))

function makeRecord(status: CheckRecord['status']): CheckRecord {
  const updatedAt = '2026-04-23T12:00:00.000Z'
  const phase = status === 'completed' ? 'completed' : status === 'failed' ? 'failed' : 'accepted'

  return {
    checkId: 'check-1',
    status,
    progress: {
      checkId: 'check-1',
      status,
      phase,
      percent: status === 'completed' || status === 'failed' ? 100 : 5,
      message: status === 'completed' ? 'Check complete.' : 'Check accepted.',
      eventSeq: status === 'completed' ? 10 : 1,
      updatedAt,
    },
    result: null,
    error: null,
    createdAt: updatedAt,
    updatedAt,
    completedAt: status === 'completed' ? updatedAt : null,
  }
}

async function mountComposable() {
  const scope = effectScope()
  const state = scope.run(() => useCheckProgress())

  await nextTick()
  await Promise.resolve()

  return { scope, state: state! }
}

describe('useCheckProgress', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    routeState.params = { checkId: 'check-1' }
    envState.showDevTools = false
    getCheckMock.mockReset()
    getCheckMock.mockResolvedValue(makeRecord('running'))
    subscribeCheckEventsMock.mockReset()
    subscribeCheckEventsMock.mockReturnValue({ close: vi.fn<() => void>() })
  })

  it('hides demo evidence when dev tools are not shown', async () => {
    const { scope, state } = await mountComposable()

    expect(state.evidenceItems.value).toEqual([])

    scope.stop()
  })

  it('keeps demo evidence available for mock dev tools', async () => {
    envState.showDevTools = true
    const { scope, state } = await mountComposable()

    expect(state.evidenceItems.value.length).toBeGreaterThan(0)

    scope.stop()
  })

  it('falls back to reloading the check record when the progress stream finally fails', async () => {
    getCheckMock
      .mockResolvedValueOnce(makeRecord('running'))
      .mockResolvedValueOnce(makeRecord('completed'))
    let streamHandlers: CheckEventHandlers | null = null
    subscribeCheckEventsMock.mockImplementation((_, handlers) => {
      streamHandlers = handlers
      return { close: vi.fn<() => void>() }
    })
    const { scope, state } = await mountComposable()

    streamHandlers!.onError?.(new Error('SSE unavailable'))
    await nextTick()
    await Promise.resolve()

    expect(state.progress.value?.status).toBe('completed')
    expect(state.eventError.value).toBeNull()

    scope.stop()
  })
})
