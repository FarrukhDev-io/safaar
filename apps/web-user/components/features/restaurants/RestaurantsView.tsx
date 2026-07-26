"use client";

import { useState, useMemo, useCallback } from "react";
import Image from "next/image";
import {
  MapPin,
  Star,
  Clock,
  Utensils,
  ArrowRight,
  PhoneCall,
  X,
  CheckCircle2,
  Calendar,
  Users,
  User,
  Phone,
  LayoutGrid,
  Map as MapIcon,
  Filter,
  ChevronDown,
} from "lucide-react";
import { formatSum } from "@/lib/money";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { DatePicker } from "@/components/ui/DatePicker";
import type { CatalogDict } from "@/i18n/dictionaries";
import { CatalogHeader } from "@/components/catalog/CatalogHeader";
import { MOCK_RESTAURANTS } from "@/components/catalog/data";
import type { RestaurantItem } from "@/components/catalog/types";
import { InteractiveMapView, type MapMarkerItem } from "@/components/features/map/InteractiveMapView";
import { BaseCard } from "@/components/ui/BaseCard";
import { FilterSidebar } from "@/components/ui/FilterSidebar";
import { FilterGroup } from "@/components/ui/FilterGroup";
import { ActiveFilters, type ActiveFilterChip } from "@/components/ui/ActiveFilters";
import { EmptyState } from "@/components/ui/EmptyState";

export type { RestaurantItem };

/* ─── RestaurantCard ─────────────────────────────────────────────── */
function RestaurantCard({
  item,
  dict,
  onBook,
}: {
  item: RestaurantItem;
  dict: CatalogDict["restaurants"];
  onBook: () => void;
}) {
  const badge = (
    <span className="rounded-full bg-slate-900/55 px-2.5 py-1 text-xs font-medium text-white">
      {item.cuisine}
    </span>
  );

  const subInfo = (
    <>
      <MapPin className="h-3.5 w-3.5 shrink-0" />
      {item.cityName}
      <span className="text-slate-300 dark:text-slate-700">·</span>
      <Clock className="h-3.5 w-3.5 shrink-0" />
      {item.workingHours}
    </>
  );

  const ratingElement = (
    <>
      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
      <span className="font-semibold text-slate-700 dark:text-slate-300">
        {item.rating.toFixed(1)}
      </span>
      <span>· {item.reviewsCount} ta sharh</span>
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
      onClick={onBook}
      footerLeft={
        <>
          <span className="text-[10px] font-medium text-slate-400">{dict.avgCheck}</span>
          <span className="text-sm font-bold text-slate-900 dark:text-white">
            {formatSum(item.averageCheckSum)}
          </span>
        </>
      }
      footerRight={
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onBook();
          }}
          aria-label={`${item.name} uchun stol bron qilish`}
          className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          {dict.reserveTable}
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      }
    />
  );
}

