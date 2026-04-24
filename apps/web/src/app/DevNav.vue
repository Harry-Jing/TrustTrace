<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { devResetCheckProgress, devSetCheckFailed } from '@/features/checks/api/checksApi'
import { DEMO_CHECK_ID } from '@/features/checks/fixtures/demoChecks'

const router = useRouter()
const route = useRoute()
const open = ref(false)

const currentPage = computed(() => String(route.name ?? 'landing'))

const pages = [
  { name: 'landing', path: '/', label: 'New' },
  { name: 'loading', path: `/checks/${DEMO_CHECK_ID}/loading`, label: 'Loading' },
  { name: 'result', path: `/checks/${DEMO_CHECK_ID}/result`, label: 'Result' },
  { name: 'error', path: `/checks/${DEMO_CHECK_ID}/error`, label: 'Error' },
  { name: 'history', path: '/history', label: 'History' },
] as const

const LOADING_PATH = `/checks/${DEMO_CHECK_ID}/loading`
const ERROR_PATH = `/checks/${DEMO_CHECK_ID}/error`

function navigateTo(path: string) {
  if (path === LOADING_PATH) {
    devResetCheckProgress(DEMO_CHECK_ID)
  } else if (path === ERROR_PATH) {
    devSetCheckFailed(DEMO_CHECK_ID)
  }

  void router.push(path)
  window.scrollTo({ top: 0, behavior: 'smooth' })
  open.value = false
}
</script>

<template>
  <div class="fixed right-4 bottom-4 z-50 flex flex-col items-end gap-1.5">
    <!-- Expanded menu -->
    <Transition name="dev-menu">
      <div
        v-if="open"
        class="mb-1 flex flex-col gap-1 rounded-lg bg-ink/90 p-1.5 shadow-lg backdrop-blur-sm"
      >
        <button
          v-for="page in pages"
          :key="page.name"
          class="rounded-md border-none px-3 py-1.5 text-left font-mono text-[11px] tracking-wide transition-colors duration-150"
          :class="
            currentPage === page.name
              ? 'bg-accent font-semibold text-white'
              : 'bg-transparent text-surface/70 hover:bg-surface/10 hover:text-surface'
          "
          @click="navigateTo(page.path)"
        >
          {{ page.label }}
        </button>
      </div>
    </Transition>

    <!-- FAB toggle -->
    <button
      class="flex size-9 items-center justify-center rounded-full border-none bg-ink/80 text-surface shadow-lg backdrop-blur-sm transition-all duration-200 hover:scale-110 hover:bg-ink"
      :class="open ? 'rotate-45' : ''"
      aria-label="Dev navigation"
      @click="open = !open"
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        stroke-linecap="round"
      >
        <line x1="8" y1="3" x2="8" y2="13" />
        <line x1="3" y1="8" x2="13" y2="8" />
      </svg>
    </button>
  </div>
</template>

<style scoped>
.dev-menu-enter-active,
.dev-menu-leave-active {
  transition:
    opacity 0.15s ease,
    transform 0.15s ease;
  transform-origin: bottom right;
}

.dev-menu-enter-from,
.dev-menu-leave-to {
  opacity: 0;
  transform: scale(0.9) translateY(4px);
}
</style>
