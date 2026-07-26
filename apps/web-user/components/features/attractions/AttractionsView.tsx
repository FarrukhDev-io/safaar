"use client";

import { useState, useMemo, useCallback } from "react";
import {
  MapPin,
  Compass,
  Clock,
  Star,
  ArrowRight,
  Map as MapIcon,
  LayoutGrid,
  Filter,
  ChevronDown,
} from "lucide-react";
import { useCurrency } from "@/lib/context/CurrencyContext";
import type { CatalogDict } from "@/i18n/dictionaries";
import { CatalogHeader } from "@/components/catalog/CatalogHeader";
import { MOCK_ATTRACTIONS } from "@/components/catalog/data";
import type { AttractionItem } from "@/components/catalog/types";
import { InteractiveMapView, type MapMarkerItem } from "@/components/features/map/InteractiveMapView";
import { EmptyState } from "@/components/ui/EmptyState";
import { BaseCard } from "@/components/ui/BaseCard";
import { FilterSidebar } from "@/components/ui/FilterSidebar";
import { FilterGroup } from "@/components/ui/FilterGroup";
import { ActiveFilters, type ActiveFilterChip } from "@/components/ui/ActiveFilters";

export type { AttractionItem };

const DURATION_HINTS: Record<string, string> = {
  historical: "2–3 soat",
  unesco: "Butun kun",
  nature: "4–6 soat",
  culture: "1–2 soat",
  entertainment: "2–4 soat",
};

function AttractionCard({
  item,
  categoryLabel,
  onMoreInfo,
}: {
  item: AttractionItem;
  categoryLabel: string;
  onMoreInfo: () => void;
}) {
  const { format } = useCurrency();
  const duration = DURATION_HINTS[item.categoryKey] ?? "2–3 soat";
  const entryPrice = Math.round(item.rating * 60_000);

  const badge = (
    <span className="rounded-full bg-slate-900/55 px-2.5 py-1 text-xs font-medium text-white">
      {categoryLabel}
    </span>
  );

  const subInfo = (
    <>
      <MapPin className="h-3.5 w-3.5 shrink-0" />
      {item.cityName}
      <span className="text-slate-300 dark:text-slate-700">·</span>
      <Clock className="h-3.5 w-3.5 shrink-0" />
      {duration}
    </>
  );

  const ratingElement = (
    <>
      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
      <span className="font-semibold text-slate-700 dark:text-slate-300">
        {item.rating.toFixed(1)}
      </span>
      <span>· 320 ta sharh</span>
    </>
  );

  return (
    <BaseCard
      imageSrc={item.imageUrl}
      imageAlt={item.name}
      badge={badge}
      title={item.name}
      subInfo={subInfo}
      rating={ratingElement}
      onClick={onMoreInfo}
      footerLeft={
        <>
          <span className="text-[10px] font-medium text-slate-400">dan</span>
          <span className="text-sm font-bold text-slate-900 dark:text-white">
            {format(entryPrice)}
          </span>
        </>
      }
      footerRight={
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onMoreInfo();
          }}
          aria-label={`${item.name} haqida batafsil`}
          className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          Batafsil
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      }
    />
  );
}