export function RestaurantsView({ dict }: { dict: CatalogDict["restaurants"] }) {
  const [query, setQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState("all");
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);
  const [maxAvgCheck, setMaxAvgCheck] = useState<string>("");

  // Temporary filter state for sidebar/drawer before applying
  const [tempCity, setTempCity] = useState("all");
  const [tempCuisines, setTempCuisines] = useState<string[]>([]);
  const [tempMaxAvgCheck, setTempMaxAvgCheck] = useState<string>("");

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "map">("grid");
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Reservation form state
  const [selectedRestaurant, setSelectedRestaurant] = useState<RestaurantItem | null>(null);
  const [guestCount, setGuestCount] = useState(2);
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [time, setTime] = useState("18:00");
  const [fullName, setFullName] = useState("");
  const [phoneInput, setPhoneInput] = useState("+998");
  const [isSuccess, setIsSuccess] = useState(false);

  const cities = useMemo(() => Array.from(new Set(MOCK_RESTAURANTS.map((r) => r.cityName))), []);
  const cuisines = useMemo(() => Array.from(new Set(MOCK_RESTAURANTS.map((r) => r.cuisine))), []);

  const handleOpenModalCb = useCallback((restaurant: RestaurantItem) => {
    setSelectedRestaurant(restaurant);
    setIsSuccess(false);
    setGuestCount(2);
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedRestaurant(null);
    setIsSuccess(false);
  }, []);

  const handleReserveSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    setIsSuccess(true);
  }, []);

  const handleApply = useCallback(() => {
    setSelectedCity(tempCity);
    setSelectedCuisines(tempCuisines);
    setSelectedCuisines(tempCuisines);
    setSelectedCity(tempCity);
    setSelectedCuisines(tempCuisines);
    setMaxAvgCheck(tempMaxAvgCheck);
  }, [tempCity, tempCuisines, tempMaxAvgCheck]);

  const handleReset = useCallback(() => {
    setTempCity("all");
    setTempCuisines([]);
    setTempMaxAvgCheck("");
    setSelectedCity("all");
    setSelectedCuisines([]);
    setMaxAvgCheck("");
  }, []);

  const toggleTempCuisine = useCallback((cuisine: string) => {
    setTempCuisines((prev) =>
      prev.includes(cuisine) ? prev.filter((c) => c !== cuisine) : [...prev, cuisine]
    );
  }, []);

  const filtered = useMemo(() => {
    return MOCK_RESTAURANTS.filter((r) => {
      const q = query.toLowerCase();
      const matchesQuery =
        r.name.toLowerCase().includes(q) || r.cuisine.toLowerCase().includes(q);
      const matchesCity =
        selectedCity === "all" || r.cityName.toLowerCase() === selectedCity.toLowerCase();
      const matchesCuisine =
        selectedCuisines.length === 0 || selectedCuisines.includes(r.cuisine);
      const matchesPrice =
        !maxAvgCheck || r.averageCheckSum <= Number(maxAvgCheck);

      return matchesQuery && matchesCity && matchesCuisine && matchesPrice;
    });
  }, [query, selectedCity, selectedCuisines, maxAvgCheck]);

  const mapItems: MapMarkerItem[] = useMemo(
    () =>
      filtered.map((r) => ({
        id: r.id,
        name: r.name,
        cityName: r.cityName,
        address: r.address,
        priceFormatted: formatSum(r.averageCheckSum),
        rating: r.rating,
        imageUrl: r.imageUrl,
      })),
    [filtered]
  );

  const activeFilterChips = useMemo(() => {
    const chips: ActiveFilterChip[] = [];
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
    selectedCuisines.forEach((c) => {
      chips.push({
        key: `cuisine-${c}`,
        label: c,
        onRemove: () => {
          setSelectedCuisines((prev) => prev.filter((x) => x !== c));
          setTempCuisines((prev) => prev.filter((x) => x !== c));
        },
      });
    });
    if (maxAvgCheck) {
      chips.push({
        key: "price",
        label: `Max Check: ${formatSum(Number(maxAvgCheck))}`,
        onRemove: () => {
          setMaxAvgCheck("");
          setTempMaxAvgCheck("");
        },
      });
    }
    return chips;
  }, [selectedCity, selectedCuisines, maxAvgCheck]);

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
      <CatalogHeader
        icon={<Utensils className="h-3.5 w-3.5 text-primary-600 dark:text-primary-400" />}
        badge={dict.badge}
        title={dict.title}
        subtitle={dict.subtitle}
        searchValue={query}
        onSearchChange={setQuery}
        searchPlaceholder={dict.searchPlaceholder}
        filterControls={
          <div className="flex items-center justify-between gap-3 w-full">
            {/* Mobile Filter Trigger */}
            <button
              type="button"
              onClick={() => setIsFilterOpen(true)}
              className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-900 shadow-2xs hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-white lg:hidden min-h-[44px]"
            >
              <Filter className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span>Filtrlar</span>
              <ChevronDown className="h-4 w-4 text-slate-600 dark:text-slate-400" />
            </button>

            {/* View Mode Toggle */}
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

      {/* Active filters display */}
      {activeFilterChips.length > 0 && (
        <div className="mb-6">
          <ActiveFilters chips={activeFilterChips} onClearAll={handleReset} />
        </div>
      )}

      {/* Grid Layout: Left Sidebar + Right Listing */}
      <div className="mt-4 grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6 items-start">
        {/* Responsive filter sidebar component */}
        <FilterSidebar
          title="Restoranlar Filtri"
          isOpen={isFilterOpen}
          onClose={() => setIsFilterOpen(false)}
          onApply={handleApply}
          onReset={handleReset}
        >
          {/* City filter */}
          <FilterGroup title="Shahar">
            <select
              value={tempCity}
              onChange={(e) => setTempCity(e.target.value)}
              className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
            >
              <option value="all">{dict.allCities}</option>
              {cities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </FilterGroup>

          {/* Cuisine filter */}
          <FilterGroup title="Oshxona Turi">
            <div className="flex flex-col gap-2">
              {cuisines.map((cuisine) => {
                const checked = tempCuisines.includes(cuisine);
                return (
                  <label
                    key={cuisine}
                    className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-all ${
                      checked
                        ? "border-blue-500 bg-blue-50/50 text-blue-900 font-bold dark:bg-blue-950/50 dark:text-blue-300"
                        : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleTempCuisine(cuisine)}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>{cuisine}</span>
                  </label>
                );
              })}
            </div>
          </FilterGroup>

          {/* Price check filter */}
          <FilterGroup title="O'rtacha Hisob (Max)">
            <Input
              type="number"
              min={0}
              placeholder="Masalan: 100000"
              value={tempMaxAvgCheck}
              onChange={(e) => setTempMaxAvgCheck(e.target.value)}
            />
          </FilterGroup>
        </FilterSidebar>

        {/* Content list */}
        <div className="flex-1">
          {filtered.length === 0 ? (
            <EmptyState
              title="Restoranlar topilmadi"
              description="Siz kiritgan filtrlar bo'yicha hech qanday restoran topilmadi. Filtrlar va qidiruv so'zini tozalab qaytadan urinib ko'ring."
              actionLabel="Hammasini tozalash"
              onAction={handleReset}
            />
          ) : viewMode === "map" ? (
            /* ── Map view ── */
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_450px]">
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                {filtered.map((item) => (
                  <div
                    key={item.id}
                    onMouseEnter={() => setHoveredId(item.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    className={`transition-all duration-200 rounded-2xl ${
                      selectedId === item.id ? "ring-2 ring-blue-500 shadow-md" : ""
                    }`}
                  >
                    <RestaurantCard item={item} dict={dict} onBook={() => handleOpenModalCb(item)} />
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
            /* ── Grid view ── */
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {filtered.map((item) => (
                <RestaurantCard key={item.id} item={item} dict={dict} onBook={() => handleOpenModalCb(item)} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Table Reservation Modal */}
      {selectedRestaurant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={handleCloseModal}
          />

          <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <button
              type="button"
              onClick={handleCloseModal}
              className="absolute right-4 top-4 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
            >
              <X className="h-5 w-5" />
            </button>

            {!isSuccess ? (
              <form onSubmit={handleReserveSubmit} className="flex flex-col gap-5">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
                  <div className="relative h-14 w-14 overflow-hidden rounded-2xl bg-slate-100">
                    <Image
                      src={selectedRestaurant.imageUrl}
                      alt={selectedRestaurant.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                      {selectedRestaurant.name}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {selectedRestaurant.cityName} · {selectedRestaurant.cuisine}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <label className="flex flex-col gap-1.5">
                    <span className="flex items-center gap-1 text-xs font-bold text-slate-700 dark:text-slate-300">
                      <Users className="h-3.5 w-3.5 text-blue-600" />
                      {dict.guests}
                    </span>
                    <select
                      value={guestCount}
                      onChange={(e) => setGuestCount(Number(e.target.value))}
                      className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-900 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                    >
                      {[1, 2, 3, 4, 5, 6, 8, 10].map((n) => (
                        <option key={n} value={n}>
                          {n} kishi
                        </option>
                      ))}
                    </select>
                  </label>

                  <div className="flex flex-col gap-1.5">
                    <span className="flex items-center gap-1 text-xs font-bold text-slate-700 dark:text-slate-300">
                      <Calendar className="h-3.5 w-3.5 text-blue-600" />
                      {dict.date}
                    </span>
                    <DatePicker
                      value={date}
                      onChange={setDate}
                      min={new Date().toISOString().split("T")[0]}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="flex items-center gap-1 text-xs font-bold text-slate-700 dark:text-slate-300">
                    <Clock className="h-3.5 w-3.5 text-blue-600" />
                    {dict.time}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {["12:00", "14:00", "18:00", "19:30", "20:30"].map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setTime(t)}
                        className={`rounded-xl border px-3.5 py-1.5 text-xs font-bold transition-all ${
                          time === t
                            ? "border-blue-600 bg-blue-600 text-white"
                            : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <label className="flex flex-col gap-1.5">
                  <span className="flex items-center gap-1 text-xs font-bold text-slate-700 dark:text-slate-300">
                    <User className="h-3.5 w-3.5 text-blue-600" />
                    {dict.fullName}
                  </span>
                  <Input
                    type="text"
                    required
                    placeholder="Masalan: Jasur Rahimov"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className="flex items-center gap-1 text-xs font-bold text-slate-700 dark:text-slate-300">
                    <Phone className="h-3.5 w-3.5 text-blue-600" />
                    {dict.phone}
                  </span>
                  <Input
                    type="tel"
                    required
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                  />
                </label>

                <Button
                  type="submit"
                  size="lg"
                  className="mt-2 w-full rounded-2xl bg-blue-600 font-bold text-white shadow-md hover:bg-blue-700"
                >
                  {dict.confirm}
                </Button>
              </form>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                  <CheckCircle2 className="h-10 w-10" />
                </div>
                <h3 className="mt-4 text-xl font-extrabold text-slate-900 dark:text-white">
                  {dict.successTitle}
                </h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                  {dict.successDesc}
                </p>

                <div className="mt-6 flex w-full flex-col gap-3">
                  <a
                    href={`tel:${selectedRestaurant.phone.replace(/\s+/g, "")}`}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3 text-sm font-bold text-white shadow-md hover:bg-emerald-700"
                  >
                    <PhoneCall className="h-4 w-4" />
                    <span>{dict.callNow}: {selectedRestaurant.phone}</span>
                  </a>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleCloseModal}
                    className="w-full rounded-2xl"
                  >
                    {dict.close}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
