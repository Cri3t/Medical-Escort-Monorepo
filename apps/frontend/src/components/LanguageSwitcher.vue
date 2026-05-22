<script setup lang="ts">
import { Languages } from "lucide-vue-next";
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { setLocale, type SupportedLocale } from "@/i18n";

interface LanguageSwitcherProps {
  compact?: boolean;
}

defineProps<LanguageSwitcherProps>();

const { locale, t } = useI18n();

const currentLocale = computed(() => locale.value as SupportedLocale);

function toggleLocale() {
  setLocale(currentLocale.value === "en" ? "zh-CN" : "en");
}
</script>

<template>
  <button
    type="button"
    class="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-teal-100"
    :aria-label="t('common.language')"
    @click="toggleLocale"
  >
    <Languages class="h-4 w-4" aria-hidden="true" />
    <span v-if="!compact">
      {{ currentLocale === "en" ? t("common.english") : t("common.chinese") }}
    </span>
  </button>
</template>
