"use client";

import { useMemo, useState } from "react";
import { Car, PhoneCall, ShieldCheck, Users } from "lucide-react";
import { formatSum } from "@/lib/money";
import type { CatalogDict } from "@/i18n/dictionaries";
import { CatalogHeader } from "@/components/catalog/CatalogHeader";
import type { TransportItem } from "@/components/catalog/types";
import { BaseCard } from "@/components/ui/BaseCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Select } from "@/components/ui/Select";

export type { TransportItem };

function TransportCard({
  item,
  dict,
}: {
  item: TransportItem;
  dict: CatalogDict["transport"];
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
}: {
  dict: CatalogDict["transport"];
  items: TransportItem[];
}) {
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedCity, setSelectedCity] = useState<string>("all");
  const [hasDriverFilter, setHasDriverFilter] = useState<string>("all");

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
          <div className="flex flex-wrap gap-2">
            <Select
              value={selectedCategory}
              onChange={setSelectedCategory}
              options={categories.map((category) => ({ value: category.id, label: category.label }))}
              className="w-44"
            />
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
          </div>
        }
      />

      {filtered.length === 0 ? (
        <EmptyState
          icon={<ShieldCheck className="h-6 w-6" />}
          title="Ma'lumot topilmadi"
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
