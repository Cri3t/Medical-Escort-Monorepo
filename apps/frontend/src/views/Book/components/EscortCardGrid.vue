<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import type { PublicEscortProfile } from "@/api/escort";
import { Button } from "@/components/ui/button";

interface Props {
  escorts: PublicEscortProfile[];
  loading: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  book: [escort: PublicEscortProfile];
}>();

const { locale, t } = useI18n();

const intlLocale = computed(() => (locale.value === "zh-CN" ? "zh-CN" : "en-US"));

function formatDate(value: string) {
  return new Intl.DateTimeFormat(intlLocale.value, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}

function getEscortName(escort: PublicEscortProfile) {
  return escort.user.nickname || t("book.unnamedEscort");
}
</script>

<template>
  <div v-if="props.loading" class="book-card-grid">
    <div
      v-for="index in 6"
      :key="index"
      class="book-skeleton-card"
    >
      <div class="book-skeleton-card__avatar"></div>
      <div class="book-skeleton-card__title"></div>
      <div class="book-skeleton-card__text"></div>
      <div class="book-skeleton-card__button"></div>
    </div>
  </div>

  <div
    v-else-if="props.escorts.length === 0"
    class="book-empty"
  >
    {{ t("book.empty") }}
  </div>

  <div v-else class="book-card-grid">
    <article
      v-for="escort in props.escorts"
      :key="escort.id"
      class="book-escort-card"
    >
      <div class="book-escort-card__profile">
        <div class="book-escort-card__avatar">
          {{ getEscortName(escort).slice(0, 1) }}
        </div>
        <div class="book-escort-card__info">
          <h2 class="book-escort-card__name">
            {{ getEscortName(escort) }}
          </h2>
          <p class="book-escort-card__meta">
            {{ t("book.joinedOn", { date: formatDate(escort.createdAt) }) }}
          </p>
        </div>
      </div>

      <div v-if="escort.tags.length > 0" class="book-escort-card__tags">
        <span
          v-for="tag in escort.tags"
          :key="tag"
          class="book-escort-card__tag"
        >
          {{ tag }}
        </span>
      </div>

      <Button
        type="button"
        class="book-card-button"
        @click="emit('book', escort)"
      >
        {{ t("book.book") }}
      </Button>
    </article>
  </div>
</template>

<style scoped>
.book-card-grid {
  @apply grid grid-cols-1 gap-5 md:grid-cols-3;
}

.book-skeleton-card {
  @apply h-56 animate-pulse rounded-lg border border-slate-200 bg-white p-6 shadow-sm;
}

.book-skeleton-card__avatar {
  @apply h-14 w-14 rounded-full bg-slate-200;
}

.book-skeleton-card__title {
  @apply mt-6 h-5 w-32 rounded bg-slate-200;
}

.book-skeleton-card__text {
  @apply mt-3 h-4 w-44 rounded bg-slate-100;
}

.book-skeleton-card__button {
  @apply mt-8 h-10 rounded bg-slate-200;
}

.book-empty {
  @apply rounded-lg border border-dashed border-slate-300 bg-white px-6 py-12 text-center text-sm text-slate-500;
}

.book-escort-card {
  @apply rounded-lg border border-slate-200 bg-white p-6 shadow-sm;
}

.book-escort-card__profile {
  @apply flex items-center gap-4;
}

.book-escort-card__avatar {
  @apply flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-teal-50 text-lg font-semibold text-teal-700;
}

.book-escort-card__info {
  @apply min-w-0;
}

.book-escort-card__name {
  @apply truncate text-lg font-semibold text-slate-950;
}

.book-escort-card__meta {
  @apply mt-1 text-sm text-slate-500;
}

.book-escort-card__tags {
  @apply mt-5 flex min-h-7 flex-wrap gap-2;
}

.book-escort-card__tag {
  @apply inline-flex max-w-full rounded-full bg-teal-50 px-2.5 py-1 text-xs font-medium text-teal-700;
}

.book-card-button {
  @apply mt-8 w-full bg-teal-600 hover:bg-teal-700;
}
</style>
