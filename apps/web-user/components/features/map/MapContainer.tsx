"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export interface MapMarkerItem {
  id: string;
  name: string;
  cityName?: string;
  address?: string;
  priceFormatted?: string;
  rating?: number;
  stars?: number;
  imageUrl?: string;
  linkUrl?: string;
  lat?: number;
  lng?: number;
}

export interface MapContainerProps {
  items: MapMarkerItem[];
  hoveredItemId?: string | null;
  selectedItemId?: string | null;
  onSelectItem?: (item: MapMarkerItem) => void;
  center?: [number, number];
  zoom?: number;
  className?: string;
}

function resolveItemCoords(item: MapMarkerItem): [number, number] {
  if (typeof item.lat === "number" && typeof item.lng === "number" && item.lat !== 0) {
    return [item.lat, item.lng];
  }
  const city = (item.cityName ?? "").toLowerCase();
  let baseLat = 41.2995;
  let baseLng = 69.2401;

  if (city.includes("samarqand") || city.includes("samarkand")) {
    baseLat = 39.6542;
    baseLng = 66.9597;
  } else if (city.includes("buxoro") || city.includes("bukhara")) {
    baseLat = 39.7747;
    baseLng = 64.4286;
  } else if (city.includes("xiva") || city.includes("khiva")) {
    baseLat = 41.3783;
    baseLng = 60.3639;
  }

  const hash = item.id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const offsetLat = ((hash % 17) - 8) * 0.007;
  const offsetLng = (((hash * 13) % 19) - 9) * 0.007;

  return [baseLat + offsetLat, baseLng + offsetLng];
}

function createPricePinIcon(
  price: string,
  rating?: number,
  isSelected?: boolean,
  isHovered?: boolean,
) {
  const text = price || (rating ? `★ ${rating.toFixed(1)}` : "Ko'rish");
  const bgClass =
    isSelected || isHovered
      ? "bg-blue-600 text-white ring-4 ring-blue-500/30 scale-110 shadow-xl border-white"
      : "bg-white text-slate-900 border-slate-300 shadow-md dark:bg-slate-900 dark:text-white dark:border-slate-700";

  return L.divIcon({
    className: "custom-leaflet-price-pin",
    html: `
      <div class="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-extrabold transition-all duration-200 cursor-pointer shadow-md ${bgClass}">
        <span class="h-2 w-2 rounded-full ${isSelected ? "bg-amber-400 animate-pulse" : "bg-blue-500"}"></span>
        <span>${text}</span>
      </div>
    `,
    iconSize: [110, 36],
    iconAnchor: [55, 18],
    popupAnchor: [0, -18],
  });
}

export function MapContainer({
  items,
  hoveredItemId,
  selectedItemId,
  onSelectItem,
  center = [41.2995, 69.2401],
  zoom = 12,
  className = "h-[550px] w-full rounded-3xl overflow-hidden border border-slate-200/80 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900",
}: MapContainerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());

  // Initialize Map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const firstCoords = items.length > 0 ? resolveItemCoords(items[0]) : center;

    const map = L.map(containerRef.current, {
      center: firstCoords,
      zoom,
      zoomControl: false,
    });

    // CartoDB Positron / Dark Matter Tiles
    const isDark = document.documentElement.classList.contains("dark");
    const tileUrl = isDark
      ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";

    L.tileLayer(tileUrl, {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      maxZoom: 19,
    }).addTo(map);

    L.control.zoom({ position: "bottomright" }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update Markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear old markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current.clear();

    const bounds = L.latLngBounds([]);

    items.forEach((item) => {
      const coords = resolveItemCoords(item);
      bounds.extend(coords);

      const isSelected = item.id === selectedItemId;
      const isHovered = item.id === hoveredItemId;

      const icon = createPricePinIcon(
        item.priceFormatted ?? "",
        item.rating,
        isSelected,
        isHovered,
      );

      const marker = L.marker(coords, { icon, zIndexOffset: isSelected || isHovered ? 1000 : 0 });

      // Custom Popover HTML
      const popupHtml = `
        <div class="flex flex-col gap-2 p-1 min-w-[220px]">
          ${
            item.imageUrl
              ? `<div class="relative h-28 w-full overflow-hidden rounded-xl bg-slate-100">
                  <img src="${item.imageUrl}" alt="${item.name}" class="h-full w-full object-cover" />
                </div>`
              : ""
          }
          <div class="flex flex-col gap-1 pt-1">
            <h3 class="text-sm font-bold text-slate-900">${item.name}</h3>
            ${
              item.cityName || item.address
                ? `<p class="text-xs text-slate-500">${item.cityName ? item.cityName + " · " : ""}${item.address || ""}</p>`
                : ""
            }
            ${
              item.priceFormatted
                ? `<p class="mt-1 text-sm font-extrabold text-blue-600">${item.priceFormatted}</p>`
                : ""
            }
            ${
              item.linkUrl
                ? `<a href="${item.linkUrl}" class="mt-2 inline-flex items-center justify-center rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-blue-700">Batafsil</a>`
                : ""
            }
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, { maxWidth: 260 });

      marker.on("click", () => {
        if (onSelectItem) onSelectItem(item);
        map.flyTo(coords, Math.max(map.getZoom(), 14), { duration: 0.6 });
      });

      marker.addTo(map);
      markersRef.current.set(item.id, marker);
    });

    if (items.length > 0) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    }
  }, [items, selectedItemId, hoveredItemId, onSelectItem]);

  return <div ref={containerRef} className={className} />;
}
