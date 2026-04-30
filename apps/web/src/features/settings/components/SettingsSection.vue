<script setup lang="ts">
import BaseComingSoonPill from "@/components/BaseComingSoonPill.vue";

defineProps<{
  id: string;
  eyebrow: string;
  title: string;
  description?: string;
  comingSoon?: boolean;
  disabled?: boolean;
  isFirst?: boolean;
}>();
</script>

<template>
  <section
    :id="id"
    class="scroll-mt-24"
    :class="{ 'mt-12 border-t border-border pt-12': !isFirst, 'mt-0': isFirst }"
    :aria-disabled="disabled || undefined"
  >
    <header class="mb-7">
      <div class="flex items-center gap-3">
        <span
          class="font-mono text-label tracking-[0.12em] text-foreground-subtle uppercase"
          aria-hidden="true"
        >
          {{ eyebrow }}
        </span>
        <BaseComingSoonPill v-if="comingSoon" />
      </div>
      <h2 class="mt-3 font-serif text-h3 text-foreground">
        {{ title }}
      </h2>
      <p v-if="description" class="mt-3 max-w-readable text-body text-foreground-muted">
        {{ description }}
      </p>
    </header>

    <div :class="{ 'opacity-60': disabled }">
      <slot />
    </div>
  </section>
</template>