export function AttractionsView({ dict }: { dict: CatalogDict["attractions"] }) {
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedCity, setSelectedCity] = useState<string>("all");

  const [tempCategory, setTempCategory] = useState<string>("all");
  const [tempCity, setTempCity] = useState<string>("all");

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "map">("grid");
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const categories = useMemo(() => [
    { id: "all", label: dict.categories?.all ?? dict.allPlaces },
    { id: "historical", label: dict.categories?.historical ?? "Tarixiy Obida" },
    { id: "unesco", label: dict.categories?.unesco ?? "UNESCO Merosi" },
    { id: "nature", label: dict.categories?.nature ?? "Tabiat & Hordiq" },
  ], [dict]);

  const cities = useMemo(() => Array.from(new Set(MOCK_ATTRACTIONS.map((a) => a.cityName))), []);

  const handleApply = useCallback(() => {
    setSelectedCategory(tempCategory);
    setSelectedCity(tempCity);
  }, [tempCategory, tempCity]);

  const handleReset = useCallback(() => {
    setTempCategory("all");
    setTempCity("all");
    setSelectedCategory("all");
    setSelectedCity("all");
  }, []);

  const filtered = useMemo(() => {
    return MOCK_ATTRACTIONS.filter((a) => {
      const q = query.toLowerCase();
      const matchesQuery =
        a.name.toLowerCase().includes(q) ||
        a.cityName.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q);
      const matchesCategory =
        selectedCategory === "all" || a.categoryKey === selectedCategory;
      const matchesCity =
        selectedCity === "all" || a.cityName === selectedCity;

      return matchesQuery && matchesCategory && matchesCity;
    });
  }, [query, selectedCategory, selectedCity]);

  const mapItems: MapMarkerItem[] = useMemo(
    () =>
      filtered.map((a) => ({
        id: a.id,
        name: a.name,
        cityName: a.cityName,
        priceFormatted: a.categoryDefault ?? "Obida",
        rating: a.rating,
        imageUrl: a.imageUrl,
      })),
    [filtered]
  );

  const handleMoreInfo = useCallback(
    (item: AttractionItem) => {
      alert(dict.comingSoon.replace("{name}", item.name));
    },
    [dict.comingSoon]
  );

  const activeFilterChips = useMemo(() => {
    const chips: ActiveFilterChip[] = [];
    if (selectedCategory !== "all") {
      const label = categories.find((c) => c.id === selectedCategory)?.label ?? selectedCategory;
      chips.push({
        key: "category",
        label,
        onRemove: () => {
          setSelectedCategory("all");
          setTempCategory("all");
        },
      });
    }
    if (selectedCity !== "all") {
      chips.push({
        key: "city",
        label: selectedCity,
        onRemove: () => {
          setSelectedCity("all");
          setTempCity("all");
        },
      });
    }
    return chips;
  }, [selectedCategory, selectedCity, categories]);

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
      <CatalogHeader
        icon={<Compass className="h-3.5 w-3.5 text-primary-600 dark:text-primary-400" />}
        badge={dict.badge}
        title={dict.title}
        subtitle={dict.subtitle}
        searchValue={query}
        onSearchChange={setQuery}
        searchPlaceholder={dict.searchPlaceholder}
        filterControls={
          <div className="flex items-center justify-between gap-3 w-full">
            {/* Mobile Filter Button */}
            <button
              type="button"
              onClick={() => setIsFilterOpen(true)}
              className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-900 shadow-2xs hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-white lg:hidden min-h-[44px]"
            >
              <Filter className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span>Filtrlar</span>
              <ChevronDown className="h-4 w-4 text-slate-600 dark:text-slate-400" />
            </button>

            {/* View Toggle */}
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

      {/* Active Chips */}
      {activeFilterChips.length > 0 && (
        <div className="mb-6">
          <ActiveFilters chips={activeFilterChips} onClearAll={handleReset} />
        </div>
      )}

      {/* Layout Grid */}
      <div className="mt-4 grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6 items-start">
        {/* Sidebar */}
        <FilterSidebar
          title="Obidalar Filtri"
          isOpen={isFilterOpen}
          onClose={() => setIsFilterOpen(false)}
          onApply={handleApply}
          onReset={handleReset}
        >
          {/* Category */}
          <FilterGroup title="Kategoriya">
            <select
              value={tempCategory}
              onChange={(e) => setTempCategory(e.target.value)}
              className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </FilterGroup>

          {/* City */}
          <FilterGroup title="Shahar">
            <select
              value={tempCity}
              onChange={(e) => setTempCity(e.target.value)}
              className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
            >
              <option value="all">Barcha shaharlar</option>
              {cities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </FilterGroup>
        </FilterSidebar>

        {/* List Content */}
        <div className="flex-1">
          {filtered.length === 0 ? (
            <EmptyState
              title="Diqqatga sazovor joylar topilmadi"
              description="Siz kiritgan so'rov va filtrlar bo'yicha hech narsa topilmadi. Filtrlar va qidiruvni tozalab ko'ring."
              actionLabel="Hammasini tozalash"
              onAction={handleReset}
            />
          ) : viewMode === "map" ? (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_450px]">
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                {filtered.map((item) => (
                  <div
                    key={item.id}
                    onMouseEnter={() => setHoveredId(item.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    className={`transition-all duration-200 rounded-3xl ${
                      selectedId === item.id ? "ring-2 ring-blue-500 shadow-lg" : ""
                    }`}
                  >
                    <AttractionCard
                      item={item}
                      categoryLabel={dict.categories?.[item.categoryKey] ?? item.categoryDefault}
                      onMoreInfo={() => handleMoreInfo(item)}
                    />
                  </div>
                ))}
              </div>

              <div className="lg:sticky lg:top-24 lg:h-[calc(100vh-120px)]">
                <InteractiveMapView
                  items={mapItems}
                  hoveredItemId={hoveredId}
                  selectedItemId={selectedId}
                  onSelectItem={(item) => setSelectedId(item.id)}
                  className="h-[450px] w-full lg:h-full rounded-2xl overflow-hidden shadow-lg border border-slate-200/80 dark:border-slate-800"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((item) => (
                <AttractionCard
                  key={item.id}
                  item={item}
                  categoryLabel={dict.categories?.[item.categoryKey] ?? item.categoryDefault}
                  onMoreInfo={() => handleMoreInfo(item)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
