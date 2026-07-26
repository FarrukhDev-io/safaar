"use client";

import { useState, useMemo, useCallback } from "react";
import Image from "next/image";
import { Car, Users, ArrowRight, PhoneCall, CheckCircle2, X, Filter, ChevronDown, MapPin, User, Phone, Calendar } from "lucide-react";
import { formatSum } from "@/lib/money";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { DatePicker } from "@/components/ui/DatePicker";
import type { CatalogDict } from "@/i18n/dictionaries";
import { CatalogHeader } from "@/components/catalog/CatalogHeader";
import { MOCK_TRANSPORTS } from "@/components/catalog/data";
import type { TransportItem } from "@/components/catalog/types";
import { BaseCard } from "@/components/ui/BaseCard";
import { FilterSidebar } from "@/components/ui/FilterSidebar";
import { FilterGroup } from "@/components/ui/FilterGroup";
import { ActiveFilters, type ActiveFilterChip } from "@/components/ui/ActiveFilters";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";

export type { TransportItem };

/* ─── TransportCard ─────────────────────────────────────────────── */
function TransportCard({
  item,
  dict,
  onBook,
}: {
  item: TransportItem;
  dict: CatalogDict["transport"];
  onBook: () => void;
}) {
  const catLabel = dict.categories?.[item.categoryKey] ?? item.categoryDefault;

  const badge = (
    <span className="rounded-full bg-slate-950/40 backdrop-blur-md border border-white/20 px-2.5 py-1 text-xs font-medium text-white">
      {catLabel}
    </span>
  );

  const subInfo = (
    <>
      <Users className="h-3.5 w-3.5 shrink-0" />
      {item.seats} {dict.seats}
      <span className="text-slate-300 dark:text-slate-700">·</span>
      {item.hasDriver ? dict.driverIncluded : dict.withoutDriver}
    </>
  );

  const ratingElement = (
    <span>
      {item.transmission ?? "Mexanika"} · {item.cityName}
    </span>
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
          <span className="text-[10px] font-medium text-slate-400">dan</span>
          <span className="text-sm font-bold text-slate-900 dark:text-white">
            {formatSum(item.pricePerDaySum)}
          </span>
          <span className="text-[10px] text-slate-400">/ {dict.perDay}</span>
        </>
      }
      footerRight={
        <div
          className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 transition-all duration-300 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 dark:border-slate-700 dark:text-slate-300"
        >
          {dict.reserve}
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
        </div>
      }
    />
  );
}

