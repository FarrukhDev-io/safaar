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
  const badge = (
    <span className="rounded-full bg-slate-950/40 backdrop-blur-md border border-white/20 px-2.5 py-1 text-xs font-medium text-white">
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
        <div
          className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 transition-all duration-300 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 dark:border-slate-700 dark:text-slate-300"
        >
          {dict.reserveTable}
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
        </div>
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
      <Modal
        isOpen={!!selectedRestaurant}
        onClose={handleCloseModal}
        size="lg"
        hideCloseButton={true}
      >
        {selectedRestaurant && (
          <>
            <button
              type="button"
              onClick={handleCloseModal}
              className={`absolute right-4 top-4 z-20 rounded-full p-2 transition-colors ${
                !isSuccess
                  ? "bg-slate-950/40 text-white/90 backdrop-blur-xs hover:bg-slate-950/60 hover:text-white"
                  : "text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
              }`}
            >
              <X className="h-5 w-5" />
            </button>

            {!isSuccess ? (
              <form onSubmit={handleReserveSubmit} className="flex flex-col gap-5">
                {/* Modal Banner & Header */}
                <div className="relative -mx-6 -mt-6 h-36 overflow-hidden">
                  <Image
                    src={selectedRestaurant.imageUrl}
                    alt={selectedRestaurant.name}
                    fill
                    className="object-cover"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                  <div className="absolute bottom-4 left-6 right-6 text-white">
                    <h2 className="text-xl font-bold tracking-tight text-white drop-shadow-md">
                      {selectedRestaurant.name}
                    </h2>
                    <p className="mt-1 flex items-center gap-1 text-xs font-medium text-slate-200">
                      <MapPin className="h-3.5 w-3.5 text-slate-350" />
                      <span>{selectedRestaurant.cityName} · {selectedRestaurant.cuisine}</span>
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Custom Guest Picker */}
                  <div className="flex flex-col gap-1.5">
                    <span className="flex items-center gap-1 text-xs font-bold text-slate-700 dark:text-slate-300">
                      <Users className="h-3.5 w-3.5 text-blue-600" />
                      {dict.guests}
                    </span>
                    <div className="flex items-center justify-between h-11 rounded-xl border border-slate-200 bg-slate-50/50 px-2 dark:border-slate-800 dark:bg-slate-900/50">
                      <button
                        type="button"
                        disabled={guestCount <= 1}
                        onClick={() => setGuestCount((c) => Math.max(1, c - 1))}
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-700 shadow-xs hover:bg-slate-50 active:scale-95 disabled:opacity-40 disabled:pointer-events-none transition-all dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700/80"
                      >
                        <span className="text-lg font-bold leading-none">-</span>
                      </button>
                      <span className="flex items-center gap-1.5 text-sm font-bold text-slate-900 dark:text-white select-none">
                        {guestCount === 1 ? (
                          <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        ) : (
                          <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        )}
                        {guestCount} kishi
                      </span>
                      <button
                        type="button"
                        disabled={guestCount >= 20}
                        onClick={() => setGuestCount((c) => Math.min(20, c + 1))}
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-700 shadow-xs hover:bg-slate-50 active:scale-95 disabled:opacity-40 disabled:pointer-events-none transition-all dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700/80"
                      >
                        <span className="text-lg font-bold leading-none">+</span>
                      </button>
                    </div>
                  </div>

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

                {/* Custom Time Selector */}
                <div className="flex flex-col gap-2">
                  <span className="flex items-center gap-1 text-xs font-bold text-slate-700 dark:text-slate-300">
                    <Clock className="h-3.5 w-3.5 text-blue-600" />
                    {dict.time}
                  </span>
                  <div className="grid grid-cols-5 gap-2">
                    {["12:00", "14:00", "18:00", "19:30", "20:30"].map((t) => {
                      const isDinner = parseInt(t.split(":")[0], 10) >= 16;
                      const isSelected = time === t;
                      return (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setTime(t)}
                          className={`group flex flex-col items-center justify-center rounded-xl p-2 border text-center transition-all duration-250 active:scale-95 ${
                            isSelected
                              ? "border-blue-600 bg-blue-50/70 text-blue-900 shadow-md ring-1 ring-blue-500 scale-105 dark:border-blue-500 dark:bg-blue-950/40 dark:text-blue-100"
                              : "border-slate-200 bg-slate-50/50 hover:bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-300 dark:hover:bg-slate-800/80"
                          }`}
                        >
                          <span className={`text-sm font-bold tracking-tight transition-colors ${
                            isSelected ? "text-blue-700 dark:text-blue-400" : "text-slate-800 dark:text-slate-200"
                          }`}>
                            {t}
                          </span>
                          <span className={`text-[10px] font-semibold mt-0.5 transition-colors ${
                            isSelected ? "text-blue-600/85 dark:text-blue-400/85" : "text-slate-400 dark:text-slate-500"
                          }`}>
                            {isDinner ? "Kechki" : "Tushlik"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Modern Form Fields */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {dict.fullName}
                  </span>
                  <div className="relative flex items-center">
                    <div className="absolute left-3.5 pointer-events-none text-slate-400 dark:text-slate-500">
                      <User className="h-4 w-4" />
                    </div>
                    <Input
                      type="text"
                      required
                      placeholder="Masalan: Jasur Rahimov"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="pl-10 h-11 w-full bg-slate-50/50 border-slate-200 focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500/20 placeholder:text-slate-400 dark:bg-slate-800/40 dark:border-slate-800 dark:text-white transition-all rounded-xl font-semibold"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {dict.phone}
                  </span>
                  <div className="relative flex items-center">
                    <div className="absolute left-3.5 pointer-events-none text-slate-400 dark:text-slate-500">
                      <Phone className="h-4 w-4" />
                    </div>
                    <Input
                      type="tel"
                      required
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                      className="pl-10 h-11 w-full bg-slate-50/50 border-slate-200 focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500/20 dark:bg-slate-800/40 dark:border-slate-800 dark:text-white transition-all rounded-xl font-semibold"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="mt-2 w-full min-h-[44px] rounded-2xl bg-blue-600 font-bold text-white shadow-md hover:bg-blue-700 active:scale-[0.98] transition-transform"
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
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 animate-check shadow-xs">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                
                <h3 className="mt-4 text-xl font-extrabold text-slate-900 dark:text-white">
                  {dict.successTitle}
                </h3>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {dict.successDesc}
                </p>

                {/* Booking Receipt Ticket */}
                <div className="mt-6 w-full rounded-2xl border border-slate-200 bg-slate-50/50 p-5 dark:border-slate-800 dark:bg-slate-900/40 relative overflow-hidden">
                  {/* Decorative side ticket notches */}
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800" />
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-4 h-4 rounded-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800" />

                  {/* Top part: Booking Reference & Restaurant */}
                  <div className="flex justify-between items-center text-xs text-slate-400 dark:text-slate-500 mb-3">
                    <span className="font-medium">Buyurtma ID</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white bg-slate-200/50 dark:bg-slate-800 px-2 py-0.5 rounded text-[11px]">
                      {bookingRef}
                    </span>
                  </div>
                  
                  <div className="text-left border-b border-dashed border-slate-200 dark:border-slate-800 pb-3 mb-3">
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">{selectedRestaurant.name}</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{selectedRestaurant.cityName} · {selectedRestaurant.cuisine}</p>
                  </div>

                  {/* Structured details grid */}
                  <div className="grid grid-cols-2 gap-y-3.5 gap-x-4 text-left text-xs">
                    <div>
                      <span className="block text-slate-400 dark:text-slate-500 font-medium">Mijoz</span>
                      <span className="block font-semibold text-slate-800 dark:text-slate-200 mt-0.5 truncate">{fullName}</span>
                    </div>
                    <div>
                      <span className="block text-slate-400 dark:text-slate-500 font-medium">Telefon</span>
                      <span className="block font-semibold text-slate-800 dark:text-slate-200 mt-0.5 truncate">{phoneInput}</span>
                    </div>
                    
                    {/* Dotted border separation divider */}
                    <div className="col-span-2 border-t border-dashed border-slate-200 dark:border-slate-800 my-1" />

                    <div>
                      <span className="block text-slate-400 dark:text-slate-500 font-medium">Mehmonlar</span>
                      <span className="block font-semibold text-slate-800 dark:text-slate-200 mt-0.5 flex items-center gap-1">
                        <Users className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                        {guestCount} kishi
                      </span>
                    </div>
                    <div>
                      <span className="block text-slate-400 dark:text-slate-500 font-medium">Sana & Vaqt</span>
                      <span className="block font-semibold text-slate-800 dark:text-slate-200 mt-0.5 flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                        {date} ({time})
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-6 flex w-full flex-col gap-3">
                  <a
                    href={`tel:${selectedRestaurant.phone.replace(/\s+/g, "")}`}
                    className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-md hover:bg-emerald-700 active:scale-[0.98] transition-transform"
                  >
                    <PhoneCall className="h-4 w-4" />
                    <span>{dict.callNow}: {selectedRestaurant.phone}</span>
                  </a>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleCloseModal}
                    className="w-full min-h-[44px] rounded-2xl font-bold border border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 active:scale-[0.98] transition-transform"
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
