export const CAMPUS_PROFILE = {
  name: import.meta.env.VITE_CAMPUS_NAME || "ONDA 대학교 데모 캠퍼스",
  center: {
    lat: Number(import.meta.env.VITE_CAMPUS_CENTER_LAT || 37.58745),
    lng: Number(import.meta.env.VITE_CAMPUS_CENTER_LNG || 127.05935),
  },
  mapZoom: Number(import.meta.env.VITE_CAMPUS_MAP_ZOOM || 16),
};

export function getCampusCoordinate(dx: number, dy: number) {
  return {
    lat: CAMPUS_PROFILE.center.lat + dy,
    lng: CAMPUS_PROFILE.center.lng + dx,
  };
}
