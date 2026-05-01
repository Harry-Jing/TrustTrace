<script setup lang="ts">
import { defineAsyncComponent, nextTick, onErrorCaptured, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

import AppNav from "@/app/AppNav.vue";
import { showDevTools } from "@/app/env";
import BaseButton from "@/components/BaseButton.vue";
import { usePreferencesStore } from "@/stores/preferences.store";

// Dynamic import: keeps the dev panel and its scenario registry out of the
// production bundle (Vite tree-shakes the unreachable branch when
// `import.meta.env.DEV` is statically false).
const DevPanel = showDevTools
  ? defineAsyncComponent(() => import("@/dev/components/DevPanel.vue"))
  : null;

const router = useRouter();
const route = useRoute();
const preferences = usePreferencesStore();
const mainEl = ref<HTMLElement | null>(null);
const transitionName = ref("page-same");
const renderError = ref<Error | null>(null);

preferences.applyTheme();
preferences.initSystemThemeListener();

onErrorCaptured((err) => {
  renderError.value = err instanceof Error ? err : new Error(String(err));
  return false;
});

router.afterEach((to, from) => {
  renderError.value = null;

  const toDepth = to.meta.depth ?? 0;
  const fromDepth = from.meta.depth ?? 0;

  if (toDepth > fromDepth) {
    transitionName.value = "page-forward";
  } else if (toDepth < fromDepth) {
    transitionName.value = "page-back";
  } else {
    transitionName.value = "page-same";
  }
});

watch(
  () => route.fullPath,
  async () => {
    await nextTick();
    mainEl.value?.focus({ preventScroll: true });
  },
);
</script>

<template>
  <div
    class="duration-tone min-h-screen bg-background text-foreground transition-[background,color]"
  >
    <a class="skip-link" href="#main-content">Skip to content</a>
    <AppNav />

    <!-- Page content with transition -->
    <main id="main-content" ref="mainEl" tabindex="-1">
      <div v-if="renderError" class="mx-auto max-w-alert px-6 py-20 text-center">
        <p class="mb-4 text-foreground-subtle">Something went wrong.</p>
        <BaseButton variant="subtle" @click="renderError = null">Try again</BaseButton>
      </div>
      <RouterView v-else v-slot="{ Component }">
        <Transition :name="transitionName" mode="out-in">
          <component :is="Component" :key="route.path" />
        </Transition>
      </RouterView>
    </main>

    <component :is="DevPanel" v-if="DevPanel" />
  </div>
</template>
