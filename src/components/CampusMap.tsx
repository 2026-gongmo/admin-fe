import React, { useEffect, useMemo, useRef, useState } from "react";
import type { Building } from "../types";
import { CAMPUS_PROFILE } from "../config/campus";

declare global {
  interface Window {
    kakao?: {
      maps: {
        load: (callback: () => void) => void;
        LatLng: new (lat: number, lng: number) => KakaoLatLng;
        Map: new (container: HTMLElement, options: KakaoMapOptions) => KakaoMap;
        Marker: new (options: KakaoMarkerOptions) => KakaoMarker;
        CustomOverlay: new (options: KakaoCustomOverlayOptions) => KakaoCustomOverlay;
        event: {
          addListener: (target: unknown, type: string, handler: () => void) => void;
        };
      };
    };
  }
}

interface KakaoLatLng {}

interface KakaoMap {
  setCenter: (latLng: KakaoLatLng) => void;
  setLevel: (level: number) => void;
}

interface KakaoMapOptions {
  center: KakaoLatLng;
  level: number;
}

interface KakaoMarkerOptions {
  map: KakaoMap;
  position: KakaoLatLng;
}

interface KakaoMarker {
  setMap: (map: KakaoMap | null) => void;
}

interface KakaoCustomOverlayOptions {
  map: KakaoMap;
  position: KakaoLatLng;
  content: string | HTMLElement;
  yAnchor?: number;
}

interface KakaoCustomOverlay {
  setMap: (map: KakaoMap | null) => void;
}

const CAMPUS_CENTER = CAMPUS_PROFILE.center;
const OSM_ZOOM = CAMPUS_PROFILE.mapZoom;
const TILE_SIZE = 256;

let kakaoLoader: Promise<void> | null = null;

function loadKakaoMap(appKey: string): Promise<void> {
  if (window.kakao?.maps) {
    return new Promise((resolve) => window.kakao?.maps.load(resolve));
  }

  if (kakaoLoader) {
    return kakaoLoader;
  }

  kakaoLoader = new Promise((resolve, reject) => {
    const existing = document.getElementById("kakao-map-sdk") as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", () => window.kakao?.maps.load(resolve));
      existing.addEventListener("error", () => reject(new Error("Kakao 지도 SDK 로드 실패")));
      return;
    }

    const script = document.createElement("script");
    script.id = "kakao-map-sdk";
    script.async = true;
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(appKey)}&autoload=false`;
    script.onload = () => window.kakao?.maps.load(resolve);
    script.onerror = () => reject(new Error("Kakao 지도 SDK 로드 실패"));
    document.head.appendChild(script);
  });

  return kakaoLoader;
}

function buildingPosition(building: Building) {
  if (typeof building.lat === "number" && typeof building.lng === "number") {
    return { lat: building.lat, lng: building.lng };
  }

  return {
    lat: CAMPUS_CENTER.lat + ((building.position.y - 50) / 100) * -0.0042,
    lng: CAMPUS_CENTER.lng + ((building.position.x - 50) / 100) * 0.0056,
  };
}

function markerTone(status: Building["status"]) {
  if (status === "blocked") return "danger";
  if (status === "warning") return "warning";
  return "safe";
}

function createMapLabel(building: Building) {
  const button = document.createElement("button");
  button.className = `kakao-map-label ${markerTone(building.status)}`;
  button.type = "button";

  const title = document.createElement("strong");
  title.textContent = building.name;
  const count = document.createElement("span");
  count.textContent = `${building.reportCount}건`;

  button.append(title, count);
  return button;
}

function fallbackPinColor(status: Building["status"]) {
  if (status === "blocked") return "#DC2626";
  if (status === "warning") return "#F59E0B";
  return "#22C55E";
}

function latLngToWorld(lat: number, lng: number, zoom: number) {
  const scale = TILE_SIZE * 2 ** zoom;
  const sinLat = Math.sin((lat * Math.PI) / 180);
  return {
    x: ((lng + 180) / 360) * scale,
    y: (0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) * scale,
  };
}

function buildOsmTiles() {
  const center = latLngToWorld(CAMPUS_CENTER.lat, CAMPUS_CENTER.lng, OSM_ZOOM);
  const origin = { x: center.x - 430, y: center.y - 130 };
  const startTileX = Math.floor(origin.x / TILE_SIZE);
  const startTileY = Math.floor(origin.y / TILE_SIZE);

  return Array.from({ length: 20 }, (_, index) => {
    const col = index % 5;
    const row = Math.floor(index / 5);
    const x = startTileX + col;
    const y = startTileY + row;
    return {
      id: `${x}-${y}`,
      src: `https://tile.openstreetmap.org/${OSM_ZOOM}/${x}/${y}.png`,
      left: x * TILE_SIZE - origin.x,
      top: y * TILE_SIZE - origin.y,
    };
  });
}

