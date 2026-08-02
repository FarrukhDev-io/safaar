"use client";

import { useState, useMemo } from "react";
import { LayoutGrid, Map } from "lucide-react";
import type { Locale } from "@/i18n/config";
import type { HotelsDict } from "@/i18n/dictionaries";
import { formatSum } from "@/lib/money";
import { HotelCard } from "@/components/hotels/HotelCard";
import { HotelsPagination } from "@/components/hotels/HotelsPagination";
import { InteractiveMapView, type MapMarkerItem } from "@/components/features/map/InteractiveMapView";
import { EmptyState } from "@/components/ui/EmptyState";
import type { HotelListItem } from "@/types/view";

export interface AccommodationListWithMapProps {
  items: HotelListItem[];
  locale: Locale;
  dict: HotelsDict;
  basePath: string;
  safePage: number;
  totalPages: number;
  currentParams: Record<string, string>;
}

export function AccommodationListWithMap({
  items,
  locale,
  dict,
  basePath,
  safePage,
  totalPages,
  currentParams,
}: AccommodationListWithMapProps) {
  const [viewMode, setViewMode] = useState<"grid" | "map">("grid");
  const [hoveredHotelId, setHoveredHotelId] = useState<string | null>(null);
  const [selectedHotelId, setSelectedHotelId] = useState<string | null>(null);

  const mapItems: MapMarkerItem[] = useMemo(
    () =>
      items.map((h) => ({
        id: h.id,
        name: h.name,
        cityName: h.cityName,
        priceFormatted: formatSum(h.minPriceSum),
        rating: h.rating,
        stars: h.stars,
        imageUrl: h.imageUrl,
        linkUrl: `/${locale}/hotels/${h.slug}`,
        lat: h.latitude,
        lng: h.longitude,
      })),
    [items, locale]
  );

  return (
    <div className="flex flex-col gap-5">
      {/* View Toggle Bar */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3 dark:border-slate-800">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider dark:text-slate-400">
          Ko'rinish Rejimi (View Mode)
        </span>

        <div className="inline-flex rounded-xl border border-slate-200 bg-slate-100 p-1 dark:border-slate-800 dark:bg-slate-900">
          <button
            type="button"
            onClick={() => setViewMode("grid")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
              viewMode === "grid"
                ? "bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-white"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            }`}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            <span>Grid</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode("map")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
              viewMode === "map"
                ? "bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-white"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            }`}
          >
            <Map className="h-3.5 w-3.5" />
            <span>Xarita</span>
          </button>
        </div>
      </div>

      {/* Main Content Layout */}
      {items.length === 0 ? (
        <EmptyState
          title="Ob'ektlar topilmadi"
          description="Afsuski, kiritilgan filtr va parametrlar bo'yicha hech qanday ob'ekt topilmadi. Qidiruv parametrlarini o'zgartirib ko'ring."
          actionLabel="Filtrlarni tozalash"
          actionHref={`${basePath}`}
        />
      ) : viewMode === "map" ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_460px]">
          {/* List Column */}
          <div className="flex flex-col gap-4">
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
              {items.map((hotel) => (
                <div
                  key={hotel.id}
                  onMouseEnter={() => setHoveredHotelId(hotel.id)}
                  onMouseLeave={() => setHoveredHotelId(null)}
                  className={`transition-all duration-200 rounded-2xl ${
                    selectedHotelId === hotel.id ? "ring-2 ring-blue-500 shadow-lg" : ""
                  }`}
                >
                  <HotelCard
                    hotel={hotel}
                    locale={locale}
                    labels={{ perNight: dict.perNight, reviews: dict.reviews }}
                  />
                </div>
              ))}
            </div>

            <HotelsPagination
              basePath={basePath}
              params={currentParams}
              page={safePage}
              totalPages={totalPages}
              dict={dict.pagination}
            />
          </div>

          {/* Sticky Interactive Map Column */}
          <div className="lg:sticky lg:top-24 lg:h-[calc(100vh-120px)]">
            <InteractiveMapView
              items={mapItems}
              hoveredItemId={hoveredHotelId}
              selectedItemId={selectedHotelId}
              onSelectItem={(item) => setSelectedHotelId(item.id)}
              className="h-[450px] w-full lg:h-full rounded-2xl overflow-hidden shadow-lg border border-slate-200 dark:border-slate-800"
            />
          </div>
        </div>
      ) : (
        /* Standard Grid View */
        <>
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
            {items.map((hotel) => (
              <HotelCard
                key={hotel.id}
                hotel={hotel}
                locale={locale}
                labels={{ perNight: dict.perNight, reviews: dict.reviews }}
              />
            ))}
          </div>
          <HotelsPagination
            basePath={basePath}
            params={currentParams}
            page={safePage}
            totalPages={totalPages}
            dict={dict.pagination}
          />
        </>
      )}
    </div>
  );
}
