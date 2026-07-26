"use client";

import { useState, useMemo, useCallback } from "react";
import Image from "next/image";
import { Car, Users, ArrowRight, PhoneCall, CheckCircle2, X, Filter, ChevronDown } from "lucide-react";
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
    <span className="rounded-full bg-slate-900/55 px-2.5 py-1 text-xs font-medium text-white">
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
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onBook();
          }}
          aria-label={`${item.name} ijaraga olish`}
          className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          {dict.reserve}
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
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
  const [isSuccess, setIsSuccess] = useState(false);

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
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setSelectedItem(null)}
          />
          <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <button
              type="button"
              onClick={() => setSelectedItem(null)}
              className="absolute right-4 top-4 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
            >
              <X className="h-5 w-5" />
            </button>

            {!isSuccess ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setIsSuccess(true);
                }}
                className="flex flex-col gap-5"
              >
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
                  <div className="relative h-14 w-14 overflow-hidden rounded-2xl bg-slate-100">
                    <Image
                      src={selectedItem.imageUrl}
                      alt={selectedItem.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                      {selectedItem.name}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {selectedItem.cityName} · {formatSum(selectedItem.pricePerDaySum)} / {dict.perDay}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{dict.pickupDate}</span>
                    <DatePicker
                      value={pickupDate}
                      onChange={setPickupDate}
                      min={new Date().toISOString().split("T")[0]}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{dict.returnDate}</span>
                    <DatePicker
                      value={returnDate}
                      onChange={setReturnDate}
                      min={pickupDate || new Date().toISOString().split("T")[0]}
                    />
                  </div>
                </div>

                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{dict.fullName}</span>
                  <Input type="text" required placeholder="Masalan: Sardor Alimov" />
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{dict.phone}</span>
                  <Input type="tel" required defaultValue="+998" />
                </label>

                <Button type="submit" size="lg" className="mt-2 w-full rounded-2xl bg-blue-600 font-bold text-white shadow-md hover:bg-blue-700">
                  {dict.confirmOrder}
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
                    href={`tel:${selectedItem.phone.replace(/\s+/g, "")}`}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3 text-sm font-bold text-white shadow-md hover:bg-emerald-700"
                  >
                    <PhoneCall className="h-4 w-4" />
                    <span>{dict.callNow}: {selectedItem.phone}</span>
                  </a>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setSelectedItem(null)}
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
