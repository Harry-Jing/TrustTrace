<script setup lang="ts">
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";

import BaseTagBadge from "@/components/BaseTagBadge.vue";
import { useScrolled } from "@/shared/composables/useScrolled";
import { usePreferencesStore } from "@/stores/preferences.store";

const router = useRouter();
const route = useRoute();
const preferences = usePreferencesStore();
const { isScrolled } = useScrolled();

const currentPage = computed(() => String(route.name ?? "landing"));

function navigate(name: string) {
  void router.push({ name });
  window.scrollTo({ top: 0, behavior: "smooth" });
}
</script>

<template>
  <nav
    class="sticky top-0 z-20 flex h-14 items-center border-b border-border bg-nav px-7 backdrop-blur transition-[background,border-color,box-shadow] duration-400"
    :class="{ 'shadow-nav-scrolled': isScrolled }"
  >
    <div class="flex flex-1 items-center">
      <button
        type="button"
        class="cursor-pointer border-none bg-transparent p-0 font-serif text-h3 text-foreground transition-colors duration-400"
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
      <!-- Settings gear -->
      <button
        type="button"
        class="tt-btn tt-icon-btn flex size-9 items-center justify-center rounded-full border border-border bg-transparent text-foreground-subtle transition-colors duration-200"
        :class="{ 'text-foreground': currentPage === 'settings' }"
        aria-label="Open settings"
        @click="navigate('settings')"
      >
        <svg
          class="size-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.6"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="3" />
          <path
            d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09A1.65 1.65 0 0 0 15 4.6a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
          />
        </svg>
      </button>

      <!-- Theme toggle: visual 36×36 stays proportionate inside the 56px nav;
           tt-icon-btn extends the hit area to 44px (Apple HIG). -->
      <button
        type="button"
        class="tt-btn tt-icon-btn flex size-9 items-center justify-center rounded-full border border-border bg-transparent text-foreground-subtle transition-colors duration-200"
        aria-label="Toggle theme"
        @click="preferences.toggleTheme"
      >
        <!-- Sun icon (light mode active → click to switch to dark) -->
        <svg
          v-if="preferences.effectiveTheme !== 'dark'"
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
        v-if="currentPage === 'history' || currentPage === 'settings'"
        type="button"
        class="tt-btn rounded-full border border-border bg-transparent px-4 py-2.5 text-caption font-medium text-foreground-subtle"
        @click="navigate('landing')"
      >
        {{ currentPage === "settings" ? "Done" : "New check" }}
      </button>
      <button
        v-else
        type="button"
        class="tt-btn rounded-full border border-border bg-transparent px-4 py-2.5 text-caption font-medium text-foreground-subtle"
        @click="navigate('history')"
      >
        History
      </button>
    </div>
  </nav>
</template>
