<script setup lang="ts">
import AMapLoader from "@amap/amap-jsapi-loader";
import { MapPin, Search, X } from "lucide-vue-next";
import { computed, nextTick, onMounted, onUnmounted, ref } from "vue";
import { getPublicProfiles } from "@/api/escort";
import type { PublicEscortProfile } from "@/api/escort";
import { createOrder } from "@/api/order";
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
const HOSPITAL_SEARCH_KEYWORD = "综合医院";
const FALLBACK_SEARCH_KEYWORD = "医院";
const MEDICAL_SEARCH_TYPE = "医疗保健服务";

const initialForm = (): OrderForm => ({
  hospitalName: "",
  serviceAt: "",
  amount: 150,
  remark: "",
});

const escorts = ref<PublicEscortProfile[]>([]);
const loading = ref(false);
const submitLoading = ref(false);
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
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}

function getEscortName(escort: PublicEscortProfile) {
  return escort.user.nickname || "Unnamed Escort";
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
    mapError.value =
      "AMap key or security code is missing. Fill AMAP_KEY and AMAP_SECURITY_CODE in the component.";
    return;
  }

  if (!mapContainerRef.value) {
    mapError.value = "Map container is not ready.";
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
      throw new Error("AMap API is unavailable.");
    }

    amapRef.value = amap;
    mapInstanceRef.value = new amap.Map(mapContainerRef.value, {
      zoom: 13,
      center: DEFAULT_MAP_CENTER,
      resizeEnable: true,
    });

    locateAndSearchNearby();
  } catch {
    mapError.value =
      "Map failed to load. Please check the AMap key and network.";
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
    mapError.value = "Location failed. Search for a hospital manually.";
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
    mapError.value = "Map is not ready yet.";
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
    mapError.value = "No hospitals found. Try another keyword.";
    return;
  }

  const pois = (result.poiList?.pois ?? []).filter(
    (poi) => poi.name && poi.location,
  );
  hospitalPois.value = pois;
  mapError.value = pois.length
    ? ""
    : "No hospitals found. Try another keyword.";
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
    alert("Please select an escort");
    return;
  }

  const hospitalName = form.value.hospitalName.trim();
  const serviceAt = form.value.serviceAt;
  const amount = Number(form.value.amount);
  const remark = form.value.remark.trim();

  if (!hospitalName) {
    alert("Please enter the hospital name");
    return;
  }

  if (!serviceAt) {
    alert("Please select a service time");
    return;
  }

  const serviceDate = new Date(serviceAt);

  if (Number.isNaN(serviceDate.getTime())) {
    alert("Please select a valid service time");
    return;
  }

  if (!Number.isFinite(amount) || amount < 0) {
    alert("Please enter a valid booking amount");
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

    alert("Booking created successfully");
    selectedEscort.value = null;
    resetForm();
  } finally {
    submitLoading.value = false;
  }
}
</script>

