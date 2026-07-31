"use client";

import { useState, useMemo, useCallback } from "react";
import Image from "next/image";
import {
  MapPin,
  Compass,
  Star,
  ArrowRight,
  Map as MapIcon,
  LayoutGrid,
  Filter,
  ChevronDown,
} from "lucide-react";
import { useCurrency } from "@/lib/context/CurrencyContext";
import type { Locale } from "@/i18n/config";
import type { CatalogDict } from "@/i18n/dictionaries";
import { CatalogHeader } from "@/components/catalog/CatalogHeader";
import { MOCK_ATTRACTIONS } from "@/components/catalog/data";
import type { AttractionItem } from "@/components/catalog/types";
import { InteractiveMapView, type MapMarkerItem } from "@/components/features/map/InteractiveMapView";
import { EmptyState } from "@/components/ui/EmptyState";
import { FilterSidebar } from "@/components/ui/FilterSidebar";
import { FilterGroup } from "@/components/ui/FilterGroup";
import { ActiveFilters, type ActiveFilterChip } from "@/components/ui/ActiveFilters";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { Select, type SelectOption } from "@/components/ui/Select";

export type { AttractionItem };

function AttractionCard({
  item,
  categoryLabel,
  dict,
  locale,
  onMoreInfo,
}: {
  item: AttractionItem;
  categoryLabel: string;
  dict: CatalogDict["attractions"] & {
    hoursSuffix?: string;
    fullDay?: string;
    from?: string;
    recommended?: string;
  };
  locale: Locale;
  onMoreInfo: () => void;
}) {
  const { format } = useCurrency();
  
  const getDurationText = (category: string) => {
    switch (category) {
      case "historical":
        return `2–3 ${dict.hoursSuffix || "soat"}`;
      case "unesco":
        return dict.fullDay || "Butun kun";
      case "nature":
        return `4–6 ${dict.hoursSuffix || "soat"}`;
      case "culture":
        return `1–2 ${dict.hoursSuffix || "soat"}`;
      case "entertainment":
        return `2–4 ${dict.hoursSuffix || "soat"}`;
      default:
        return `2–3 ${dict.hoursSuffix || "soat"}`;
    }
  };
  const duration = getDurationText(item.categoryKey);
  const entryPrice = Math.round(item.rating * 60_000);

  return (
    <div
      onClick={onMoreInfo}
      className="group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-blue-500/30 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900/60 dark:backdrop-blur-md"
    >
      {/* Image Section */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
        <Image
          src={item.imageUrl}
          alt={item.name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          quality={85}
        />
        {/* Sleek Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/20 to-transparent" />
        
        {/* Category Badge - Glassmorphism */}
        <div className="absolute left-3.5 top-3.5 z-10">
          <span className="inline-flex items-center rounded-xl bg-slate-900/65 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-md border border-white/10 shadow-xs">
            {categoryLabel}
          </span>
        </div>
      </div>

      {/* Details Section */}
      <div className="flex flex-col flex-1 p-5">
        {/* Title */}
        <h3 className="line-clamp-1 text-lg font-extrabold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {item.name}
        </h3>

        {/* Minimalist City, Rating & Reviews Row */}
        <div className="mt-2.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5 text-blue-500 shrink-0" />
            <span>{item.cityName}</span>
          </div>
          <span className="text-slate-300 dark:text-slate-800">•</span>
          <div className="flex items-center gap-1 text-amber-500 dark:text-amber-400">
            <Star className="h-3.5 w-3.5 fill-current" />
            <span>{item.rating.toFixed(1)}</span>
          </div>
          <span className="text-slate-350 dark:text-slate-800">•</span>
          <span>{duration}</span>
        </div>

        {/* Description */}
        <p className="mt-3 line-clamp-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
          {item.description}
        </p>

        {/* Best time to visit info */}
        <div className="mt-3.5 rounded-xl bg-slate-50 p-2.5 text-[11px] font-semibold text-slate-600 dark:bg-slate-800/40 dark:text-slate-350 flex items-center gap-1.5">
          <span className="font-bold text-blue-600 dark:text-blue-400">{dict.recommended || "Tavsiya etiladi:"}</span>
          <span className="truncate">{item.bestTimeToVisit}</span>
        </div>

        {/* Divider */}
        <div className="mt-5 border-t border-slate-100 dark:border-slate-800/80" />

        {/* Pricing & CTA */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              {dict.from ? `${dict.from} (` : ""}{locale === "uz" ? "Kirish narxi" : locale === "ru" ? "Входной билет" : "Entry ticket"}{dict.from ? ")" : ""}
            </span>
            <span className="mt-0.5 text-base font-extrabold text-slate-900 dark:text-white">
              {format(entryPrice)}
            </span>
          </div>

          <div className="inline-flex items-center gap-1 text-xs font-bold text-blue-650 dark:text-blue-400 transition-colors group-hover:text-blue-600 dark:group-hover:text-blue-300">
            <span>{dict.moreInfo || "Batafsil"}</span>
            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function AttractionsView({
  dict,
  locale,
}: {
  dict: CatalogDict["attractions"];
  locale: Locale;
}) {
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
        priceFormatted: (dict.categories as Record<string, string> | undefined)?.[a.categoryKey] ?? "Obida",
        rating: a.rating,
        imageUrl: a.imageUrl,
      })),
    [filtered, dict.categories]
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
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={() => setIsFilterOpen(true)}
              className="lg:hidden"
            >
              <Filter className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span>{locale === "uz" ? "Filtrlar" : locale === "ru" ? "Фильтры" : "Filters"}</span>
              <ChevronDown className="h-4 w-4 text-slate-600 dark:text-slate-400" />
            </Button>

            {/* View Toggle */}
            <div className="inline-flex rounded-xl border border-slate-200 bg-slate-100 p-1 dark:border-slate-800 dark:bg-slate-900">
              <Button
                type="button"
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="sm"
                rounded="lg"
                onClick={() => setViewMode("grid")}
                className={cn(
                  "gap-1.5 h-8 min-h-0",
                  viewMode === "grid"
                    ? "bg-white text-slate-900 shadow-xs border-none hover:bg-white"
                    : "text-slate-600 hover:text-slate-900 border-none"
                )}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                <span>Grid</span>
              </Button>

              <Button
                type="button"
                variant={viewMode === "map" ? "secondary" : "ghost"}
                size="sm"
                rounded="lg"
                onClick={() => setViewMode("map")}
                className={cn(
                  "gap-1.5 h-8 min-h-0",
                  viewMode === "map"
                    ? "bg-white text-slate-900 shadow-xs border-none hover:bg-white"
                    : "text-slate-600 hover:text-slate-900 border-none"
                )}
              >
                <MapIcon className="h-3.5 w-3.5" />
                <span>Xarita</span>
              </Button>
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
            <Select
              value={tempCategory}
              onChange={setTempCategory}
              options={categories.map((c): SelectOption => ({ value: c.id, label: c.label }))}
              ariaLabel="Kategoriya filtri"
            />
          </FilterGroup>

          {/* City */}
          <FilterGroup title="Shahar">
            <Select
              value={tempCity}
              onChange={setTempCity}
              options={[
                { value: "all", label: "Barcha shaharlar" },
                ...cities.map((city): SelectOption => ({ value: city, label: city })),
              ]}
              ariaLabel="Shahar filtri"
            />
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
                      dict={dict}
                      locale={locale}
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
                  dict={dict}
                  locale={locale}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
