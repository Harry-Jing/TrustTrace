<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import TagBadge from '@/components/TagBadge.vue'
import { useScrolled } from '@/shared/composables/useScrolled'
import { usePreferencesStore } from '@/stores/preferences.store'

const router = useRouter()
const route = useRoute()
const preferences = usePreferencesStore()
const { isScrolled } = useScrolled()

const currentPage = computed(() => String(route.name ?? 'landing'))

function navigate(name: string) {
  void router.push({ name })
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>

<template>
  <nav
    class="sticky top-0 z-20 flex h-14 items-center border-b border-line bg-nav px-7 backdrop-blur transition-[background,border-color,box-shadow] duration-400"
    :class="{ 'shadow-[0_1px_3px_rgba(0,0,0,0.06)]': isScrolled }"
  >
    <div class="flex flex-1 items-center">
      <button
        class="cursor-pointer border-none bg-transparent p-0 font-serif text-[22px] tracking-tight text-ink transition-colors duration-400"
        @click="navigate('landing')"
      >
        TrustTrace
      </button>
    </div>

    <!-- Center status -->
    <div v-if="currentPage === 'loading'" class="absolute left-1/2 -translate-x-1/2">
      <TagBadge tone="accent">checking…</TagBadge>
    </div>
    <div v-else-if="currentPage === 'result'" class="absolute left-1/2 -translate-x-1/2">
      <TagBadge tone="accent">check complete</TagBadge>
    </div>
    <div v-else-if="currentPage === 'error'" class="absolute left-1/2 -translate-x-1/2">
      <TagBadge tone="warn">check failed</TagBadge>
    </div>

    <!-- Right side -->
    <div class="flex items-center gap-2">
      <!-- Theme toggle -->
      <button
        class="tt-btn rounded-full border border-line bg-transparent px-3 py-1 font-mono text-[11px] font-medium text-muted"
        aria-label="Toggle theme"
        @click="preferences.toggleTheme"
      >
        {{ preferences.theme === 'dark' ? '☀' : '☾' }}
      </button>

      <!-- Nav link: contextual -->
      <button
        v-if="currentPage === 'history'"
        class="tt-btn rounded-full border border-line bg-transparent px-3.5 py-1.5 text-xs font-medium text-muted"
        @click="navigate('landing')"
      >
        New check
      </button>
      <button
        v-else
        class="tt-btn rounded-full border border-line bg-transparent px-3.5 py-1.5 text-xs font-medium text-muted"
        @click="navigate('history')"
      >
        History
      </button>
    </div>
  </nav>
</template>
