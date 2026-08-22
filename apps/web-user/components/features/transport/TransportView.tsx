"use client";

import { useMemo, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Car, PhoneCall, ShieldCheck, Users, Search } from "lucide-react";
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
    <span className="rounded-full bg-slate-900/60 backdrop-blur-xs px-2 py-0.5 text-[10px] sm:text-xs font-semibold text-white">
      {categoryLabel}
    </span>
  );

  const subInfo = (
    <div className="flex items-center gap-1 text-[11px] sm:text-sm font-medium text-slate-500 dark:text-slate-400 overflow-hidden line-clamp-1 truncate select-none">
      <Users className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
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
            aria-label="Qo'ng'iroq qilish"
            className="inline-flex h-6 w-6 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 transition-all duration-200 hover:bg-emerald-600 hover:text-white hover:scale-105 active:scale-95 dark:bg-emerald-950/40 dark:text-emerald-400"
          >
            <PhoneCall className="h-3 w-3 sm:h-4 sm:w-4" />
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
  const [checkIn, setCheckIn] = useState(initialCheckIn);
  const [checkOut, setCheckOut] = useState(initialCheckOut);

  const handleSearchAvailability = () => {
    const params = new URLSearchParams();
    if (checkIn) params.set("checkIn", checkIn);
    if (checkOut) params.set("checkOut", checkOut);
    const queryStr = params.toString();
    router.push(queryStr ? `${pathname}?${queryStr}` : pathname);
  };

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

  const filtered = useMemo(() => {
    const normalizedQuery = query.toLowerCase();
    return items.filter((item) => {
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
  }, [items, query, selectedCategory, selectedCity, hasDriverFilter]);

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
      <CatalogHeader
        icon={<Car className="h-3.5 w-3.5 text-primary-600 dark:text-primary-400" />}
        badge={dict.badge}
        title={dict.title}
        subtitle={dict.subtitle}
        searchControls={
          <>
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={dict.searchPlaceholder}
              className="pl-10 w-full"
            />
          </>
        }
        filterControls={
          <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-end w-full lg:w-auto">
            <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:gap-2">
              <Select
                value={selectedCity}
                onChange={setSelectedCity}
                options={[
                  { value: "all", label: "Barcha shaharlar" },
                  ...cities.map((city) => ({ value: city, label: city }))
                ]}
                className="w-full sm:w-40 md:w-44"
              />
              <Select
                value={hasDriverFilter}
                onChange={setHasDriverFilter}
                options={[
                  { value: "all", label: "Hammasi" },
                  { value: "yes", label: dict.driverIncluded },
                  { value: "no", label: dict.withoutDriver }
                ]}
                className="w-full sm:w-40 md:w-44"
              />
            </div>
            <div className="grid grid-cols-2 gap-2 w-full sm:w-auto sm:flex sm:items-end">
              <DatePicker
                locale={locale}
                label={dict.checkIn}
                value={checkIn}
                onChange={setCheckIn}
                min={new Date().toISOString().split("T")[0]}
                className="w-full sm:w-36"
              />
              <DatePicker
                locale={locale}
                label={dict.checkOut}
                value={checkOut}
                onChange={setCheckOut}
                min={checkIn || new Date().toISOString().split("T")[0]}
                className="w-full sm:w-36"
              />
            </div>
            <Button
              variant="primary"
              onClick={handleSearchAvailability}
              className="w-full sm:w-auto font-bold shrink-0 min-h-[44px]"
            >
              {dict.checkAvailability}
            </Button>
          </div>
        }
      />

      <div className="mt-2 mb-6">
        <CategoryTabs tabs={transportTabs} />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<ShieldCheck className="h-6 w-6" />}
          title={initialCheckIn && initialCheckOut ? (dict.noVehiclesAvailable ?? "Tanlangan sanalarda bo'sh mashina yo'q") : (dict.noData ?? "Ma'lumot topilmadi")}
          description={initialCheckIn && initialCheckOut ? (dict.noVehiclesAvailableDesc ?? "Boshqa sanalarni tanlab ko'ring.") : undefined}
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
          {filtered.map((item) => (
            <TransportCard key={item.id} item={item} dict={dict} />
          ))}
        </div>
      )}
    </main>
  );
}
