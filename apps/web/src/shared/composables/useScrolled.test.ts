import { mount } from '@vue/test-utils'
import { defineComponent, nextTick } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useScrolled } from '@/shared/composables/useScrolled'

const ProbeComponent = defineComponent({
  setup() {
    return useScrolled(10)
  },
  template: '<span>{{ isScrolled }}</span>',
})

describe('useScrolled', () => {
  let animationFrameCallback: FrameRequestCallback | null = null

  beforeEach(() => {
    animationFrameCallback = null
    Object.defineProperty(window, 'scrollY', { value: 0, configurable: true })
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      animationFrameCallback = callback
      return 1
    })
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('updates scroll state inside a requestAnimationFrame callback', async () => {
    const wrapper = mount(ProbeComponent)

    await nextTick()
    expect(wrapper.text()).toBe('false')

    Object.defineProperty(window, 'scrollY', { value: 20, configurable: true })
    window.dispatchEvent(new Event('scroll'))

    expect(wrapper.text()).toBe('false')

    animationFrameCallback?.(0)
    await nextTick()

    expect(wrapper.text()).toBe('true')
  })
})
