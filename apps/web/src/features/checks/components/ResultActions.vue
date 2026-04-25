<script setup lang="ts">
import { useRouter } from 'vue-router'

defineProps<{
  copied: boolean
}>()

const emit = defineEmits<{
  copy: []
}>()

const router = useRouter()
</script>

<template>
  <div class="mt-10 stagger-4">
    <div class="flex flex-wrap items-center gap-3 border-t border-line pt-5">
      <span class="font-mono text-[10px] tracking-[0.12em] text-muted uppercase">
        take it with you
      </span>
      <button
        class="tt-btn rounded-md border border-ink bg-ink px-4 py-2 text-[13px] font-semibold text-surface"
        @click="emit('copy')"
      >
        {{ copied ? '✓ Copied to clipboard' : 'Copy summary' }}
      </button>
      <span class="flex-1" />
      <button
        class="tt-btn rounded-md border border-line bg-transparent px-4 py-2 text-[13px] font-medium text-ink-2"
        @click="router.push({ name: 'landing' })"
      >
        New check
      </button>
    </div>
  </div>
</template>
