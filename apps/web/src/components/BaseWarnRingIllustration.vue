<script setup lang="ts">
withDefaults(defineProps<{ size?: number }>(), { size: 72 });
</script>

<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 72 72"
    fill="none"
    class="mx-auto mb-5 block"
    aria-hidden="true"
  >
    <circle
      cx="36"
      cy="36"
      r="30"
      class="stroke-line-strong"
      stroke-width="2"
      stroke-dasharray="8 6"
      opacity=".6"
    />
    <circle
      cx="36"
      cy="36"
      r="30"
      class="stroke-warn"
      stroke-width="2.5"
      stroke-dasharray="40 200"
      stroke-linecap="round"
    />
    <path d="M36 24v16" class="stroke-warn" stroke-width="2.5" stroke-linecap="round" />
    <circle cx="36" cy="46" r="1.5" class="fill-warn" />
  </svg>
</template>
