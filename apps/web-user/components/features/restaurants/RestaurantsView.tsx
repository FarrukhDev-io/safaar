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
  Sun,
  Moon,
} from "lucide-react";
import { Select, type SelectOption } from "@/components/ui/Select";
import { formatSum } from "@/lib/money";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/cn";
import { DatePicker } from "@/components/ui/DatePicker";
import type { CatalogDict } from "@/i18n/dictionaries";
import { CatalogHeader } from "@/components/catalog/CatalogHeader";
import { MOCK_RESTAURANTS } from "@/components/catalog/data";
import type { RestaurantItem } from "@/components/catalog/types";
import { InteractiveMapView, type MapMarkerItem } from "@/components/features/map/InteractiveMapView";
import { FilterSidebar } from "@/components/ui/FilterSidebar";
import { FilterGroup } from "@/components/ui/FilterGroup";
import { ActiveFilters, type ActiveFilterChip } from "@/components/ui/ActiveFilters";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";

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
  return (
    <div
      onClick={onBook}
      className="group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-blue-500/30 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900/60 dark:backdrop-blur-md"
    >
      {/* Image Section */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
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
        
        {/* Cuisine Badge - Glassmorphism */}
        <div className="absolute left-3.5 top-3.5 z-10">
          <span className="inline-flex items-center rounded-xl bg-slate-900/65 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-md border border-white/10 shadow-xs">
            {item.cuisine}
          </span>
        </div>

        {/* Rating Badge */}
        <div className="absolute right-3.5 top-3.5 z-10">
          <span className="inline-flex items-center gap-1 rounded-xl bg-amber-500/95 px-2.5 py-1 text-[11px] font-extrabold text-white backdrop-blur-xs shadow-xs">
            <Star className="h-3 w-3 fill-white text-white" />
            {item.rating.toFixed(1)}
          </span>
        </div>
      </div>

      {/* Details Section */}
      <div className="flex flex-col flex-1 p-5">
        {/* Title */}
        <h3 className="line-clamp-1 text-lg font-extrabold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {item.name}
        </h3>

        {/* Working Hours & City */}
        <div className="mt-2.5 flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5 text-blue-500 shrink-0" />
            <span>{item.workingHours}</span>
          </div>
          <span className="text-slate-300 dark:text-slate-850">•</span>
          <div className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5 text-blue-500 shrink-0" />
            <span>{item.cityName}</span>
          </div>
        </div>

        {/* Address */}
        <p className="mt-2.5 line-clamp-1 text-xs text-slate-400 dark:text-slate-500 font-medium">
          {item.address}
        </p>

        {/* Reviews count info */}
        <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 font-semibold">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
          <span>{item.reviewsCount} ta sharh</span>
        </div>

        {/* Divider */}
        <div className="mt-5 border-t border-slate-100 dark:border-slate-800/80" />
        {/* Pricing & CTA */}
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">{dict.avgCheck}</span>
            <span className="mt-0.5 text-base font-extrabold text-slate-900 dark:text-white">
              {formatSum(item.averageCheckSum)}
            </span>
          </div>

          <div className="inline-flex w-full sm:w-auto min-h-[40px] items-center justify-center gap-1 rounded-xl bg-blue-50 px-3.5 py-2 text-xs font-bold text-blue-600 transition-all duration-300 group-hover:bg-blue-600 group-hover:text-white group-hover:shadow-md group-hover:shadow-blue-500/20 dark:bg-slate-800 dark:text-blue-400 dark:group-hover:bg-blue-600 dark:group-hover:text-white">
            <span>{dict.reserveTable}</span>
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </div>
        </div>
      </div>
    </div>
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
  const [bookingRef, setBookingRef] = useState("");

  const cities = useMemo(() => Array.from(new Set(MOCK_RESTAURANTS.map((r) => r.cityName))), []);
  const cuisines = useMemo(() => Array.from(new Set(MOCK_RESTAURANTS.map((r) => r.cuisine))), []);

  const handleOpenModalCb = useCallback((restaurant: RestaurantItem) => {
    setSelectedRestaurant(restaurant);
    setIsSuccess(false);
    setGuestCount(2);
    setFullName("");
    setPhoneInput("+998");
    setBookingRef("");
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedRestaurant(null);
    setIsSuccess(false);
  }, []);

  const handleReserveSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const randomRef = `#SR-${Math.floor(1000 + Math.random() * 9000)}`;
    setBookingRef(randomRef);
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
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={() => setIsFilterOpen(true)}
              className="lg:hidden"
            >
              <Filter className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span>Filtrlar</span>
              <ChevronDown className="h-4 w-4 text-slate-600 dark:text-slate-400" />
            </Button>

            {/* View Mode Toggle */}
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
            <Select
              value={tempCity}
              onChange={setTempCity}
              options={[
                { value: "all", label: dict.allCities },
                ...cities.map((city): SelectOption => ({ value: city, label: city })),
              ]}
              ariaLabel="Shahar filtri"
            />
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
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {filtered.map((item) => (
                <RestaurantCard key={item.id} item={item} dict={dict} onBook={() => handleOpenModalCb(item)} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Table Reservation Modal */}
      <Modal
        isOpen={!!selectedRestaurant}
        onClose={handleCloseModal}
        size="lg"
        hideCloseButton={true}
      >
        {selectedRestaurant && (
          <>
            <Button
              type="button"
              variant="ghost"
              rounded="full"
              size="sm"
              onClick={handleCloseModal}
              className={cn(
                "absolute right-4 top-4 z-20 min-h-0 h-9 w-9 p-0 flex items-center justify-center border-none",
                !isSuccess
                  ? "bg-slate-950/40 text-white/90 backdrop-blur-md hover:bg-slate-950/60 hover:text-white"
                  : "text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              )}
            >
              <X className="h-5 w-5" />
            </Button>

            {!isSuccess ? (
              <form onSubmit={handleReserveSubmit} className="flex flex-col gap-6">
                {/* Modal Banner & Header */}
                <div className="relative -mx-6 -mt-6 h-48 overflow-hidden">
                  <Image
                    src={selectedRestaurant.imageUrl}
                    alt={selectedRestaurant.name}
                    fill
                    className="object-cover"
                    priority
                  />
                  {/* Premium overlay gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/25 to-transparent" />
                  
                  <div className="absolute bottom-5 left-6 right-6 text-white flex flex-col gap-1">
                    <span className="w-fit rounded-lg bg-blue-600/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider backdrop-blur-xs">
                      {selectedRestaurant.cuisine}
                    </span>
                    <h2 className="text-2xl font-extrabold tracking-tight text-white drop-shadow-md">
                      {selectedRestaurant.name}
                    </h2>
                    <p className="flex items-center gap-1 text-xs font-semibold text-slate-200">
                      <MapPin className="h-3.5 w-3.5 text-blue-405" />
                      <span>{selectedRestaurant.cityName} · {selectedRestaurant.address}</span>
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  {/* Custom Guest Picker */}
                  <div className="flex flex-col gap-2">
                    <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold text-slate-500">
                      <Users className="h-4 w-4 text-blue-500" />
                      {dict.guests}
                    </span>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-1.5">
                        {[2, 4, 6, 8].map((num) => {
                          const isSelected = guestCount === num;
                          return (
                            <button
                              key={num}
                              type="button"
                              onClick={() => setGuestCount(num)}
                              className={`flex-1 py-1.5 rounded-xl border text-xs font-bold transition-all duration-200 active:scale-95 ${
                                isSelected
                                  ? "bg-blue-600 border-blue-600 text-white shadow-xs"
                                  : "bg-slate-50/50 border-slate-200 hover:bg-slate-55 text-slate-700 dark:bg-slate-900/60 dark:border-slate-800 dark:text-slate-350 dark:hover:bg-slate-800"
                              }`}
                            >
                              {num} kishi
                            </button>
                          );
                        })}
                      </div>
                      <div className="flex items-center justify-between h-9 rounded-xl border border-slate-200 bg-slate-50/30 px-2 dark:border-slate-850 dark:bg-slate-900/30">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={guestCount <= 1}
                          onClick={() => setGuestCount((c) => Math.max(1, c - 1))}
                          className="h-7 w-7 min-h-0 p-0 text-md font-bold"
                        >
                          -
                        </Button>
                        <span className="text-xs font-bold text-slate-950 dark:text-white select-none">
                          Boshqa: {guestCount} kishi
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={guestCount >= 20}
                          onClick={() => setGuestCount((c) => Math.min(20, c + 1))}
                          className="h-7 w-7 min-h-0 p-0 text-md font-bold"
                        >
                          +
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold text-slate-500">
                      <Calendar className="h-4 w-4 text-blue-500" />
                      {dict.date}
                    </span>
                    <DatePicker
                      value={date}
                      onChange={setDate}
                      min={new Date().toISOString().split("T")[0]}
                    />
                  </div>
                </div>

                {/* Custom Time Selector */}
                <div className="flex flex-col gap-2.5">
                  <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold text-slate-500">
                    <Clock className="h-4 w-4 text-blue-500" />
                    {dict.time}
                  </span>
                  <div className="flex flex-col gap-3">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Tushlik (Lunch)</span>
                      <div className="grid grid-cols-5 gap-2">
                        {["12:00", "14:00"].map((t) => {
                          const isSelected = time === t;
                          return (
                            <button
                              key={t}
                              type="button"
                              onClick={() => setTime(t)}
                              className={`group flex items-center justify-center gap-1.5 rounded-xl py-2 px-3 border text-center transition-all duration-205 active:scale-95 ${
                                isSelected
                                  ? "border-blue-600 bg-blue-600 text-white shadow-md shadow-blue-500/20 scale-105 dark:border-blue-550 dark:bg-blue-600"
                                  : "border-slate-200 bg-slate-50/30 hover:bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-350 dark:hover:bg-slate-850"
                              }`}
                            >
                              <Sun className={`h-3.5 w-3.5 ${isSelected ? "text-white" : "text-amber-500"}`} />
                              <span className="text-xs font-bold tracking-tight">{t}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Kechki ovqat (Dinner)</span>
                      <div className="grid grid-cols-5 gap-2">
                        {["18:00", "19:30", "20:30"].map((t) => {
                          const isSelected = time === t;
                          return (
                            <button
                              key={t}
                              type="button"
                              onClick={() => setTime(t)}
                              className={`group flex items-center justify-center gap-1.5 rounded-xl py-2 px-3 border text-center transition-all duration-205 active:scale-95 ${
                                isSelected
                                  ? "border-blue-600 bg-blue-600 text-white shadow-md shadow-blue-500/20 scale-105 dark:border-blue-550 dark:bg-blue-600"
                                  : "border-slate-200 bg-slate-50/30 hover:bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-355 dark:hover:bg-slate-850"
                              }`}
                            >
                              <Moon className={`h-3.5 w-3.5 ${isSelected ? "text-white" : "text-indigo-450"}`} />
                              <span className="text-xs font-bold tracking-tight">{t}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Modern Form Fields */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500">
                    {dict.fullName}
                  </span>
                  <div className="relative flex items-center">
                    <div className="absolute left-4 pointer-events-none text-slate-400 dark:text-slate-500">
                      <User className="h-4 w-4" />
                    </div>
                    <Input
                      type="text"
                      required
                      placeholder="Masalan: Jasur Rahimov"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="pl-11 h-11 w-full bg-slate-50/30 border-slate-200 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-650/15 placeholder:text-slate-400 dark:bg-slate-800/40 dark:border-slate-800 dark:text-white transition-all rounded-2xl font-semibold"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500">
                    {dict.phone}
                  </span>
                  <div className="relative flex items-center">
                    <div className="absolute left-4 pointer-events-none text-slate-400 dark:text-slate-500">
                      <Phone className="h-4 w-4" />
                    </div>
                    <Input
                      type="tel"
                      required
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                      className="pl-11 h-11 w-full bg-slate-50/30 border-slate-200 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-650/15 dark:bg-slate-800/40 dark:border-slate-800 dark:text-white transition-all rounded-2xl font-semibold"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="mt-2 w-full min-h-[46px] rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 font-bold text-white shadow-md shadow-blue-500/20 hover:from-blue-700 hover:to-indigo-700 active:scale-[0.98] transition-all"
                >
                  {dict.confirm}
                </Button>
              </form>
            ) : (
              <div className="flex flex-col items-center justify-center py-2 text-center animate-ticket">
                {/* Style tag for animations */}
                <style>{`
                  @keyframes ticket-scale-up {
                    0% { transform: scale(0.95); opacity: 0; }
                    100% { transform: scale(1); opacity: 1; }
                  }
                  @keyframes check-scale-up {
                    0% { transform: scale(0.6); opacity: 0; }
                    70% { transform: scale(1.1); }
                    100% { transform: scale(1); opacity: 1; }
                  }
                  .animate-ticket {
                    animation: ticket-scale-up 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                  }
                  .animate-check {
                    animation: check-scale-up 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s both;
                  }
                `}</style>

                {/* Checkmark Icon Container */}
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 animate-check shadow-xs">
                  <CheckCircle2 className="h-9 w-9" />
                </div>
                
                <h3 className="mt-4 text-xl font-extrabold text-slate-900 dark:text-white">
                  {dict.successTitle}
                </h3>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-sm">
                  {dict.successDesc}
                </p>

                {/* Booking Receipt Ticket - High-End Redesign */}
                <div className="mt-6 w-full rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100/50 p-5 dark:border-slate-800 dark:bg-gradient-to-br dark:from-slate-900 dark:to-slate-950/50 relative overflow-hidden shadow-xs">
                  {/* Decorative side ticket notches */}
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-4.5 h-4.5 rounded-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800" />
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-4.5 h-4.5 rounded-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800" />

                  {/* Top part: Booking Reference & Restaurant */}
                  <div className="flex justify-between items-center text-xs text-slate-400 dark:text-slate-500 mb-3.5">
                    <span className="font-semibold uppercase tracking-wider text-[10px]">Buyurtma Chiptasi</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white bg-slate-200/60 dark:bg-slate-800 px-2 py-0.5 rounded-lg text-[11px]">
                      {bookingRef}
                    </span>
                  </div>
                  
                  <div className="text-left border-b border-dashed border-slate-200 dark:border-slate-850 pb-3.5 mb-3.5">
                    <h4 className="text-base font-extrabold text-slate-900 dark:text-white">{selectedRestaurant.name}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1 font-semibold">
                      <MapPin className="h-3.5 w-3.5 text-blue-500" />
                      <span>{selectedRestaurant.cityName} · {selectedRestaurant.cuisine}</span>
                    </p>
                  </div>

                  {/* Structured details grid */}
                  <div className="grid grid-cols-2 gap-y-4 gap-x-4 text-left text-xs">
                    <div>
                      <span className="block text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider text-[9px]">Mijoz</span>
                      <span className="block font-bold text-slate-800 dark:text-slate-200 mt-0.5 truncate">{fullName}</span>
                    </div>
                    <div>
                      <span className="block text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider text-[9px]">Telefon</span>
                      <span className="block font-bold text-slate-800 dark:text-slate-200 mt-0.5 truncate">{phoneInput}</span>
                    </div>

                    <div>
                      <span className="block text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider text-[9px]">Mehmonlar</span>
                      <span className="block font-bold text-slate-800 dark:text-slate-200 mt-0.5 flex items-center gap-1.5">
                        <Users className="h-4 w-4 text-blue-500" />
                        {guestCount} kishi
                      </span>
                    </div>
                    <div>
                      <span className="block text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider text-[9px]">Sana & Vaqt</span>
                      <span className="block font-bold text-slate-800 dark:text-slate-200 mt-0.5 flex items-center gap-1.5">
                        <Clock className="h-4 w-4 text-blue-500" />
                        {date} ({time})
                      </span>
                    </div>
                  </div>

                  {/* Dynamic CSS Barcode! */}
                  <div className="mt-5 flex flex-col items-center justify-center gap-1 border-t border-dashed border-slate-200 pt-4 dark:border-slate-800">
                    <div className="flex h-8 items-end gap-[1.5px] opacity-75">
                      {[2, 1, 3, 1, 2, 4, 1, 2, 1, 3, 2, 1, 4, 2, 1, 3, 1, 2, 1, 4, 2, 1, 3, 1].map((w, idx) => (
                        <div
                          key={idx}
                          className="bg-slate-800 dark:bg-slate-250 h-full"
                          style={{ width: `${w}px` }}
                        />
                      ))}
                    </div>
                    <span className="text-[9px] font-mono tracking-widest text-slate-400 uppercase">SAFAAR-RES-{bookingRef.slice(0, 6)}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-6 flex w-full flex-col gap-3">
                  <a
                    href={`tel:${selectedRestaurant.phone.replace(/\s+/g, "")}`}
                    className="flex min-h-[46px] w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-md shadow-emerald-500/20 hover:bg-emerald-700 active:scale-[0.98] transition-transform"
                  >
                    <PhoneCall className="h-4 w-4" />
                    <span>{dict.callNow}: {selectedRestaurant.phone}</span>
                  </a>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleCloseModal}
                    className="w-full min-h-[46px] rounded-2xl font-bold border border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-355 active:scale-[0.98] transition-transform"
                  >
                    {dict.close}
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Modal>
    </main>
  );
}
