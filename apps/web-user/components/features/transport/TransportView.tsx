"use client";

import { useMemo, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Car, PhoneCall, ShieldCheck, Users, Search, RotateCcw, MapPin, UserCheck, Calendar } from "lucide-react";
import { formatSum } from "@/lib/money";
import type { TransportDict } from "@/i18n/dictionaries";
import { CatalogHeader } from "@/components/catalog/CatalogHeader";
import type { TransportItem } from "@/components/catalog/types";
import { BaseCard } from "@/components/ui/BaseCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Select } from "@/components/ui/Select";
import { CategoryTabs, type CategoryTab } from "@/components/ui/CategoryTabs";
import { Input } from "@/components/ui/Input";
import { DatePicker } from "@/components/ui/DatePicker";
import { Button } from "@/components/ui/Button";
import type { Locale } from "@/i18n/config";

export type { TransportItem };

function TransportCard({
  item,
  dict,
}: {
  item: TransportItem;
  dict: TransportDict;
}) {
  const categoryLabel = dict.categories?.[item.categoryKey] ?? item.categoryDefault;

  const badge = (
    <span className="rounded-full bg-slate-900/70 backdrop-blur-xs px-2.5 py-0.5 text-[10px] sm:text-xs font-bold text-white shadow-xs">
      {categoryLabel}
    </span>
  );

  const subInfo = (
    <div className="flex items-center gap-1 text-[11px] sm:text-sm font-medium text-slate-500 dark:text-slate-400 overflow-hidden line-clamp-1 truncate select-none">
      <Users className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0 text-slate-400" />
      <span>{item.seats} {dict.seats}</span>
      <span className="text-slate-300 dark:text-slate-700">·</span>
      <span className="truncate">{item.hasDriver ? dict.driverIncluded : dict.withoutDriver}</span>
    </div>
  );

  const ratingElement = (
    <span className="line-clamp-1 truncate text-[11px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 select-none">
      {[item.transmission, item.fuelType, item.cityName].filter(Boolean).join(" · ")}
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
      footerLeft={
        item.pricePerDaySum > 0 ? (
          <div className="flex flex-col leading-tight">
            <span className="text-xs sm:text-base md:text-lg font-black tracking-tight text-slate-900 dark:text-white">
              {formatSum(item.pricePerDaySum)}
            </span>
            <span className="text-[9px] sm:text-[11px] font-medium text-slate-400">/ {dict.perDay}</span>
          </div>
        ) : undefined
      }
      footerRight={
        item.phone ? (
          <a
            href={`tel:${item.phone.replace(/\s+/g, "")}`}
            aria-label={dict.call ?? "Qo'ng'iroq qilish"}
            title={dict.call ?? "Qo'ng'iroq qilish"}
            className="inline-flex h-7 w-7 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 transition-all duration-200 hover:bg-emerald-600 hover:text-white hover:scale-105 active:scale-95 dark:bg-emerald-950/50 dark:text-emerald-400"
          >
            <PhoneCall className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </a>
        ) : undefined
      }
    />
  );
}

