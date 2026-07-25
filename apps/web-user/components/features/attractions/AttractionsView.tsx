"use client";

import { useState } from "react";
import Image from "next/image";
import { MapPin, Compass, Camera, Info } from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import type { CatalogDict } from "@/i18n/dictionaries";
import { CatalogHeader } from "@/components/catalog/CatalogHeader";
import { MOCK_ATTRACTIONS } from "@/components/catalog/data";
import type { AttractionItem } from "@/components/catalog/types";

import { LayoutGrid, Map as MapIcon } from "lucide-react";
import { InteractiveMapView, type MapMarkerItem } from "@/components/features/map/InteractiveMapView";

export type { AttractionItem };

export function AttractionsView({ dict }: { dict: CatalogDict["attractions"] }) {
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "map">("grid");
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const categories = [
    { id: "all", label: dict.categories?.all ?? dict.allPlaces },
    { id: "historical", label: dict.categories?.historical ?? "Tarixiy Obida" },
    { id: "unesco", label: dict.categories?.unesco ?? "UNESCO Merosi" },
    { id: "nature", label: dict.categories?.nature ?? "Tabiat & Hordiq" },
  ];

  const filtered = MOCK_ATTRACTIONS.filter((a) => {
    const matchesQuery =
      a.name.toLowerCase().includes(query.toLowerCase()) ||
      a.cityName.toLowerCase().includes(query.toLowerCase()) ||
      a.description.toLowerCase().includes(query.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || a.categoryKey === selectedCategory;
    return matchesQuery && matchesCategory;
  });

  const mapItems: MapMarkerItem[] = filtered.map((a) => ({
    id: a.id,
    name: a.name,
    cityName: a.cityName,
    priceFormatted: a.categoryDefault ?? "Obida",
    rating: a.rating,
    imageUrl: a.imageUrl,
  }));

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
      <CatalogHeader
        icon={<Compass className="h-3.5 w-3.5 text-primary-600 dark:text-primary-400" />}
        badge={dict.badge}
        title={dict.title}
        subtitle={dict.subtitle}
        searchValue={query}
        onSearchChange={setQuery}
        searchPlaceholder={dict.searchPlaceholder}
        filterControls={
          <div className="flex flex-wrap items-center justify-between gap-3 w-full">
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`rounded-xl px-3 py-2 text-xs font-bold transition-all ${
                    selectedCategory === cat.id
                      ? "bg-blue-600 text-white shadow-xs"
                      : "border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

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
                <MapIcon className="h-3.5 w-3.5" />
                <span>Xarita</span>
              </button>
            </div>
          </div>
        }
      />

      {viewMode === "map" ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_450px]">
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
            {filtered.map((item) => (
              <div
                key={item.id}
                onMouseEnter={() => setHoveredId(item.id)}
                onMouseLeave={() => setHoveredId(null)}
                className={`transition-all duration-200 rounded-2xl ${
                  selectedId === item.id ? "ring-2 ring-blue-500 shadow-lg" : ""
                }`}
              >
                <Card className="group overflow-hidden">
                  <div className="relative aspect-16/9 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                    <Image
                      src={item.imageUrl}
                      alt={item.name}
                      fill
                      sizes="(max-width: 640px) 100vw, 400px"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3 text-white">
                      <h3 className="text-base font-bold">{item.name}</h3>
                      <p className="text-xs text-slate-200">{item.cityName}</p>
                    </div>
                  </div>
                  <CardBody className="p-4">
                    <p className="text-xs text-slate-600 line-clamp-2 dark:text-slate-400">{item.description}</p>
                  </CardBody>
                </Card>
              </div>
            ))}
          </div>

          <div className="lg:sticky lg:top-24 lg:h-[calc(100vh-120px)]">
            <InteractiveMapView
              items={mapItems}
              hoveredItemId={hoveredId}
              selectedItemId={selectedId}
              onSelectItem={(item) => setSelectedId(item.id)}
              className="h-[450px] w-full lg:h-full rounded-2xl overflow-hidden shadow-lg border border-slate-200 dark:border-slate-800"
            />
          </div>
        </div>
      ) : (
        /* Grid listing */
        <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
          {filtered.map((item) => {
            const categoryLabel = dict.categories?.[item.categoryKey] ?? item.categoryDefault;
            return (
              <Card key={item.id} className="group overflow-hidden">
                <div className="relative aspect-16/9 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                  <Image
                    src={item.imageUrl}
                    alt={item.name}
                    fill
                    sizes="(max-width: 640px) 100vw, 600px"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full border border-white/20 bg-black/40 px-2.5 py-0.5 text-xs font-medium text-white backdrop-blur-xs">
                    <Camera className="h-3.5 w-3.5 text-amber-300" />
                    {categoryLabel}
                  </span>
                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <h2 className="text-lg font-bold sm:text-xl">{item.name}</h2>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-200">
                      <MapPin className="h-3.5 w-3.5 text-white/80" />
                      {item.cityName}
                    </p>
                  </div>
                </div>

                <CardBody className="flex flex-1 flex-col justify-between p-4 sm:p-5">
                  <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                    {item.description}
                  </p>

                  <div className="mt-4 flex flex-col gap-2.5 border-t border-slate-100 pt-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400 sm:flex-row sm:items-center sm:justify-between">
                    <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                      <Info className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      <span className="truncate">{dict.bestTime} {item.bestTimeToVisit}</span>
                    </span>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="w-full text-xs font-bold whitespace-nowrap px-3 sm:w-auto"
                      onClick={() => alert(dict.comingSoon.replace("{name}", item.name))}
                    >
                      {dict.moreInfo}
                    </Button>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}
    </main>
  );
}
