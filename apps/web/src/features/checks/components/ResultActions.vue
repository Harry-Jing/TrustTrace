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
  <div class="mt-8 stagger-4">
    <div class="my-5 h-px bg-line" />
    <div class="flex flex-wrap items-center gap-3">
      <span class="font-mono text-[10px] tracking-[0.1em] text-muted uppercase">
        take it with you
      </span>
      <button
        class="tt-btn text-body-sm rounded-md border-[1.5px] border-accent bg-accent px-5 py-2 font-semibold text-white"
        @click="emit('copy')"
      >
        {{ copied ? '✓ Copied to clipboard' : 'Copy summary' }}
      </button>
      <span class="flex-1" />
      <button
        class="tt-btn text-body-sm rounded-md border border-line bg-transparent px-5 py-2 font-medium text-ink-2"
        @click="router.push({ name: 'landing' })"
      >
        New check
      </button>
    </div>
  </div>
</template>
