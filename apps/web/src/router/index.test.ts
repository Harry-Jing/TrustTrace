import { describe, expect, it } from 'vitest'

import { router } from '@/router'

describe('router document title', () => {
  it('updates the document title from route metadata', async () => {
    document.title = 'TrustTrace'

    await router.push({ name: 'history' })
    await router.isReady()

    expect(document.title).toBe('History · TrustTrace')
  })
})
