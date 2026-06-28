export interface BookingFormState {
  hospitalName: string;
  serviceAt: string;
  amount: number;
  remark: string;
}

export interface AMapLngLat {
  lng: number;
  lat: number;
  getLng?: () => number;
  getLat?: () => number;
}

export type AMapPosition = AMapLngLat | [number, number];

export interface AMapMarkerInstance {
  on: (event: "click", handler: () => void) => void;
  setMap: (map: AMapMapInstance | null) => void;
}

export interface AMapMapInstance {
  setCenter: (position: AMapPosition) => void;
  setFitView: (overlays?: AMapMarkerInstance[]) => void;
  destroy: () => void;
}

export interface AMapGeolocationResult {
  position?: AMapLngLat;
  message?: string;
}

export interface AMapPoi {
  id?: string;
  name: string;
  address?: string;
  location?: AMapLngLat;
}

export interface AMapPlaceSearchResult {
  poiList?: {
    pois?: AMapPoi[];
  };
}

export type AMapPluginStatus = "complete" | "error" | "no_data" | string;

export type AMapGeolocationCallback = (
  status: AMapPluginStatus,
  result: AMapGeolocationResult,
) => void;

export type AMapPlaceSearchCallback = (
  status: AMapPluginStatus,
  result: AMapPlaceSearchResult,
) => void;

export interface AMapGeolocationInstance {
  getCurrentPosition: (callback: AMapGeolocationCallback) => void;
}

export interface AMapPlaceSearchInstance {
  search: (keyword: string, callback: AMapPlaceSearchCallback) => void;
  searchNearBy: (
    keyword: string,
    center: AMapPosition,
    radius: number,
    callback: AMapPlaceSearchCallback,
  ) => void;
}

export interface AMapApi {
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

export interface AMapLoaderResult {
  default?: AMapApi;
}
