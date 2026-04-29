<script setup lang="ts">
import type { PhaseDefinition } from "@/features/checks/constants/checkProgress";

defineProps<{
  steps: readonly PhaseDefinition[];
  currentIndex: number;
}>();

function isDone(index: number, currentIndex: number) {
  return index < currentIndex;
}

function isCurrent(index: number, currentIndex: number) {
  return index === currentIndex;
}
</script>

<template>
  <ol
    class="flex w-full items-start gap-0"
    :aria-label="`Progress: step ${currentIndex + 1} of ${steps.length}`"
  >
    <li
      v-for="(step, index) in steps"
      :key="step.key"
      class="relative flex flex-1 flex-col items-center"
      :aria-current="isCurrent(index, currentIndex) ? 'step' : undefined"
    >
      <!-- Connector: grey base + green fill that grows from the left when done.
           When this segment sits between the current and next step it carries a
           shimmer (a warn-colored bar travelling left → right) so the page
           never feels frozen between phase events. -->
      <div
        v-if="index < steps.length - 1"
        class="absolute top-4.5 left-1/2 -z-0 h-px w-full overflow-hidden bg-border"
        aria-hidden="true"
      >
        <div
          class="h-full w-full origin-left bg-success transition-transform duration-500 ease-(--ease-snappy)"
          :style="{ transform: isDone(index, currentIndex) ? 'scaleX(1)' : 'scaleX(0)' }"
        />
        <div
          v-if="isCurrent(index, currentIndex)"
          class="pointer-events-none absolute inset-0 anim-connector-shimmer"
        />
      </div>

      <!-- Numbered circle. The `step-pop` animation key changes when a step
           transitions from current → done so the just-completed circle gets a
           one-shot scale pulse via CSS. The current step gets a continuous,
           breathing halo so the user can see "this is where work is happening". -->
      <div
        class="relative z-10 flex size-9 items-center justify-center rounded-full border-[1.5px] font-mono text-body-sm leading-none transition-all duration-400"
        :class="[
          {
            'border-success bg-success text-card': isDone(index, currentIndex),
            'animate-pulse-ring border-warning bg-warning text-card': isCurrent(
              index,
              currentIndex,
            ),
            'border-border bg-background text-foreground-subtle':
              !isDone(index, currentIndex) && !isCurrent(index, currentIndex),
          },
          isDone(index, currentIndex) && 'step-circle-pop',
        ]"
      >
        <Transition name="step-mark" mode="out-in">
          <svg
            v-if="isDone(index, currentIndex)"
            key="check"
            class="size-4"
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
          <span v-else key="num">{{ step.step }}</span>
        </Transition>
      </div>

      <!-- Label (hidden on small screens; the "now · {phase}" header below carries the
           current-step copy, so per-step labels would just crowd narrow viewports) -->
      <div
        class="mt-3 hidden text-center text-body-sm transition-colors duration-400 sm:block"
        :class="{
          'font-semibold text-foreground': isCurrent(index, currentIndex),
          'font-medium text-foreground-muted': isDone(index, currentIndex),
          'text-foreground-subtle': !isDone(index, currentIndex) && !isCurrent(index, currentIndex),
        }"
      >
        {{ step.shortLabel }}
      </div>
    </li>
  </ol>
</template>
