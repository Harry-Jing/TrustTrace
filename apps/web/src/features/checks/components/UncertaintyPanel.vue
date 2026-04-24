<script setup lang="ts">
import BaseTagBadge from '@/components/BaseTagBadge.vue'

defineProps<{
  lines: readonly string[]
}>()
</script>

<template>
  <div class="border-l-[3px] border-warn pl-5">
    <div class="mb-2.5 flex items-center gap-2.5">
      <span class="font-serif text-xl">Uncertainty & context</span>
      <BaseTagBadge tone="warn">important context</BaseTagBadge>
    </div>
    <p v-for="(line, i) in lines" :key="i" class="text-body-sm mb-2.5 leading-[1.75] text-ink-2">
      {{ line }}
    </p>
    <div class="mt-3.5 border-t border-dashed border-line pt-3.5">
      <div class="text-body-sm leading-[1.75] text-ink-2">
        <strong>Remember:</strong> familiar framing can bias reasoning. Check whether independent
        sources agree on the same concrete facts, not just the general direction.
      </div>
    </div>
  </div>
</template>
