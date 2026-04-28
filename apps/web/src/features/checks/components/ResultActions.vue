<script setup lang="ts">
import BaseButton from "@/components/BaseButton.vue";

defineProps<{
  copied: boolean;
}>();

const emit = defineEmits<{
  copy: [];
}>();
</script>

<template>
  <div class="mt-10 stagger-4">
    <div class="flex flex-wrap items-center gap-3 border-t border-line pt-5">
      <span class="font-mono text-eyebrow text-muted uppercase">take it with you</span>
      <BaseButton variant="primary" @click="emit('copy')">
        <svg
          v-if="copied"
          class="size-3.5"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          stroke-width="2.2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M3.5 8.5l3 3 6-6.5" />
        </svg>
        {{ copied ? "Copied to clipboard" : "Copy summary" }}
      </BaseButton>
      <span class="flex-1" />
      <BaseButton variant="subtle" :to="{ name: 'landing' }"> New check </BaseButton>
    </div>
  </div>
</template>
