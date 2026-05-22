<script setup lang="ts">
import AMapLoader from "@amap/amap-jsapi-loader";
import { MapPin, Search, X } from "lucide-vue-next";
import { computed, nextTick, onMounted, onUnmounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import { getPublicProfiles } from "@/api/escort";
import type { PublicEscortProfile } from "@/api/escort";
import { createOrder } from "@/api/order";
import PageHeader from "@/components/PageHeader/PageHeader.vue";
import { Button } from "@/components/ui/button";

declare global {
  interface Window {
    _AMapSecurityConfig?: {
      securityJsCode: string;
    };
  }
}

interface OrderForm {
  hospitalName: string;
  serviceAt: string;
  amount: number;
  remark: string;
}

interface AMapLngLat {
  lng: number;
  lat: number;
  getLng?: () => number;
  getLat?: () => number;
}

type AMapPosition = AMapLngLat | [number, number];

interface AMapMarkerInstance {
  on: (event: "click", handler: () => void) => void;
  setMap: (map: AMapMapInstance | null) => void;
}

interface AMapMapInstance {
  setCenter: (position: AMapPosition) => void;
  setFitView: (overlays?: AMapMarkerInstance[]) => void;
  destroy: () => void;
}

interface AMapGeolocationResult {
  position?: AMapLngLat;
  message?: string;
}

interface AMapPoi {
  id?: string;
  name: string;
  address?: string;
  location?: AMapLngLat;
}

interface AMapPlaceSearchResult {
  poiList?: {
    pois?: AMapPoi[];
  };
}

type AMapPluginStatus = "complete" | "error" | "no_data" | string;
type AMapGeolocationCallback = (
  status: AMapPluginStatus,
  result: AMapGeolocationResult,
) => void;
type AMapPlaceSearchCallback = (
  status: AMapPluginStatus,
  result: AMapPlaceSearchResult,
) => void;

interface AMapGeolocationInstance {
  getCurrentPosition: (callback: AMapGeolocationCallback) => void;
}

interface AMapPlaceSearchInstance {
  search: (keyword: string, callback: AMapPlaceSearchCallback) => void;
  searchNearBy: (
    keyword: string,
    center: AMapPosition,
    radius: number,
    callback: AMapPlaceSearchCallback,
  ) => void;
}

interface AMapApi {
  Map: new (
    container: HTMLElement,
    options: {
      zoom: number;
      center: AMapPosition;
      resizeEnable: boolean;
    },
  ) => AMapMapInstance;
  Marker: new (options: {
    map: AMapMapInstance;
    position: AMapPosition;
    title?: string;
  }) => AMapMarkerInstance;
  Geolocation: new (options: {
    enableHighAccuracy: boolean;
    timeout: number;
    buttonPosition: string;
  }) => AMapGeolocationInstance;
  PlaceSearch: new (options: {
    type: string;
    pageSize: number;
    pageIndex: number;
    extensions: string;
    city?: string;
    autoFitView?: boolean;
  }) => AMapPlaceSearchInstance;
}

interface AMapLoaderResult {
  default?: AMapApi;
}

const AMAP_KEY = import.meta.env.VITE_AMAP_KEY;
const AMAP_SECURITY_CODE = import.meta.env.VITE_AMAP_SECURITY_CODE;
const DEFAULT_MAP_CENTER: AMapPosition = [116.397428, 39.90923];
const HOSPITAL_SEARCH_KEYWORD = "General Hospital";
const FALLBACK_SEARCH_KEYWORD = "Hospital";
const MEDICAL_SEARCH_TYPE = "Medical and Healthcare Services";

const initialForm = (): OrderForm => ({
  hospitalName: "",
  serviceAt: "",
  amount: 150,
  remark: "",
});

const escorts = ref<PublicEscortProfile[]>([]);
const loading = ref(false);
const submitLoading = ref(false);
const router = useRouter();
const { locale, t } = useI18n();
const selectedEscort = ref<PublicEscortProfile | null>(null);
const form = ref<OrderForm>(initialForm());

const isMapPickerOpen = ref(false);
const mapLoading = ref(false);
const mapError = ref("");
const manualSearchKeyword = ref("");
const hospitalPois = ref<AMapPoi[]>([]);
const selectedHospitalId = ref("");
const mapContainerRef = ref<HTMLElement | null>(null);
const amapRef = ref<AMapApi | null>(null);
const mapInstanceRef = ref<AMapMapInstance | null>(null);
const markersRef = ref<AMapMarkerInstance[]>([]);

const isDialogOpen = computed(() => selectedEscort.value !== null);
const intlLocale = computed(() => (locale.value === "zh-CN" ? "zh-CN" : "en-US"));

onMounted(() => {
  void loadEscorts();
});

onUnmounted(() => {
  destroyMap();
});

async function loadEscorts() {
  loading.value = true;

  try {
    escorts.value = await getPublicProfiles();
  } finally {
    loading.value = false;
  }
}

function openDialog(escort: PublicEscortProfile) {
  selectedEscort.value = escort;
}

function closeDialog() {
  if (submitLoading.value) {
    return;
  }

  closeMapPicker();
  selectedEscort.value = null;
  resetForm();
}

function resetForm() {
  form.value = initialForm();
}

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

async function openMapPicker() {
  isMapPickerOpen.value = true;
  mapError.value = "";
  manualSearchKeyword.value = form.value.hospitalName.trim();

  await nextTick();
  await initMapPicker();
}

async function initMapPicker() {
  if (!AMAP_KEY || !AMAP_SECURITY_CODE) {
    mapError.value = t("book.missingMapConfig");
    return;
  }

  if (!mapContainerRef.value) {
    mapError.value = t("book.mapContainerNotReady");
    return;
  }

  mapLoading.value = true;

  try {
    window._AMapSecurityConfig = {
      securityJsCode: AMAP_SECURITY_CODE,
    };

    const loaderResult = (await AMapLoader.load({
      key: AMAP_KEY,
      version: "2.0",
      plugins: ["AMap.Geolocation", "AMap.PlaceSearch"],
    })) as AMapApi | AMapLoaderResult;
    const amap = "Map" in loaderResult ? loaderResult : loaderResult.default;

    if (!amap) {
      throw new Error(t("book.mapUnavailable"));
    }

    amapRef.value = amap;
    mapInstanceRef.value = new amap.Map(mapContainerRef.value, {
      zoom: 13,
      center: DEFAULT_MAP_CENTER,
      resizeEnable: true,
    });

    locateAndSearchNearby();
  } catch {
    mapError.value = t("book.mapLoadFailed");
    mapLoading.value = false;
  }
}

function locateAndSearchNearby() {
  const amap = amapRef.value;

  if (!amap || !mapInstanceRef.value) {
    return;
  }

  mapLoading.value = true;
  const geolocation = new amap.Geolocation({
    enableHighAccuracy: true,
    timeout: 10000,
    buttonPosition: "RB",
  });

  geolocation.getCurrentPosition((status, result) => {
    if (status === "complete" && result.position) {
      mapInstanceRef.value?.setCenter(result.position);
      searchNearbyHospitals(result.position);
      return;
    }

    mapLoading.value = false;
    mapError.value = t("book.locationFailed");
  });
}

function searchNearbyHospitals(center: AMapPosition) {
  const placeSearch = createPlaceSearch();

  if (!placeSearch) {
    return;
  }

  placeSearch.searchNearBy(
    HOSPITAL_SEARCH_KEYWORD,
    center,
    10000,
    handleSearchResult,
  );
}

function handleManualSearch() {
  const keyword =
    manualSearchKeyword.value.trim() ||
    form.value.hospitalName.trim() ||
    FALLBACK_SEARCH_KEYWORD;
  const placeSearch = createPlaceSearch();

  if (!placeSearch) {
    return;
  }

  mapLoading.value = true;
  mapError.value = "";
  placeSearch.search(keyword, handleSearchResult);
}

function createPlaceSearch() {
  const amap = amapRef.value;

  if (!amap) {
    mapError.value = t("book.mapNotReady");
    return null;
  }

  return new amap.PlaceSearch({
    type: MEDICAL_SEARCH_TYPE,
    pageSize: 20,
    pageIndex: 1,
    extensions: "base",
    autoFitView: false,
  });
}

function handleSearchResult(
  status: AMapPluginStatus,
  result: AMapPlaceSearchResult,
) {
  mapLoading.value = false;

  if (status !== "complete") {
    hospitalPois.value = [];
    clearMarkers();
    mapError.value = t("book.noHospitals");
    return;
  }

  const pois = (result.poiList?.pois ?? []).filter(
    (poi) => poi.name && poi.location,
  );
  hospitalPois.value = pois;
  mapError.value = pois.length ? "" : t("book.noHospitals");
  renderMarkers(pois);
}

function renderMarkers(pois: AMapPoi[]) {
  const amap = amapRef.value;
  const map = mapInstanceRef.value;

  if (!amap || !map) {
    return;
  }

  clearMarkers();

  markersRef.value = pois
    .filter((poi) => poi.location)
    .map((poi) => {
      const marker = new amap.Marker({
        map,
        position: poi.location as AMapLngLat,
        title: poi.name,
      });

      marker.on("click", () => selectHospital(poi));
      return marker;
    });

  if (markersRef.value.length > 0) {
    map.setFitView(markersRef.value);
  }
}

function clearMarkers() {
  markersRef.value.forEach((marker) => {
    marker.setMap(null);
  });
  markersRef.value = [];
}

function selectHospital(poi: AMapPoi) {
  form.value.hospitalName = poi.name;
  selectedHospitalId.value = getPoiKey(poi);
  closeMapPicker();
}

function closeMapPicker() {
  if (!isMapPickerOpen.value && !mapInstanceRef.value) {
    return;
  }

  isMapPickerOpen.value = false;
  mapLoading.value = false;
  mapError.value = "";
  manualSearchKeyword.value = "";
  hospitalPois.value = [];
  selectedHospitalId.value = "";
  destroyMap();
}

function destroyMap() {
  clearMarkers();
  mapInstanceRef.value?.destroy();
  mapInstanceRef.value = null;
}

function getPoiKey(poi: AMapPoi) {
  if (poi.id) {
    return poi.id;
  }

  const lng = poi.location?.lng ?? "";
  const lat = poi.location?.lat ?? "";
  return `${poi.name}-${lng}-${lat}`;
}

async function handleSubmit() {
  if (submitLoading.value) {
    return;
  }

  if (!selectedEscort.value) {
    alert(t("book.selectEscortAlert"));
    return;
  }

  const hospitalName = form.value.hospitalName.trim();
  const serviceAt = form.value.serviceAt;
  const amount = Number(form.value.amount);
  const remark = form.value.remark.trim();

  if (!hospitalName) {
    alert(t("book.hospitalRequired"));
    return;
  }

  if (!serviceAt) {
    alert(t("book.serviceTimeRequired"));
    return;
  }

  const serviceDate = new Date(serviceAt);

  if (Number.isNaN(serviceDate.getTime())) {
    alert(t("book.invalidServiceTime"));
    return;
  }

  if (!Number.isFinite(amount) || amount < 0) {
    alert(t("book.invalidAmount"));
    return;
  }

  submitLoading.value = true;

  try {
    await createOrder({
      escortId: selectedEscort.value.userId,
      hospitalName,
      serviceAt: serviceDate.toISOString(),
      amount,
      ...(remark ? { remark } : {}),
    });

    alert(t("book.createSuccess"));
    await router.push("/orders");
  } finally {
    submitLoading.value = false;
  }
}
</script>

<template>
  <main class="book-page">
    <PageHeader :eyebrow="t('book.eyebrow')" :title="t('book.title')" />

    <section class="book-shell">
      <div v-if="loading" class="book-card-grid">
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
        v-else-if="escorts.length === 0"
        class="book-empty"
      >
        {{ t("book.empty") }}
      </div>

      <div v-else class="book-card-grid">
        <article
          v-for="escort in escorts"
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

          <Button
            type="button"
            class="book-card-button"
            @click="openDialog(escort)"
          >
            {{ t("book.book") }}
          </Button>
        </article>
      </div>
    </section>

    <div
      v-if="isDialogOpen"
      class="book-dialog-backdrop"
      @click.self="closeDialog"
    >
      <section class="book-dialog">
        <div class="book-dialog__header">
          <p class="book-dialog__eyebrow">
            {{ selectedEscort ? getEscortName(selectedEscort) : "" }}
          </p>
          <h2 class="book-dialog__title">
            {{ t("book.dialogTitle") }}
          </h2>
        </div>

        <form class="book-form" @submit.prevent="handleSubmit">
          <label class="book-field">
            <span class="book-field__label">
              {{ t("book.hospitalName") }}
            </span>
            <div class="book-field__control">
              <input
                v-model="form.hospitalName"
                type="text"
                autocomplete="off"
                class="book-field__input book-field__input--with-action"
                :placeholder="t('book.hospitalPlaceholder')"
              />
              <button
                type="button"
                class="book-field__map-button"
                :aria-label="t('book.selectHospitalOnMap')"
                @click="openMapPicker"
              >
                <MapPin class="book-icon" aria-hidden="true" />
              </button>
            </div>
          </label>

          <label class="book-field">
            <span class="book-field__label">
              {{ t("book.serviceTime") }}
            </span>
            <input
              v-model="form.serviceAt"
              type="datetime-local"
              class="book-field__input"
            />
          </label>

          <label class="book-field">
            <span class="book-field__label">
              {{ t("book.bookingAmount") }}
            </span>
            <input
              v-model.number="form.amount"
              type="number"
              min="0"
              step="0.01"
              class="book-field__input"
            />
          </label>

          <label class="book-field">
            <span class="book-field__label">
              {{ t("book.remark") }}
            </span>
            <textarea
              v-model="form.remark"
              rows="4"
              class="book-field__textarea"
              :placeholder="t('book.remarkPlaceholder')"
            ></textarea>
          </label>

          <div class="book-dialog__actions">
            <Button
              type="button"
              variant="outline"
              :disabled="submitLoading"
              @click="closeDialog"
            >
              {{ t("common.cancel") }}
            </Button>
            <Button
              type="submit"
              class="book-submit-button"
              :disabled="submitLoading"
            >
              {{ submitLoading ? t("common.submitting") : t("book.confirmBooking") }}
            </Button>
          </div>
        </form>
      </section>
    </div>

    <div
      v-if="isMapPickerOpen"
      class="map-picker-backdrop"
    >
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
  </main>
</template>

<style scoped>
.book-page {
  @apply min-h-screen bg-slate-50 text-slate-900;
}

.book-shell {
  @apply mx-auto max-w-6xl px-4 py-8;
}

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

.book-card-button {
  @apply mt-8 w-full bg-teal-600 hover:bg-teal-700;
}

.book-dialog-backdrop {
  @apply fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-6;
}

.book-dialog {
  @apply w-full max-w-lg rounded-lg bg-white p-6 shadow-xl;
}

.book-dialog__header {
  @apply mb-6;
}

.book-dialog__eyebrow {
  @apply text-sm font-medium text-teal-700;
}

.book-dialog__title {
  @apply mt-1 text-xl font-semibold tracking-normal text-slate-950;
}

.book-form {
  @apply space-y-5;
}

.book-field {
  @apply block;
}

.book-field__label {
  @apply mb-2 block text-sm font-medium text-slate-700;
}

.book-field__control {
  @apply relative;
}

.book-field__input {
  @apply w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-100;
}

.book-field__input--with-action {
  @apply pr-12;
}

.book-field__map-button {
  @apply absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-slate-500 transition hover:bg-teal-50 hover:text-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-200;
}

.book-field__textarea {
  @apply w-full resize-none rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-100;
}

.book-dialog__actions {
  @apply flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end;
}

.book-submit-button {
  @apply bg-teal-600 hover:bg-teal-700;
}

.book-icon {
  @apply h-4 w-4;
}

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
</style>
