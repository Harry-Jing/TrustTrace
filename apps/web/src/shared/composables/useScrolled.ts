import { onMounted, onScopeDispose, ref } from 'vue'

export function useScrolled(threshold = 0) {
  const isScrolled = ref(false)
  let animationFrameId: number | null = null

  function update() {
    animationFrameId = null
    isScrolled.value = window.scrollY > threshold
  }

  function scheduleUpdate() {
    if (animationFrameId !== null) return
    animationFrameId = window.requestAnimationFrame(update)
  }

  onMounted(() => {
    update()
    window.addEventListener('scroll', scheduleUpdate, { passive: true })
  })

  onScopeDispose(() => {
    window.removeEventListener('scroll', scheduleUpdate)
    if (animationFrameId !== null) {
      window.cancelAnimationFrame(animationFrameId)
    }
  })

  return { isScrolled }
}
