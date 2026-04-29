<script setup lang="ts">
defineProps<{
  sections: readonly { id: string; label: string }[];
  activeId: string;
}>();

const emit = defineEmits<{
  select: [id: string];
}>();

function onClick(event: MouseEvent, id: string) {
  event.preventDefault();
  emit("select", id);
}
</script>

<template>
  <nav class="lg:sticky lg:top-20 lg:self-start" aria-label="Settings sections">
    <ul
      class="flex flex-row gap-5 overflow-x-auto border-b border-border pb-3 lg:flex-col lg:gap-1 lg:border-none lg:pb-0"
    >
      <li v-for="section in sections" :key="section.id" class="relative lg:py-1">
        <a
          :href="`#${section.id}`"
          class="relative block py-1 text-body-sm whitespace-nowrap transition-colors duration-200 lg:pl-3"
          :class="
            activeId === section.id
              ? 'font-medium text-foreground'
              : 'text-foreground-subtle hover:text-foreground'
          "
          @click="onClick($event, section.id)"
        >
          <span
            v-if="activeId === section.id"
            aria-hidden="true"
            class="absolute top-1/2 left-0 hidden h-3 w-[2px] -translate-y-1/2 rounded-full bg-foreground lg:block"
          />
          {{ section.label }}
        </a>
      </li>
    </ul>
  </nav>
</template>
