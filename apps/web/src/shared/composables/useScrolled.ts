import { onMounted, onScopeDispose, ref } from 'vue'

export function useScrolled(threshold = 0) {
  const isScrolled = ref(false)

  function update() {
    isScrolled.value = window.scrollY > threshold
  }

  onMounted(() => {
    update()
    window.addEventListener('scroll', update, { passive: true })
  })

  onScopeDispose(() => {
    window.removeEventListener('scroll', update)
  })

  return { isScrolled }
}
