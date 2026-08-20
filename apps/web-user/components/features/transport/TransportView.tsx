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
    <span className="rounded-full bg-slate-900/55 px-2.5 py-1 text-xs font-medium text-white">
      {categoryLabel}
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
          <>
            <span className="text-sm font-bold text-slate-900 dark:text-white">
              {formatSum(item.pricePerDaySum)}
            </span>
            <span className="text-[10px] text-slate-400">/ {dict.perDay}</span>
          </>
        ) : undefined
      }
      footerRight={
        item.phone ? (
          <a
            href={`tel:${item.phone.replace(/\s+/g, "")}`}
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <PhoneCall className="h-3.5 w-3.5" />
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
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
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
              className="pl-10"
            />
          </>
        }
        filterControls={
          <div className="flex flex-wrap items-end gap-2">
            <Select
              value={selectedCity}
              onChange={setSelectedCity}
              options={[
                { value: "all", label: "Barcha shaharlar" },
                ...cities.map((city) => ({ value: city, label: city }))
              ]}
              className="w-44"
            />
            <Select
              value={hasDriverFilter}
              onChange={setHasDriverFilter}
              options={[
                { value: "all", label: "Hammasi" },
                { value: "yes", label: dict.driverIncluded },
                { value: "no", label: dict.withoutDriver }
              ]}
              className="w-44"
            />
            <div className="flex items-end gap-2">
              <DatePicker
                locale={locale}
                label={dict.checkIn}
                value={checkIn}
                onChange={setCheckIn}
                min={new Date().toISOString().split("T")[0]}
                className="w-36"
              />
              <DatePicker
                locale={locale}
                label={dict.checkOut}
                value={checkOut}
                onChange={setCheckOut}
                min={checkIn || new Date().toISOString().split("T")[0]}
                className="w-36"
              />
              <Button
                variant="primary"
                onClick={handleSearchAvailability}
                className="font-bold shrink-0 min-h-[44px]"
              >
                {dict.checkAvailability}
              </Button>
            </div>
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