<template>
  <main class="min-h-screen bg-slate-50 px-4 py-8 text-slate-900">
    <section class="mx-auto max-w-6xl">
      <div class="mb-8">
        <p class="text-sm font-medium text-teal-700">Book Escort Service</p>
        <h1 class="mt-2 text-3xl font-semibold tracking-normal text-slate-950">
          Available Escorts
        </h1>
      </div>

      <div v-if="loading" class="grid grid-cols-1 gap-5 md:grid-cols-3">
        <div
          v-for="index in 6"
          :key="index"
          class="h-56 animate-pulse rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div class="h-14 w-14 rounded-full bg-slate-200"></div>
          <div class="mt-6 h-5 w-32 rounded bg-slate-200"></div>
          <div class="mt-3 h-4 w-44 rounded bg-slate-100"></div>
          <div class="mt-8 h-10 rounded bg-slate-200"></div>
        </div>
      </div>

      <div
        v-else-if="escorts.length === 0"
        class="rounded-lg border border-dashed border-slate-300 bg-white px-6 py-12 text-center text-sm text-slate-500"
      >
        No available escorts
      </div>

      <div v-else class="grid grid-cols-1 gap-5 md:grid-cols-3">
        <article
          v-for="escort in escorts"
          :key="escort.id"
          class="rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div class="flex items-center gap-4">
            <div
              class="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-teal-50 text-lg font-semibold text-teal-700"
            >
              {{ getEscortName(escort).slice(0, 1) }}
            </div>
            <div class="min-w-0">
              <h2 class="truncate text-lg font-semibold text-slate-950">
                {{ getEscortName(escort) }}
              </h2>
              <p class="mt-1 text-sm text-slate-500">
                Joined on: {{ formatDate(escort.createdAt) }}
              </p>
            </div>
          </div>

          <Button
            type="button"
            class="mt-8 w-full bg-teal-600 hover:bg-teal-700"
            @click="openDialog(escort)"
          >
            Book
          </Button>
        </article>
      </div>
    </section>

    <div
      v-if="isDialogOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-6"
      @click.self="closeDialog"
    >
      <section class="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
        <div class="mb-6">
          <p class="text-sm font-medium text-teal-700">
            {{ selectedEscort ? getEscortName(selectedEscort) : "" }}
          </p>
          <h2 class="mt-1 text-xl font-semibold tracking-normal text-slate-950">
            Book Escort Service
          </h2>
        </div>

        <form class="space-y-5" @submit.prevent="handleSubmit">
          <label class="block">
            <span class="mb-2 block text-sm font-medium text-slate-700">
              Hospital Name
            </span>
            <div class="relative">
              <input
                v-model="form.hospitalName"
                type="text"
                autocomplete="off"
                class="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
                placeholder="Enter the hospital name"
              />
              <button
                type="button"
                class="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-slate-500 transition hover:bg-teal-50 hover:text-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-200"
                aria-label="Select hospital on map"
                @click="openMapPicker"
              >
                <MapPin class="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </label>

          <label class="block">
            <span class="mb-2 block text-sm font-medium text-slate-700">
              Service Time
            </span>
            <input
              v-model="form.serviceAt"
              type="datetime-local"
              class="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
            />
          </label>

          <label class="block">
            <span class="mb-2 block text-sm font-medium text-slate-700">
              Booking Amount
            </span>
            <input
              v-model.number="form.amount"
              type="number"
              min="0"
              step="0.01"
              class="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
            />
          </label>

          <label class="block">
            <span class="mb-2 block text-sm font-medium text-slate-700">
              Remark
            </span>
            <textarea
              v-model="form.remark"
              rows="4"
              class="w-full resize-none rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
              placeholder="Add patient details, service needs, or other notes"
            ></textarea>
          </label>

          <div
            class="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end"
          >
            <Button
              type="button"
              variant="outline"
              :disabled="submitLoading"
              @click="closeDialog"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              class="bg-teal-600 hover:bg-teal-700"
              :disabled="submitLoading"
            >
              {{ submitLoading ? "Submitting..." : "Confirm Booking" }}
            </Button>
          </div>
        </form>
      </section>
    </div>

    <div
      v-if="isMapPickerOpen"
      class="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/70 px-3 py-4"
    >
      <section
        class="flex h-[88vh] w-full max-w-5xl flex-col overflow-hidden rounded-lg bg-white shadow-2xl"
      >
        <header
          class="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3"
        >
          <div>
            <h2 class="text-base font-semibold text-slate-950">
              Select Hospital
            </h2>
            <p class="mt-1 text-xs text-slate-500">
              Choose a nearby hospital or search manually.
            </p>
          </div>
          <button
            type="button"
            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300"
            aria-label="Close map picker"
            @click="closeMapPicker"
          >
            <X class="h-4 w-4" aria-hidden="true" />
          </button>
        </header>

        <div class="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[1fr_320px]">
          <div class="relative min-h-[320px]">
            <div
              ref="mapContainerRef"
              class="h-[52vh] min-h-[320px] w-full md:h-full"
            ></div>
            <div
              v-if="mapLoading"
              class="absolute inset-0 flex items-center justify-center bg-white/80 text-sm font-medium text-slate-700"
            >
              地图加载中...
            </div>
          </div>

          <aside
            class="flex min-h-0 flex-col border-t border-slate-200 md:border-l md:border-t-0"
          >
            <div class="space-y-3 border-b border-slate-200 p-4">
              <form class="flex gap-2" @submit.prevent="handleManualSearch">
                <input
                  v-model="manualSearchKeyword"
                  type="text"
                  class="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
                  placeholder="Search hospital name"
                />
                <Button
                  type="submit"
                  size="icon"
                  class="bg-teal-600 hover:bg-teal-700"
                  :disabled="mapLoading"
                >
                  <Search class="h-4 w-4" aria-hidden="true" />
                </Button>
              </form>
              <p
                v-if="mapError"
                class="rounded-lg bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-800"
              >
                {{ mapError }}
              </p>
            </div>

            <div class="min-h-0 flex-1 overflow-y-auto p-3">
              <p
                v-if="!mapLoading && hospitalPois.length === 0"
                class="px-1 py-6 text-center text-sm text-slate-500"
              >
                No hospitals found. Try another keyword.
              </p>

              <button
                v-for="poi in hospitalPois"
                :key="getPoiKey(poi)"
                type="button"
                class="mb-2 w-full rounded-lg border px-3 py-3 text-left transition hover:border-teal-300 hover:bg-teal-50"
                :class="
                  selectedHospitalId === getPoiKey(poi)
                    ? 'border-teal-500 bg-teal-50'
                    : 'border-slate-200 bg-white'
                "
                @click="selectHospital(poi)"
              >
                <span class="block text-sm font-semibold text-slate-950">
                  {{ poi.name }}
                </span>
                <span class="mt-1 block text-xs leading-5 text-slate-500">
                  {{ poi.address || "No address available" }}
                </span>
              </button>
            </div>
          </aside>
        </div>
      </section>
    </div>
  </main>
</template>