export function TransportView({ dict }: { dict: CatalogDict["transport"] }) {
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedCity, setSelectedCity] = useState<string>("all");
  const [hasDriverFilter, setHasDriverFilter] = useState<string>("all");

  const [tempCategory, setTempCategory] = useState<string>("all");
  const [tempCity, setTempCity] = useState<string>("all");
  const [tempDriver, setTempDriver] = useState<string>("all");

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<TransportItem | null>(null);
  const [pickupDate, setPickupDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [returnDate, setReturnDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  });
  const [fullName, setFullName] = useState("");
  const [phoneInput, setPhoneInput] = useState("+998");
  const [isSuccess, setIsSuccess] = useState(false);
  const [bookingRef, setBookingRef] = useState("");

  const totalDays = useMemo(() => {
    if (!pickupDate || !returnDate) return 1;
    const start = new Date(pickupDate);
    const end = new Date(returnDate);
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 1;
  }, [pickupDate, returnDate]);

  const categories = useMemo(() => [
    { id: "all", label: dict.categories?.all ?? dict.allTypes },
    { id: "rent", label: dict.categories?.rent ?? "Avto Ijarasi" },
    { id: "transfer", label: dict.categories?.transfer ?? "Aeroport Transfer" },
    { id: "vip", label: dict.categories?.vip ?? "VIP Taksi" },
  ], [dict]);

  const cities = useMemo(() => Array.from(new Set(MOCK_TRANSPORTS.map((t) => t.cityName))), []);

  const handleApply = useCallback(() => {
    setSelectedCategory(tempCategory);
    setSelectedCity(tempCity);
    setHasDriverFilter(tempDriver);
  }, [tempCategory, tempCity, tempDriver]);

  const handleReset = useCallback(() => {
    setTempCategory("all");
    setTempCity("all");
    setTempDriver("all");
    setSelectedCategory("all");
    setSelectedCity("all");
    setHasDriverFilter("all");
  }, []);

  const filtered = useMemo(() => {
    return MOCK_TRANSPORTS.filter((t) => {
      const q = query.toLowerCase();
      const matchesQuery =
        t.name.toLowerCase().includes(q) || t.cityName.toLowerCase().includes(q);
      const matchesCategory =
        selectedCategory === "all" || t.categoryKey === selectedCategory;
      const matchesCity =
        selectedCity === "all" || t.cityName === selectedCity;
      const matchesDriver =
        hasDriverFilter === "all" ||
        (hasDriverFilter === "yes" && t.hasDriver) ||
        (hasDriverFilter === "no" && !t.hasDriver);

      return matchesQuery && matchesCategory && matchesCity && matchesDriver;
    });
  }, [query, selectedCategory, selectedCity, hasDriverFilter]);

  const openModal = useCallback((item: TransportItem) => {
    setSelectedItem(item);
    setIsSuccess(false);
    setFullName("");
    setPhoneInput("+998");
    setBookingRef("");
  }, []);

  const handleReserveSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const randomRef = `#TR-${Math.floor(1000 + Math.random() * 9000)}`;
    setBookingRef(randomRef);
    setIsSuccess(true);
  }, []);

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
    if (hasDriverFilter !== "all") {
      chips.push({
        key: "driver",
        label: hasDriverFilter === "yes" ? dict.driverIncluded : dict.withoutDriver,
        onRemove: () => {
          setHasDriverFilter("all");
          setTempDriver("all");
        },
      });
    }
    return chips;
  }, [selectedCategory, selectedCity, hasDriverFilter, categories, dict]);

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
      <CatalogHeader
        icon={<Car className="h-3.5 w-3.5 text-primary-600 dark:text-primary-400" />}
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

            {/* Spacer / Mode indicator */}
            <div className="text-xs font-semibold text-slate-500">
              {filtered.length} ta transport
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
          title="Transport Filtri"
          isOpen={isFilterOpen}
          onClose={() => setIsFilterOpen(false)}
          onApply={handleApply}
          onReset={handleReset}
        >
          {/* Category */}
          <FilterGroup title="Xizmat Turi">
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

          {/* Driver */}
          <FilterGroup title="Haydovchi Xizmati">
            <select
              value={tempDriver}
              onChange={(e) => setTempDriver(e.target.value)}
              className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
            >
              <option value="all">Hammasi</option>
              <option value="yes">{dict.driverIncluded}</option>
              <option value="no">{dict.withoutDriver}</option>
            </select>
          </FilterGroup>
        </FilterSidebar>

        {/* List Content */}
        <div className="flex-1">
          {filtered.length === 0 ? (
            <EmptyState
              title="Transportlar topilmadi"
              description="Kiritilgan filtrlar yoki qidiruv bo'yicha hech qanday transport topilmadi. Filtrlar va qidiruvni tozalab ko'ring."
              actionLabel="Hammasini tozalash"
              onAction={handleReset}
            />
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((item) => (
                <TransportCard
                  key={item.id}
                  item={item}
                  dict={dict}
                  onBook={() => openModal(item)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Booking Modal */}
      <Modal
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        size="lg"
        hideCloseButton={true}
      >
        {selectedItem && (
          <>
            <button
              type="button"
              onClick={() => setSelectedItem(null)}
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
                    src={selectedItem.imageUrl}
                    alt={selectedItem.name}
                    fill
                    className="object-cover"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                  <div className="absolute bottom-4 left-6 right-6 text-white">
                    <h2 className="text-xl font-bold tracking-tight text-white drop-shadow-md">
                      {selectedItem.name}
                    </h2>
                    <p className="mt-1 flex items-center gap-1 text-xs font-medium text-slate-200">
                      <MapPin className="h-3.5 w-3.5 text-slate-350" />
                      <span>{selectedItem.cityName} · {selectedItem.transmission ?? "Mexanika"}</span>
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <span className="flex items-center gap-1 text-xs font-bold text-slate-700 dark:text-slate-300">
                      <Calendar className="h-3.5 w-3.5 text-blue-600" />
                      {dict.pickupDate}
                    </span>
                    <DatePicker
                      value={pickupDate}
                      onChange={setPickupDate}
                      min={new Date().toISOString().split("T")[0]}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <span className="flex items-center gap-1 text-xs font-bold text-slate-700 dark:text-slate-300">
                      <Calendar className="h-3.5 w-3.5 text-blue-600" />
                      {dict.returnDate}
                    </span>
                    <DatePicker
                      value={returnDate}
                      onChange={setReturnDate}
                      min={pickupDate || new Date().toISOString().split("T")[0]}
                    />
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
                      placeholder="Masalan: Sardor Alimov"
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
                  {dict.confirmOrder}
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

                  {/* Top part: Booking Reference & Transport */}
                  <div className="flex justify-between items-center text-xs text-slate-400 dark:text-slate-500 mb-3">
                    <span className="font-medium">Buyurtma ID</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white bg-slate-200/50 dark:bg-slate-800 px-2 py-0.5 rounded text-[11px]">
                      {bookingRef}
                    </span>
                  </div>
                  
                  <div className="text-left border-b border-dashed border-slate-200 dark:border-slate-800 pb-3 mb-3">
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">{selectedItem.name}</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {selectedItem.cityName} · {selectedItem.hasDriver ? dict.driverIncluded : dict.withoutDriver}
                    </p>
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
                      <span className="block text-slate-400 dark:text-slate-500 font-medium">Muddat</span>
                      <span className="block font-semibold text-slate-800 dark:text-slate-200 mt-0.5 flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                        {totalDays} kun
                      </span>
                    </div>
                    <div>
                      <span className="block text-slate-400 dark:text-slate-500 font-medium">Jami Summa</span>
                      <span className="block font-bold text-blue-600 dark:text-blue-450 mt-0.5">
                        {formatSum(selectedItem.pricePerDaySum * totalDays)}
                      </span>
                    </div>

                    <div className="col-span-2 text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                      <span>Sana: {pickupDate} dan {returnDate} gacha</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-6 flex w-full flex-col gap-3">
                  <a
                    href={`tel:${selectedItem.phone.replace(/\s+/g, "")}`}
                    className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-md hover:bg-emerald-700 active:scale-[0.98] transition-transform"
                  >
                    <PhoneCall className="h-4 w-4" />
                    <span>{dict.callNow}: {selectedItem.phone}</span>
                  </a>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setSelectedItem(null)}
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
