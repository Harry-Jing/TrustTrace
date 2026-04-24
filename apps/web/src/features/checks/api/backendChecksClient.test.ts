import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { subscribeCheckEvents } from '@/features/checks/api/backendChecksClient'

class MockEventSource {
  static instances: MockEventSource[] = []

  readonly url: string | URL
  onmessage: ((event: MessageEvent<string>) => void) | null = null
  onerror: ((event: Event) => void) | null = null
  readonly close = vi.fn<() => void>()
  private readonly listeners = new Map<string, Array<(event: MessageEvent<string>) => void>>()

  constructor(url: string | URL) {
    this.url = url
    MockEventSource.instances.push(this)
  }

  addEventListener(type: string, listener: EventListenerOrEventListenerObject) {
    const eventListener =
      typeof listener === 'function'
        ? (listener as (event: MessageEvent<string>) => void)
        : (event: MessageEvent<string>) => listener.handleEvent(event)
    this.listeners.set(type, [...(this.listeners.get(type) ?? []), eventListener])
  }

  emitProgress(data: Record<string, unknown>) {
    this.emitRaw(JSON.stringify(data))
  }

  emitRaw(data: string) {
    const event = new MessageEvent<string>('progress', { data })
    this.listeners.get('progress')?.forEach((listener) => listener(event))
  }

  fail() {
    this.onerror?.(new Event('error'))
  }
}

describe('backendChecksClient subscribeCheckEvents', () => {
  const originalEventSource = globalThis.EventSource

  beforeEach(() => {
    MockEventSource.instances = []
    globalThis.EventSource = MockEventSource as unknown as typeof EventSource
  })

  afterEach(() => {
    vi.useRealTimers()
    globalThis.EventSource = originalEventSource
  })

  it('uses the supplied eventsUrl and resumes transient reconnects after the last event seq', async () => {
    vi.useFakeTimers()
    const onError = vi.fn<(error: unknown) => void>()
    const onEvent = vi.fn<(event: unknown) => void>()

    subscribeCheckEvents('check-1', { onEvent, onError }, { eventsUrl: '/v1/custom/events' })

    expect(String(MockEventSource.instances[0]!.url)).toBe('/v1/custom/events')

    MockEventSource.instances[0]!.emitProgress({
      seq: 7,
      check_id: 'check-1',
      status: 'running',
      phase: 'analyzing',
      percent: 35,
      message: 'Analyzing sources.',
      created_at: '2026-04-23T12:00:00.000Z',
    })
    MockEventSource.instances[0]!.fail()

    expect(onError).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(500)

    expect(String(MockEventSource.instances[1]!.url)).toBe('/v1/custom/events?after_seq=7')
  })

  it('reports a stream error only after reconnect attempts are exhausted', async () => {
    vi.useFakeTimers()
    const onError = vi.fn<(error: unknown) => void>()
    const onClose = vi.fn<() => void>()

    subscribeCheckEvents(
      'check-1',
      { onError, onClose },
      { eventsUrl: '/v1/checks/check-1/events' },
    )

    MockEventSource.instances[0]!.fail()
    await vi.advanceTimersByTimeAsync(500)
    MockEventSource.instances[1]!.fail()
    await vi.advanceTimersByTimeAsync(1000)
    MockEventSource.instances[2]!.fail()
    await vi.advanceTimersByTimeAsync(2000)

    expect(onError).not.toHaveBeenCalled()

    MockEventSource.instances[3]!.fail()

    expect(onError).toHaveBeenCalledOnce()
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('ignores duplicate or stale progress events', () => {
    const onEvent = vi.fn<(event: unknown) => void>()

    subscribeCheckEvents('check-1', { onEvent }, { eventsUrl: '/v1/checks/check-1/events' })

    MockEventSource.instances[0]!.emitProgress({
      seq: 2,
      check_id: 'check-1',
      status: 'running',
      phase: 'analyzing',
      percent: 40,
      message: 'Analyzing sources.',
      created_at: '2026-04-23T12:00:00.000Z',
    })
    MockEventSource.instances[0]!.emitProgress({
      seq: 1,
      check_id: 'check-1',
      status: 'running',
      phase: 'accepted',
      percent: 5,
      message: 'Accepted.',
      created_at: '2026-04-23T11:59:59.000Z',
    })
    MockEventSource.instances[0]!.emitProgress({
      seq: 2,
      check_id: 'check-1',
      status: 'running',
      phase: 'analyzing',
      percent: 40,
      message: 'Analyzing sources.',
      created_at: '2026-04-23T12:00:00.000Z',
    })

    expect(onEvent).toHaveBeenCalledOnce()
  })
})
