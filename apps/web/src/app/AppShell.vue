<script setup lang="ts">
import { nextTick, onErrorCaptured, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import AppNav from '@/app/AppNav.vue'
import DevNav from '@/app/DevNav.vue'
import { showDevTools } from '@/app/env'
import { usePreferencesStore } from '@/stores/preferences.store'

const router = useRouter()
const route = useRoute()
const preferences = usePreferencesStore()
const mainEl = ref<HTMLElement | null>(null)
const transitionName = ref('page-same')
const renderError = ref<Error | null>(null)

preferences.applyTheme()

onErrorCaptured((err) => {
  renderError.value = err instanceof Error ? err : new Error(String(err))
  return false
})

router.afterEach((to, from) => {
  const toDepth = to.meta.depth ?? 0
  const fromDepth = from.meta.depth ?? 0

  if (toDepth > fromDepth) {
    transitionName.value = 'page-forward'
  } else if (toDepth < fromDepth) {
    transitionName.value = 'page-back'
  } else {
    transitionName.value = 'page-same'
  }
})

watch(
  () => route.fullPath,
  async () => {
    await nextTick()
    mainEl.value?.focus({ preventScroll: true })
  },
)
</script>

<template>
  <div class="min-h-screen bg-surface text-ink transition-[background,color] duration-400">
    <a class="skip-link" href="#main-content">Skip to content</a>
    <AppNav />

    <!-- Page content with transition -->
    <main id="main-content" ref="mainEl" tabindex="-1">
      <div v-if="renderError" class="mx-auto max-w-[480px] px-6 py-20 text-center">
        <p class="mb-4 text-muted">Something went wrong.</p>
        <button
          class="tt-btn rounded-md border border-line px-5 py-2 text-sm text-ink"
          @click="renderError = null"
        >
          Try again
        </button>
      </div>
      <RouterView v-else v-slot="{ Component }">
        <Transition :name="transitionName" mode="out-in">
          <component :is="Component" :key="route.path" />
        </Transition>
      </RouterView>
    </main>

    <DevNav v-if="showDevTools" />
  </div>
</template>
