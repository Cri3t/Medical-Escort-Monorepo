import AMapLoader from "@amap/amap-jsapi-loader";
import { nextTick, onMounted, onUnmounted, ref } from "vue";
import type {
  AMapApi,
  AMapLngLat,
  AMapLoaderResult,
  AMapMapInstance,
  AMapMarkerInstance,
  AMapPlaceSearchResult,
  AMapPluginStatus,
  AMapPoi,
  AMapPosition,
} from "../types";

declare global {
  interface Window {
    _AMapSecurityConfig?: {
      securityJsCode: string;
    };
  }
}

interface UseHospitalMapPickerOptions {
  initialKeyword: () => string;
  onClose: () => void;
  onSelect: (hospitalName: string) => void;
  t: (key: string) => string;
}

const AMAP_KEY = import.meta.env.VITE_AMAP_KEY;
const AMAP_SECURITY_CODE = import.meta.env.VITE_AMAP_SECURITY_CODE;
const DEFAULT_MAP_CENTER: AMapPosition = [116.397428, 39.90923];
const HOSPITAL_SEARCH_KEYWORD = "医院";
const MEDICAL_SEARCH_TYPE = "医疗保健服务";

export function useHospitalMapPicker(options: UseHospitalMapPickerOptions) {
  const mapLoading = ref(false);
  const mapError = ref("");
  const manualSearchKeyword = ref("");
  const hospitalPois = ref<AMapPoi[]>([]);
  const selectedHospitalId = ref("");
  const mapContainerRef = ref<HTMLElement | null>(null);
  const amapRef = ref<AMapApi | null>(null);
  const mapInstanceRef = ref<AMapMapInstance | null>(null);
  const markersRef = ref<AMapMarkerInstance[]>([]);

  onMounted(() => {
    void openMapPicker();
  });

  onUnmounted(() => {
    destroyMap();
  });

  async function openMapPicker() {
    mapError.value = "";
    manualSearchKeyword.value = options.initialKeyword().trim();

    await nextTick();
    await initMapPicker();
  }

  async function initMapPicker() {
    if (!AMAP_KEY || !AMAP_SECURITY_CODE) {
      mapError.value = options.t("book.missingMapConfig");
      return;
    }

    if (!mapContainerRef.value) {
      mapError.value = options.t("book.mapContainerNotReady");
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
        throw new Error(options.t("book.mapUnavailable"));
      }

      amapRef.value = amap;
      mapInstanceRef.value = new amap.Map(mapContainerRef.value, {
        zoom: 13,
        center: DEFAULT_MAP_CENTER,
        resizeEnable: true,
      });

      locateAndSearchNearby();
    } catch {
      mapError.value = options.t("book.mapLoadFailed");
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

      mapError.value = options.t("book.locationFailed");
      searchNearbyHospitals(DEFAULT_MAP_CENTER);
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
      options.initialKeyword().trim() ||
      HOSPITAL_SEARCH_KEYWORD;
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
      mapError.value = options.t("book.mapNotReady");
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
      mapError.value = options.t("book.noHospitals");
      return;
    }

    const pois = (result.poiList?.pois ?? []).filter(
      (poi) => poi.name && poi.location,
    );
    hospitalPois.value = pois;
    mapError.value = pois.length ? "" : options.t("book.noHospitals");
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
    selectedHospitalId.value = getPoiKey(poi);
    options.onSelect(poi.name);
    closeMapPicker();
  }

  function closeMapPicker() {
    mapLoading.value = false;
    mapError.value = "";
    manualSearchKeyword.value = "";
    hospitalPois.value = [];
    selectedHospitalId.value = "";
    destroyMap();
    options.onClose();
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

  return {
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
  };
}
