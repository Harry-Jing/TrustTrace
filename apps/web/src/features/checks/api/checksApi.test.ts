import { afterEach, describe, expect, it, vi } from 'vitest'

import { createCheck, getCheck, subscribeCheckEvents } from '@/features/checks/api/checksApi'

describe('checksApi backend-shaped mock', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('creates a running check and returns the created record by id', async () => {
    const response = await createCheck({ mode: 'text', value: 'A claim to check' })

    expect(response.checkId).toMatch(/^mock-check-/)
    expect(response.status).toBe('running')
    expect(response.progress.phase).toBe('accepted')
    expect(response.eventsUrl).toBe(`/v1/checks/${response.checkId}/events`)

    const record = await getCheck(response.checkId)
    expect(record.checkId).toBe(response.checkId)
    expect(record.status).toBe('running')
    expect(record.progress.eventSeq).toBe(1)
  })

  it('streams mock progress events through completion', async () => {
    vi.useFakeTimers()
    const response = await createCheck({ mode: 'text', value: 'A claim to stream' })
    const events: string[] = []
    const onClose = vi.fn<() => void>()

    subscribeCheckEvents(response.checkId, {
      onEvent: (event) => events.push(event.phase),
      onClose,
    })

    await vi.runAllTimersAsync()

    expect(events).toEqual(['accepted', 'analyzing', 'synthesizing', 'persisting', 'completed'])
    expect(onClose).toHaveBeenCalledTimes(1)

    const record = await getCheck(response.checkId)
    expect(record.status).toBe('completed')
    expect(record.result?.id).toBe(response.checkId)
  })

  it('stops streaming when the subscription is closed', async () => {
    vi.useFakeTimers()
    const response = await createCheck({ mode: 'text', value: 'A claim to cancel' })
    const events: string[] = []

    const subscription = subscribeCheckEvents(response.checkId, {
      onEvent: (event) => events.push(event.phase),
    })
    subscription.close()

    await vi.runAllTimersAsync()

    expect(events).toEqual([])
  })
})
