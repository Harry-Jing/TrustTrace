<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";

import BasePageFooter from "@/components/BasePageFooter.vue";
import {
  APP_BUILD_DATE,
  APP_BUILD_LABEL,
  APP_RELEASE_TAG,
  APP_TAGLINE,
  APP_VERSION,
} from "@/features/settings/constants/meta";
import SettingsRadioCard from "@/features/settings/components/SettingsRadioCard.vue";
import SettingsRadioCardGroup from "@/features/settings/components/SettingsRadioCardGroup.vue";
import SettingsRangeSlider from "@/features/settings/components/SettingsRangeSlider.vue";
import SettingsRow from "@/features/settings/components/SettingsRow.vue";
import SettingsSection from "@/features/settings/components/SettingsSection.vue";
import SettingsSegmented from "@/features/settings/components/SettingsSegmented.vue";
import SettingsSidebar from "@/features/settings/components/SettingsSidebar.vue";
import SettingsToggle from "@/features/settings/components/SettingsToggle.vue";
import { usePreferencesStore } from "@/stores/preferences.store";
import type { DiscoveryStrategy } from "@/features/checks/types/progress";
import type { Theme } from "@/types/app";

type ReasoningRigor = "fast" | "balanced" | "strict";

const preferences = usePreferencesStore();

const sections = [
  { id: "discovery", label: "Discovery" },
  { id: "keys", label: "Keys" },
  { id: "appearance", label: "Appearance" },
  { id: "privacy", label: "Privacy" },
  { id: "about", label: "About" },
] as const;

const activeId = ref<string>(sections[0].id);

const themeOptions: readonly { value: Theme; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "auto", label: "Auto" },
];

const reasoningOptions: readonly { value: ReasoningRigor; label: string }[] = [
  { value: "fast", label: "Fast" },
  { value: "balanced", label: "Balanced" },
  { value: "strict", label: "Strict" },
];

// Local placeholder state (not persisted) — disabled controls.
const reasoningRigor = ref<ReasoningRigor>("balanced");
const searchDepth = ref(20);

function setTheme(value: Theme) {
  preferences.setTheme(value);
}

function setStrategy(value: DiscoveryStrategy) {
  preferences.setDiscoveryStrategy(value);
}

function setSaveHistory(value: boolean) {
  preferences.setSaveHistoryLocally(value);
}

function scrollToSection(id: string) {
  if (typeof document === "undefined") return;
  const target = document.getElementById(id);
  if (!target) return;
  target.scrollIntoView({ behavior: "smooth", block: "start" });
}

let observer: IntersectionObserver | null = null;

onMounted(() => {
  if (typeof IntersectionObserver === "undefined") return;

  observer = new IntersectionObserver(
    (entries) => {
      // Pick the topmost intersecting section (largest ratio).
      const intersecting = entries.filter((entry) => entry.isIntersecting);
      if (intersecting.length === 0) return;
      const top = intersecting.reduce((prev, curr) =>
        curr.boundingClientRect.top < prev.boundingClientRect.top ? curr : prev,
      );
      const id = (top.target as HTMLElement).id;
      if (id) activeId.value = id;
    },
    { rootMargin: "-30% 0px -55% 0px", threshold: [0, 0.25, 0.5, 1] },
  );

  for (const section of sections) {
    const el = document.getElementById(section.id);
    if (el) observer.observe(el);
  }
});

onBeforeUnmount(() => {
  observer?.disconnect();
  observer = null;
});
</script>

