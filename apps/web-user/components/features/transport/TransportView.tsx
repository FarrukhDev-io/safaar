"use client";

import { useState, useMemo, useCallback } from "react";
import Image from "next/image";
import { Car, Users, ArrowRight, PhoneCall, CheckCircle2, X, Filter, ChevronDown, MapPin, User, Phone, Calendar, Star } from "lucide-react";
import { formatSum } from "@/lib/money";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { DatePicker } from "@/components/ui/DatePicker";
import type { CatalogDict } from "@/i18n/dictionaries";
import { CatalogHeader } from "@/components/catalog/CatalogHeader";
import { MOCK_TRANSPORTS } from "@/components/catalog/data";
import type { TransportItem } from "@/components/catalog/types";
import { FilterSidebar } from "@/components/ui/FilterSidebar";
import { FilterGroup } from "@/components/ui/FilterGroup";
import { ActiveFilters, type ActiveFilterChip } from "@/components/ui/ActiveFilters";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn } from "@/lib/cn";
import { Modal } from "@/components/ui/Modal";
import { Select, type SelectOption } from "@/components/ui/Select";

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
        
        {/* Category Badge - Glassmorphism */}
        <div className="absolute left-3.5 top-3.5 z-10">
          <span className="inline-flex items-center rounded-xl bg-slate-900/65 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-md border border-white/10 shadow-xs">
            {catLabel}
          </span>
        </div>

        {/* Rating Badge */}
        {item.rating && (
          <div className="absolute right-3.5 top-3.5 z-10">
            <span className="inline-flex items-center gap-1 rounded-xl bg-amber-500/95 px-2.5 py-1 text-[11px] font-extrabold text-white backdrop-blur-xs shadow-xs">
              <Star className="h-3 w-3 fill-white text-white" />
              {item.rating.toFixed(1)}
            </span>
          </div>
        )}
      </div>

      {/* Details Section */}
      <div className="flex flex-col flex-1 p-5">
        {/* Title */}
        <h3 className="line-clamp-1 text-lg font-extrabold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {item.name}
        </h3>

        {/* City & Route info */}
        <p className="mt-1.5 flex items-center gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
          <MapPin className="h-3.5 w-3.5 text-blue-500 shrink-0" />
          <span>{item.cityName}</span>
        </p>

        {/* Specs Grid */}
        <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-2 rounded-xl bg-slate-50 p-2.5 font-semibold text-slate-700 dark:bg-slate-800/40 dark:text-slate-350">
            <Users className="h-4 w-4 text-blue-500 shrink-0" />
            <span>{item.seats} {dict.seats}</span>
          </div>
          
          <div className="flex items-center gap-2 rounded-xl bg-slate-50 p-2.5 font-semibold text-slate-700 dark:bg-slate-800/40 dark:text-slate-350">
            <Car className="h-4 w-4 text-blue-500 shrink-0" />
            <span className="truncate">{item.transmission === "manual" ? (dict.manual || "Mexanika") : (dict.automatic || "Avtomat")}</span>
          </div>

          <div className="flex items-center gap-2 rounded-xl bg-slate-50 p-2.5 font-semibold text-slate-700 dark:bg-slate-800/40 dark:text-slate-350">
            <svg className="h-4 w-4 text-blue-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <span className="truncate">{item.fuelType ?? "Benzin"}</span>
          </div>

          <div className={`flex items-center gap-2 rounded-xl p-2.5 font-semibold text-xs truncate ${
            item.hasDriver 
              ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-300"
              : "bg-amber-50 text-amber-800 dark:bg-amber-950/20 dark:text-amber-300"
          }`}>
            <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${item.hasDriver ? "bg-emerald-500" : "bg-amber-500"}`} />
            <span className="truncate">{item.hasDriver ? dict.driverIncluded : dict.withoutDriver}</span>
          </div>
        </div>

        {/* Divider */}
        <div className="mt-5 border-t border-slate-100 dark:border-slate-800/80" />
        {/* Pricing & CTA */}
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">kunlik ijara</span>
            <div className="mt-0.5 flex items-baseline gap-1">
              <span className="text-base font-extrabold text-slate-900 dark:text-white">
                {formatSum(item.pricePerDaySum)}
              </span>
              <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">/ {dict.perDay}</span>
            </div>
          </div>

          <div className="inline-flex w-full sm:w-auto min-h-[40px] items-center justify-center gap-1 rounded-xl bg-blue-50 px-3.5 py-2 text-xs font-bold text-blue-600 transition-all duration-300 group-hover:bg-blue-600 group-hover:text-white group-hover:shadow-md group-hover:shadow-blue-500/20 dark:bg-slate-800 dark:text-blue-400 dark:group-hover:bg-blue-600 dark:group-hover:text-white">
            <span>{dict.reserve}</span>
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </div>
        </div>
      </div>
    </div>
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
            <Select
              value={tempCategory}
              onChange={setTempCategory}
              options={categories.map((c): SelectOption => ({ value: c.id, label: c.label }))}
              ariaLabel="Xizmat turi filtri"
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

          {/* Driver */}
          <FilterGroup title="Haydovchi Xizmati">
            <Select
              value={tempDriver}
              onChange={setTempDriver}
              options={[
                { value: "all", label: "Hammasi" },
                { value: "yes", label: dict.driverIncluded },
                { value: "no", label: dict.withoutDriver },
              ]}
              ariaLabel="Haydovchi xizmati filtri"
            />
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
            <Button
              type="button"
              variant="ghost"
              rounded="full"
              size="sm"
              onClick={() => setSelectedItem(null)}
              className={cn(
                "absolute right-4 top-4 z-20 min-h-0 h-9 w-9 p-0 flex items-center justify-center border-none",
                !isSuccess
                  ? "bg-slate-950/40 text-white/90 backdrop-blur-xs hover:bg-slate-950/60 hover:text-white"
                  : "text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              )}
            >
              <X className="h-5 w-5" />
            </Button>

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
                      <span>{selectedItem.cityName} · {selectedItem.transmission === "manual" ? (dict.manual || "Mexanika") : (dict.automatic || "Avtomat")}</span>
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
                    <span className="font-medium">{dict.bookingId || "Buyurtma ID"}</span>
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
                      <span className="block text-slate-400 dark:text-slate-500 font-medium">{dict.customer || "Mijoz"}</span>
                      <span className="block font-semibold text-slate-800 dark:text-slate-200 mt-0.5 truncate">{fullName}</span>
                    </div>
                    <div>
                      <span className="block text-slate-400 dark:text-slate-500 font-medium">{dict.phone || "Telefon"}</span>
                      <span className="block font-semibold text-slate-800 dark:text-slate-200 mt-0.5 truncate">{phoneInput}</span>
                    </div>
                    
                    {/* Dotted border separation divider */}
                    <div className="col-span-2 border-t border-dashed border-slate-200 dark:border-slate-800 my-1" />

                    <div>
                      <span className="block text-slate-400 dark:text-slate-500 font-medium">{dict.duration || "Muddat"}</span>
                      <span className="block font-semibold text-slate-800 dark:text-slate-200 mt-0.5 flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                        {totalDays} {dict.days || "kun"}
                      </span>
                    </div>
                    <div>
                      <span className="block text-slate-400 dark:text-slate-500 font-medium">{dict.totalSum || "Jami Summa"}</span>
                      <span className="block font-bold text-blue-600 dark:text-blue-400 mt-0.5">
                        {formatSum(selectedItem.pricePerDaySum * totalDays)}
                      </span>
                    </div>

                    <div className="col-span-2 text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                      <span>{dict.dateLabel || "Sana:"} {pickupDate} {dict.from || "dan"} {returnDate} {dict.to || "gacha"}</span>
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
