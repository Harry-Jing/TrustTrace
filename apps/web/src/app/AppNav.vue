<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import BaseTagBadge from '@/components/BaseTagBadge.vue'
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
        type="button"
        class="cursor-pointer border-none bg-transparent p-0 font-serif text-[22px] tracking-tight text-ink transition-colors duration-400"
        @click="navigate('landing')"
      >
        TrustTrace
      </button>
    </div>

    <!-- Center status (hidden below sm to avoid colliding with logo + right
         buttons on narrow viewports; the page itself shows status via heading
         and badge content, so this is a redundant cue on mobile). -->
    <div
      v-if="currentPage === 'loading'"
      class="absolute left-1/2 hidden -translate-x-1/2 sm:block"
    >
      <BaseTagBadge tone="accent">checking…</BaseTagBadge>
    </div>
    <div
      v-else-if="currentPage === 'result'"
      class="absolute left-1/2 hidden -translate-x-1/2 sm:block"
    >
      <BaseTagBadge tone="dark">check complete</BaseTagBadge>
    </div>
    <div
      v-else-if="currentPage === 'error'"
      class="absolute left-1/2 hidden -translate-x-1/2 sm:block"
    >
      <BaseTagBadge tone="warn">check failed</BaseTagBadge>
    </div>

    <!-- Right side -->
    <div class="flex items-center gap-2">
      <!-- Theme toggle: 36×36 square keeps comfortable touch target while
           staying visually proportionate inside the 56px nav. -->
      <button
        type="button"
        class="tt-btn flex size-9 items-center justify-center rounded-full border border-line bg-transparent text-muted transition-colors duration-200"
        aria-label="Toggle theme"
        @click="preferences.toggleTheme"
      >
        <!-- Sun icon (light mode active → click to switch to dark) -->
        <svg
          v-if="preferences.theme !== 'dark'"
          class="size-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.6"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="4" />
          <path
            d="M12 3v2m0 14v2M3 12h2m14 0h2M5.6 5.6l1.4 1.4m10 10l1.4 1.4M5.6 18.4l1.4-1.4m10-10l1.4-1.4"
          />
        </svg>
        <!-- Moon icon (dark mode active → click to switch to light) -->
        <svg
          v-else
          class="size-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.6"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      </button>

      <!-- Nav link: contextual -->
      <button
        v-if="currentPage === 'history'"
        type="button"
        class="tt-btn rounded-full border border-line bg-transparent px-4 py-2.5 text-xs font-medium text-muted"
        @click="navigate('landing')"
      >
        New check
      </button>
      <button
        v-else
        type="button"
        class="tt-btn rounded-full border border-line bg-transparent px-4 py-2.5 text-xs font-medium text-muted"
        @click="navigate('history')"
      >
        History
      </button>
    </div>
  </nav>
</template>