<template>
  <div class="mx-auto max-w-form px-6 pt-14 pb-15">
    <!-- Header -->
    <div class="max-w-180 stagger-1">
      <span class="font-mono text-[11px] font-medium tracking-[0.16em] text-accent uppercase">
        settings &middot; trusttrace
      </span>
      <h1
        class="mt-4 mb-5 stagger-2 font-serif text-[clamp(30px,4.4vw,42px)] leading-[1.1] tracking-tight"
      >
        Tune how TrustTrace looks for evidence.
      </h1>
      <p class="max-w-150 stagger-3 text-[15px] leading-[1.7] text-ink-2">
        Defaults work for most claims. Open a section to adjust how sources are discovered and what
        the trace shows you.
      </p>
    </div>

    <!-- Two-column layout: sidebar at fixed 160px, content capped at 36rem so
         label/control rows feel balanced. minmax(0,...) prevents grid blowout. -->
    <div class="mt-12 grid gap-8 lg:grid-cols-[160px_minmax(0,36rem)] lg:gap-12">
      <SettingsSidebar :sections="sections" :active-id="activeId" @select="scrollToSection" />

      <div class="min-w-0">
        <!-- Discovery -->
        <SettingsSection
          id="discovery"
          eyebrow="discovery"
          title="How sources are found."
          description="The discovery strategy decides who proposes what to read. Depth and rigor tune that strategy."
          is-first
        >
          <SettingsRow
            label="Discovery strategy"
            helper="Pick the engine that gathers candidate sources."
            layout="stack"
          >
            <SettingsRadioCardGroup
              name="discovery-strategy"
              :model-value="preferences.discoveryStrategy"
              @update:model-value="setStrategy"
            >
              <SettingsRadioCard
                code="search_api"
                value="search_api"
                headline="Index-backed, deterministic."
                description="Queries a search provider and reads the top results. Fast, cheap, well-lit citation paths."
                :badge="{ tone: 'accent', label: 'recommended' }"
              />
              <SettingsRadioCard
                code="llm_web"
                value="llm_web"
                headline="Model-driven exploration."
                description="An LLM plans queries, follows leads, and re-plans on dead ends. Better for fuzzy claims; slower."
                :badge="{ tone: 'warn', label: 'experimental' }"
              />
            </SettingsRadioCardGroup>
          </SettingsRow>

          <SettingsRow
            label="Search depth"
            helper="How many candidate sources to gather before verifying."
            coming-soon
            layout="stack"
          >
            <SettingsRangeSlider :min="3" :max="20" :value="searchDepth" unit="sources" disabled />
          </SettingsRow>

          <SettingsRow
            label="Reasoning rigor"
            helper="Strict pulls full text and cross-checks; fast trusts snippets."
            coming-soon
            is-last
          >
            <SettingsSegmented
              :options="reasoningOptions"
              :model-value="reasoningRigor"
              label="Reasoning rigor"
              disabled
            />
          </SettingsRow>
        </SettingsSection>

        <!-- Keys (entire section disabled) -->
        <SettingsSection
          id="keys"
          eyebrow="keys"
          title="Bring your own."
          description="Stored locally in your browser. Sent only to the provider they're keyed to."
          coming-soon
          disabled
        >
          <p
            class="mb-5 rounded-md border border-dashed border-line bg-surface-alt/60 px-4 py-3 text-[13px] leading-[1.6] text-ink-2"
          >
            Bring-your-own keys aren't wired yet — TrustTrace uses server-side credentials in this
            build.
          </p>

          <SettingsRow
            label="Search provider"
            helper="Used by the search_api strategy."
            layout="stack"
          >
            <div class="space-y-3">
              <div
                class="flex items-center justify-between rounded-md border border-line bg-card px-4 py-3 text-sm text-ink-2"
              >
                <span>Tavily</span>
                <svg
                  class="size-4 text-muted"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.6"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="tvly-…"
                disabled
                class="w-full rounded-md border border-line bg-card px-4 py-3 font-mono text-[13px] text-ink-2 placeholder:text-muted"
              />
              <div
                class="flex items-center justify-between font-mono text-[11px] tracking-[0.04em] text-muted uppercase"
              >
                <span>api key</span>
                <span class="flex items-center gap-1.5">
                  <span class="size-1.5 rounded-full bg-line-strong" aria-hidden="true" />
                  not set
                </span>
              </div>
            </div>
          </SettingsRow>

          <SettingsRow
            label="LLM provider"
            helper="Used by the llm_web strategy."
            is-last
            layout="stack"
          >
            <div class="space-y-3">
              <div
                class="flex items-center justify-between rounded-md border border-line bg-card px-4 py-3 text-sm text-ink-2"
              >
                <span>OpenAI</span>
                <svg
                  class="size-4 text-muted"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.6"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="sk-…"
                disabled
                class="w-full rounded-md border border-line bg-card px-4 py-3 font-mono text-[13px] text-ink-2 placeholder:text-muted"
              />
              <div
                class="flex items-center justify-between font-mono text-[11px] tracking-[0.04em] text-muted uppercase"
              >
                <span>api key</span>
                <span class="flex items-center gap-1.5">
                  <span class="size-1.5 rounded-full bg-line-strong" aria-hidden="true" />
                  not set
                </span>
              </div>
            </div>
          </SettingsRow>
        </SettingsSection>

        <!-- Appearance -->
        <SettingsSection id="appearance" eyebrow="appearance" title="How the trace looks.">
          <SettingsRow label="Theme" helper="Auto follows your system." is-last>
            <SettingsSegmented
              :options="themeOptions"
              :model-value="preferences.theme"
              label="Theme"
              @update:model-value="setTheme"
            />
          </SettingsRow>
        </SettingsSection>

        <!-- Privacy -->
        <SettingsSection
          id="privacy"
          eyebrow="privacy"
          title="What we keep."
          description="MVP stores history locally in your browser. No accounts yet — nothing leaves this device beyond the live discovery calls."
        >
          <SettingsRow
            label="Save check history locally"
            helper="Off means each check is forgotten as soon as you leave."
            is-last
          >
            <SettingsToggle
              :model-value="preferences.saveHistoryLocally"
              label="Save check history locally"
              @update:model-value="setSaveHistory"
            />
          </SettingsRow>
        </SettingsSection>

        <!-- About -->
        <SettingsSection id="about" eyebrow="about" title="The fine print.">
          <SettingsRow label="Version">
            <span class="font-mono text-[12px] tracking-tight text-ink-2">
              {{ APP_VERSION }} <span class="mx-1.5 text-muted">·</span> {{ APP_RELEASE_TAG }}
            </span>
          </SettingsRow>
          <SettingsRow label="Build">
            <span class="font-mono text-[12px] tracking-tight text-ink-2">
              {{ APP_BUILD_LABEL }} <span class="mx-1.5 text-muted">·</span> {{ APP_BUILD_DATE }}
            </span>
          </SettingsRow>
          <SettingsRow label="Tagline" helper="Shown at the foot of every check." is-last>
            <span class="font-mono text-[12px] tracking-tight text-ink-2">
              {{ APP_TAGLINE }}
            </span>
          </SettingsRow>
        </SettingsSection>
      </div>
    </div>

    <BasePageFooter class="mt-16"> TrustTrace &middot; {{ APP_TAGLINE }} </BasePageFooter>
  </div>
</template>
