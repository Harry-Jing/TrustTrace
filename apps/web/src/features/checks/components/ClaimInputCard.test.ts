import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import ClaimInputCard from './ClaimInputCard.vue'

describe('ClaimInputCard', () => {
  it('requires URL input to include an http or https scheme', async () => {
    const wrapper = mount(ClaimInputCard)
    await wrapper.findAll('.claim-mode-toggle__button')[1]!.trigger('click')
    await wrapper.find('input').setValue('foobar.com')
    await wrapper.find('form').trigger('submit')

    expect(wrapper.emitted('submit')).toBeUndefined()
    expect(wrapper.find('button[type="submit"]').attributes('disabled')).toBeDefined()
  })

  it('trims valid URL input before submitting', async () => {
    const wrapper = mount(ClaimInputCard)
    await wrapper.findAll('.claim-mode-toggle__button')[1]!.trigger('click')
    await wrapper.find('input').setValue('  https://example.com/story  ')
    await wrapper.find('form').trigger('submit')

    expect(wrapper.emitted('submit')).toEqual([
      [{ mode: 'url', value: 'https://example.com/story' }],
    ])
  })

  it('trims text input before submitting', async () => {
    const wrapper = mount(ClaimInputCard)
    await wrapper.find('textarea').setValue('  A claim to check  ')
    await wrapper.find('form').trigger('submit')

    expect(wrapper.emitted('submit')).toEqual([[{ mode: 'text', value: 'A claim to check' }]])
  })
})
