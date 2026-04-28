<script setup lang="ts">
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
    :class="{ 'mt-12 border-t border-line pt-12': !isFirst, 'mt-0': isFirst }"
    :aria-disabled="disabled || undefined"
  >
    <header class="mb-7">
      <div class="flex items-center gap-3">
        <span
          class="font-mono text-[11px] font-medium tracking-[0.16em] text-muted uppercase"
          aria-hidden="true"
        >
          {{ eyebrow }}
        </span>
        <span
          v-if="comingSoon"
          class="inline-flex items-center rounded-full border border-line bg-surface-alt px-2 py-0.5 font-mono text-[10px] font-medium tracking-[0.06em] text-muted uppercase"
        >
          coming soon
        </span>
      </div>
      <h2 class="mt-3 font-serif text-[clamp(24px,3vw,30px)] leading-tight tracking-tight text-ink">
        {{ title }}
      </h2>
      <p v-if="description" class="mt-3 max-w-160 text-[15px] leading-[1.6] text-ink-2">
        {{ description }}
      </p>
    </header>

    <div :class="{ 'opacity-60': disabled }">
      <slot />
    </div>
  </section>
</template>
