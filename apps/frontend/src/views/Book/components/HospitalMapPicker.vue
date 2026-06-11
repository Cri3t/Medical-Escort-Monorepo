<script setup lang="ts">
import { Search, X } from "lucide-vue-next";
import { useI18n } from "vue-i18n";
import { Button } from "@/components/ui/button";
import { useHospitalMapPicker } from "../composables/useHospitalMapPicker";

interface Props {
  initialKeyword: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  close: [];
  select: [hospitalName: string];
}>();

const { t } = useI18n();

const {
  hospitalPois,
  manualSearchKeyword,
  mapContainerRef,
  mapError,
  mapLoading,
  selectedHospitalId,
  closeMapPicker,
  getPoiKey,
  handleManualSearch,
  selectHospital,
} = useHospitalMapPicker({
  initialKeyword: () => props.initialKeyword,
  onClose: () => emit("close"),
  onSelect: (hospitalName) => emit("select", hospitalName),
  t,
});
</script>

<template>
  <div class="map-picker-backdrop">
    <section class="map-picker">
      <header class="map-picker__header">
        <div>
          <h2 class="map-picker__title">
            {{ t("book.selectHospital") }}
          </h2>
          <p class="map-picker__description">
            {{ t("book.mapDescription") }}
          </p>
        </div>
        <button
          type="button"
          class="map-picker__close"
          :aria-label="t('book.closeMapPicker')"
          @click="closeMapPicker"
        >
          <X class="book-icon" aria-hidden="true" />
        </button>
      </header>

      <div class="map-picker__body">
        <div class="map-picker__map-pane">
          <div
            ref="mapContainerRef"
            class="map-picker__map"
          ></div>
          <div
            v-if="mapLoading"
            class="map-picker__loading"
          >
            {{ t("book.loadingMap") }}
          </div>
        </div>

        <aside class="map-picker__side-panel">
          <div class="map-picker__search-panel">
            <form class="map-picker__search-form" @submit.prevent="handleManualSearch">
              <input
                v-model="manualSearchKeyword"
                type="text"
                class="map-picker__search-input"
                :placeholder="t('book.searchHospitalPlaceholder')"
              />
              <Button
                type="submit"
                size="icon"
                class="map-picker__search-button"
                :disabled="mapLoading"
              >
                <Search class="book-icon" aria-hidden="true" />
              </Button>
            </form>
            <p
              v-if="mapError"
              class="map-picker__error"
            >
              {{ mapError }}
            </p>
          </div>

          <div class="map-picker__results">
            <p
              v-if="!mapLoading && hospitalPois.length === 0"
              class="map-picker__empty"
            >
              {{ t("book.noHospitals") }}
            </p>

            <button
              v-for="poi in hospitalPois"
              :key="getPoiKey(poi)"
              type="button"
              class="map-picker__result"
              :class="
                selectedHospitalId === getPoiKey(poi)
                  ? 'map-picker__result--selected'
                  : 'map-picker__result--idle'
              "
              @click="selectHospital(poi)"
            >
              <span class="map-picker__result-name">
                {{ poi.name }}
              </span>
              <span class="map-picker__result-address">
                {{ poi.address || t("book.noAddress") }}
              </span>
            </button>
          </div>
        </aside>
      </div>
    </section>
  </div>
</template>

<style scoped>
.map-picker-backdrop {
  @apply fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/70 px-3 py-4;
}

.map-picker {
  @apply flex h-[88vh] w-full max-w-5xl flex-col overflow-hidden rounded-lg bg-white shadow-2xl;
}

.map-picker__header {
  @apply flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3;
}

.map-picker__title {
  @apply text-base font-semibold text-slate-950;
}

.map-picker__description {
  @apply mt-1 text-xs text-slate-500;
}

.map-picker__close {
  @apply flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300;
}

.map-picker__body {
  @apply grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[1fr_320px];
}

.map-picker__map-pane {
  @apply relative min-h-[320px];
}

.map-picker__map {
  @apply h-[52vh] min-h-[320px] w-full md:h-full;
}

.map-picker__loading {
  @apply absolute inset-0 flex items-center justify-center bg-white/80 text-sm font-medium text-slate-700;
}

.map-picker__side-panel {
  @apply flex min-h-0 flex-col border-t border-slate-200 md:border-l md:border-t-0;
}

.map-picker__search-panel {
  @apply space-y-3 border-b border-slate-200 p-4;
}

.map-picker__search-form {
  @apply flex gap-2;
}

.map-picker__search-input {
  @apply min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-100;
}

.map-picker__search-button {
  @apply bg-teal-600 hover:bg-teal-700;
}

.map-picker__error {
  @apply rounded-lg bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-800;
}

.map-picker__results {
  @apply min-h-0 flex-1 overflow-y-auto p-3;
}

.map-picker__empty {
  @apply px-1 py-6 text-center text-sm text-slate-500;
}

.map-picker__result {
  @apply mb-2 w-full rounded-lg border px-3 py-3 text-left transition hover:border-teal-300 hover:bg-teal-50;
}

.map-picker__result--selected {
  @apply border-teal-500 bg-teal-50;
}

.map-picker__result--idle {
  @apply border-slate-200 bg-white;
}

.map-picker__result-name {
  @apply block text-sm font-semibold text-slate-950;
}

.map-picker__result-address {
  @apply mt-1 block text-xs leading-5 text-slate-500;
}

.book-icon {
  @apply h-4 w-4;
}
</style>