function osmPinPosition(building: Building) {
  const pos = buildingPosition(building);
  const center = latLngToWorld(CAMPUS_CENTER.lat, CAMPUS_CENTER.lng, OSM_ZOOM);
  const world = latLngToWorld(pos.lat, pos.lng, OSM_ZOOM);

  return {
    left: 430 + (world.x - center.x),
    top: 130 + (world.y - center.y),
  };
}

const osmTiles = buildOsmTiles();

const OsmFallbackMap: React.FC<{ buildings: Building[]; note: string }> = ({ buildings, note }) => (
  <div className="osm-map" aria-label="ONDA 캠퍼스 제보 지도 대체 표시">
    {osmTiles.map((tile) => (
      <img
        alt=""
        className="osm-tile"
        draggable={false}
        key={tile.id}
        src={tile.src}
        style={{ left: tile.left, top: tile.top }}
      />
    ))}
    <div className="osm-campus-shade" />
    {buildings.map((building) => {
      const pos = osmPinPosition(building);
      return (
        <div className="osm-building-pin" key={building.id} style={{ left: pos.left, top: pos.top }}>
          <span style={{ background: fallbackPinColor(building.status) }} />
          <strong>{building.name}</strong>
          <em>{building.reportCount}</em>
        </div>
      );
    })}
    <div className="map-campus-name">{CAMPUS_PROFILE.name}</div>
    <div className="map-note">{note}</div>
  </div>
);

export const CampusMap: React.FC<{ buildings: Building[] }> = ({ buildings }) => {
  const appKey = import.meta.env.VITE_KAKAO_MAP_APP_KEY as string | undefined;
  const mapRef = useRef<HTMLDivElement | null>(null);
  const overlaysRef = useRef<Array<KakaoMarker | KakaoCustomOverlay>>([]);
  const [status, setStatus] = useState<"ready" | "loading" | "fallback" | "missing-key">(
    appKey ? "loading" : "missing-key"
  );

  const sortedBuildings = useMemo(
    () => [...buildings].sort((a, b) => b.reportCount - a.reportCount),
    [buildings]
  );

  useEffect(() => {
    if (!appKey || !mapRef.current || sortedBuildings.length === 0) {
      setStatus(appKey ? "fallback" : "missing-key");
      return;
    }

    let disposed = false;
    overlaysRef.current.forEach((item) => item.setMap(null));
    overlaysRef.current = [];
    setStatus("loading");

    loadKakaoMap(appKey)
      .then(() => {
        if (disposed || !mapRef.current || !window.kakao?.maps) return;

        const kakaoMaps = window.kakao.maps;
        const map = new kakaoMaps.Map(mapRef.current, {
          center: new kakaoMaps.LatLng(CAMPUS_CENTER.lat, CAMPUS_CENTER.lng),
          level: 3,
        });

        sortedBuildings.forEach((building) => {
          const pos = buildingPosition(building);
          const latLng = new kakaoMaps.LatLng(pos.lat, pos.lng);
          const marker = new kakaoMaps.Marker({ map, position: latLng });
          const label = new kakaoMaps.CustomOverlay({
            map,
            position: latLng,
            yAnchor: 1.8,
            content: createMapLabel(building),
          });

          kakaoMaps.event.addListener(marker, "click", () => {
            map.setCenter(latLng);
            map.setLevel(2);
          });

          overlaysRef.current.push(marker, label);
        });

        setStatus("ready");
      })
      .catch(() => {
        if (!disposed) setStatus("fallback");
      });

    return () => {
      disposed = true;
      overlaysRef.current.forEach((item) => item.setMap(null));
      overlaysRef.current = [];
    };
  }, [appKey, sortedBuildings]);

  return (
    <div className="campus-map-shell">
      {appKey && <div className="campus-map" ref={mapRef} aria-label="ONDA 캠퍼스 제보 지도" />}

      {status === "missing-key" && (
        <OsmFallbackMap
          buildings={sortedBuildings}
          note={`${CAMPUS_PROFILE.name} 좌표 기준 · Kakao 키가 없어 OpenStreetMap으로 표시 중`}
        />
      )}

      {status === "fallback" && (
        <OsmFallbackMap
          buildings={sortedBuildings}
          note={`${CAMPUS_PROFILE.name} 좌표 기준 · Kakao 도메인 미등록 가능성`}
        />
      )}

      {status === "loading" && (
        <div className="map-state">
          <span className="dot-pulse" />
          Kakao 지도를 불러오는 중
        </div>
      )}
    </div>
  );
};