export function TransportView({
  dict,
  items,
  locale,
  initialCheckIn = "",
  initialCheckOut = "",
}: {
  dict: TransportDict;
  items: TransportItem[];
  locale: Locale;
  initialCheckIn?: string;
  initialCheckOut?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedCity, setSelectedCity] = useState<string>("all");
  const [hasDriverFilter, setHasDriverFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("default");
  const [checkIn, setCheckIn] = useState(initialCheckIn);
  const [checkOut, setCheckOut] = useState(initialCheckOut);

  const handleSearchAvailability = () => {
    const params = new URLSearchParams();
    if (checkIn) params.set("checkIn", checkIn);
    if (checkOut) params.set("checkOut", checkOut);
    const queryStr = params.toString();
    router.push(queryStr ? `${pathname}?${queryStr}` : pathname);
  };

  const handleResetFilters = () => {
    setQuery("");
    setSelectedCategory("all");
    setSelectedCity("all");
    setHasDriverFilter("all");
    setSortBy("default");
    setCheckIn("");
    setCheckOut("");
    router.push(pathname);
  };

  const isFiltered = Boolean(
    query ||
    selectedCategory !== "all" ||
    selectedCity !== "all" ||
    hasDriverFilter !== "all" ||
    checkIn ||
    checkOut
  );

  const categories = useMemo(
    () => [
      { id: "all", label: dict.categories?.all ?? dict.allTypes },
      { id: "rent", label: dict.categories?.rent ?? "Avto Ijarasi" },
      { id: "transfer", label: dict.categories?.transfer ?? "Aeroport Transfer" },
      { id: "vip", label: dict.categories?.vip ?? "VIP Taksi" },
    ],
    [dict],
  );

  const cities = useMemo(
    () => Array.from(new Set(items.map((item) => item.cityName).filter(Boolean))),
    [items],
  );

  const filteredAndSorted = useMemo(() => {
    const normalizedQuery = query.toLowerCase();
    const result = items.filter((item) => {
      const matchesQuery =
        item.name.toLowerCase().includes(normalizedQuery) ||
        item.cityName.toLowerCase().includes(normalizedQuery);
      const matchesCategory =
        selectedCategory === "all" || item.categoryKey === selectedCategory;
      const matchesCity = selectedCity === "all" || item.cityName === selectedCity;
      const matchesDriver =
        hasDriverFilter === "all" ||
        (hasDriverFilter === "yes" && item.hasDriver) ||
        (hasDriverFilter === "no" && !item.hasDriver);
      return matchesQuery && matchesCategory && matchesCity && matchesDriver;
    });

    if (sortBy === "price_asc") {
      result.sort((a, b) => a.pricePerDaySum - b.pricePerDaySum);
    } else if (sortBy === "price_desc") {
      result.sort((a, b) => b.pricePerDaySum - a.pricePerDaySum);
    } else if (sortBy === "seats_desc") {
      result.sort((a, b) => b.seats - a.seats);
    }

    return result;
  }, [items, query, selectedCategory, selectedCity, hasDriverFilter, sortBy]);

  const transportTabs: CategoryTab[] = useMemo(() => {
    return categories.map((cat) => ({
      key: cat.id,
      label: cat.label,
      isActive: selectedCategory === cat.id,
      onClick: () => setSelectedCategory(cat.id),
    }));
  }, [categories, selectedCategory]);

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:py-8 sm:px-6">
      {/* Header Banner */}
      <CatalogHeader
        icon={<Car className="h-3.5 w-3.5 text-primary-600 dark:text-primary-400" />}
        badge={dict.badge}
        title={dict.title}
        subtitle={dict.subtitle}
      />

      {/* ═══ 3D Transport Search & Filter Panel ═══ */}
      <div className="mb-6 rounded-3xl border border-slate-200/80 bg-white p-3.5 sm:p-5 shadow-[inset_0_1.5px_0_0_rgba(255,255,255,1),0_4px_0_0_#cbd5e1,0_12px_28px_-4px_rgba(0,0,0,0.08)] dark:border-slate-800 dark:bg-slate-900 dark:shadow-[inset_0_1.5px_0_0_rgba(255,255,255,0.1),0_4px_0_0_#1e293b,0_12px_28px_-4px_rgba(0,0,0,0.5)]">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3 lg:grid-cols-12">
          {/* 1. Qidiruv inputi */}
          <div className="relative md:col-span-3 lg:col-span-4">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={dict.searchPlaceholder}
              className="pl-10 !h-11 min-h-[44px] rounded-full border-slate-200 bg-slate-50/70 dark:bg-slate-800/50"
            />
          </div>

          {/* 2. Shahar tanlash */}
          <div className="md:col-span-1 lg:col-span-3">
            <Select
              value={selectedCity}
              onChange={setSelectedCity}
              options={[
                { value: "all", label: dict.allCities ?? "Barcha shaharlar" },
                ...cities.map((city) => ({ value: city, label: city }))
              ]}
              className="w-full"
            />
          </div>

          {/* 3. Haydovchi holati */}
          <div className="md:col-span-1 lg:col-span-3">
            <Select
              value={hasDriverFilter}
              onChange={setHasDriverFilter}
              options={[
                { value: "all", label: dict.allDrivers ?? "Barcha haydovchilar" },
                { value: "yes", label: dict.driverIncluded },
                { value: "no", label: dict.withoutDriver }
              ]}
              className="w-full"
            />
          </div>

          {/* 4. Sanalar va Tekshirish (Mobilda 2 ustun, desktopda flex) */}
          <div className="grid grid-cols-2 gap-2 md:col-span-3 lg:col-span-12 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-4">
              <DatePicker
                locale={locale}
                label={dict.checkIn}
                value={checkIn}
                onChange={setCheckIn}
                min={new Date().toISOString().split("T")[0]}
                className="w-full"
              />
            </div>
            <div className="lg:col-span-4">
              <DatePicker
                locale={locale}
                label={dict.checkOut}
                value={checkOut}
                onChange={setCheckOut}
                min={checkIn || new Date().toISOString().split("T")[0]}
                className="w-full"
              />
            </div>
            <div className="col-span-2 flex gap-2 lg:col-span-4">
              <Button
                variant="primary"
                onClick={handleSearchAvailability}
                className="flex-1 !h-11 min-h-[44px] uppercase tracking-wide font-bold"
              >
                {dict.checkAvailability}
              </Button>
              {isFiltered && (
                <Button
                  variant="secondary"
                  onClick={handleResetFilters}
                  aria-label={dict.clearFilters ?? "Filtrlarni tozalash"}
                  title={dict.clearFilters ?? "Filtrlarni tozalash"}
                  className="!h-11 min-h-[44px] px-3 shrink-0"
                >
                  <RotateCcw className="h-4 w-4 text-slate-500" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Category Tabs Switcher */}
      <div className="mb-6">
        <CategoryTabs tabs={transportTabs} />
      </div>

      {/* ═══ Results Toolbar & Sorting ═══ */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
            {dict.resultsCount
              ? dict.resultsCount.replace("{count}", String(filteredAndSorted.length))
              : `${filteredAndSorted.length} ta transport topildi`}
          </p>
        </div>

        {/* Sort select */}
        {filteredAndSorted.length > 0 && (
          <div className="w-full sm:w-auto flex items-center gap-2">
            <span className="hidden sm:inline text-xs font-extrabold uppercase tracking-wider text-slate-500">
              {dict.sortBy ?? "Saralash"}:
            </span>
            <div className="w-full sm:w-56">
              <Select
                value={sortBy}
                onChange={setSortBy}
                options={[
                  { value: "default", label: dict.sortDefault ?? "Tavsiya etilgan" },
                  { value: "price_asc", label: dict.sortPriceAsc ?? "Narx: Arzondan qimmatga" },
                  { value: "price_desc", label: dict.sortPriceDesc ?? "Narx: Qimmatdan arzonga" },
                  { value: "seats_desc", label: dict.sortSeats ?? "O'rindiqlar soni" },
                ]}
              />
            </div>
          </div>
        )}
      </div>

      {/* Results Grid / Empty State */}
      {filteredAndSorted.length === 0 ? (
        <EmptyState
          icon={<ShieldCheck className="h-6 w-6" />}
          title={
            initialCheckIn && initialCheckOut
              ? (dict.noVehiclesAvailable ?? "Tanlangan sanalarda bo'sh mashina yo'q")
              : (dict.noData ?? "Ma'lumot topilmadi")
          }
          description={
            initialCheckIn && initialCheckOut
              ? (dict.noVehiclesAvailableDesc ?? "Boshqa sanalarni tanlab ko'ring yoki filtrlarni tozalang.")
              : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
          {filteredAndSorted.map((item) => (
            <TransportCard key={item.id} item={item} dict={dict} />
          ))}
        </div>
      )}
    </main>
  );
}
