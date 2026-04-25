<script setup lang="ts">
defineProps<{
  lines: readonly string[]
}>()
</script>

<template>
  <section>
    <span class="mb-3 block font-mono text-[10px] tracking-[0.12em] text-warn uppercase">
      uncertainty
    </span>
    <ul class="space-y-2">
      <li
        v-for="(line, i) in lines"
        :key="i"
        class="flex items-start gap-2 text-[12px] leading-[1.6] text-ink-2"
      >
        <span class="mt-[3px] text-warn" aria-hidden="true">&#9651;</span>
        <span>{{ line }}</span>
      </li>
    </ul>
  </section>
</template>
