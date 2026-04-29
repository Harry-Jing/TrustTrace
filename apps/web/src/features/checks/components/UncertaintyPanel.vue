<script setup lang="ts">
defineProps<{
  lines: readonly string[];
}>();
</script>

<template>
  <section>
    <span class="mb-3 block font-mono text-eyebrow text-warning uppercase"> uncertainty </span>
    <ul class="space-y-2">
      <li
        v-for="(line, i) in lines"
        :key="i"
        class="flex items-start gap-2 text-xs leading-[1.6] text-foreground-muted"
      >
        <svg
          class="mt-1 size-2.5 shrink-0 text-warning"
          viewBox="0 0 10 10"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M5 0.5L9.5 9h-9z" />
        </svg>
        <span>{{ line }}</span>
      </li>
    </ul>
  </section>
</template>
