"use client";

import { useMemo, useState } from "react";
import { Clock, MapPin, PhoneCall, Star, Utensils, Search } from "lucide-react";
import { formatSum } from "@/lib/money";
import type { Locale } from "@/i18n/config";
import type { CatalogDict } from "@/i18n/dictionaries";
import { CatalogHeader } from "@/components/catalog/CatalogHeader";
import type { RestaurantItem } from "@/components/catalog/types";
import { BaseCard } from "@/components/ui/BaseCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";

export type { RestaurantItem };

function RestaurantCard({
  item,
  dict,
  locale,
}: {
  item: RestaurantItem;
  dict: CatalogDict["restaurants"];
  locale: Locale;
}) {
  const badge = (
    <span className="inline-flex items-center gap-1 rounded-full border border-slate-100/60 bg-white/95 px-2.5 py-1 text-xs font-extrabold text-slate-900 shadow-md backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95 dark:text-white">
      <Star className="h-3.5 w-3.5 fill-emerald-500 text-emerald-500 shrink-0" />
      <span>{item.rating > 0 ? item.rating.toFixed(1) : "4.7"}</span>
    </span>
  );

  const subInfo = (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
      <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
      <span>{[item.cityName, item.address].filter(Boolean).join(" · ")}</span>
    </span>
  );

  const ratingElement = (
    <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
      {item.cuisine && (
        <span className="rounded-md border border-slate-200/60 bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300">
          {item.cuisine}
        </span>
      )}
      <span className="rounded-md border border-slate-200/60 bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300 flex items-center gap-1">
        <Clock className="h-3 w-3" /> {item.workingHours || "09:00 - 23:00"}
      </span>
    </div>
  );

  const price = item.averageCheckSum > 0 ? item.averageCheckSum : 180000;

  return (
    <BaseCard
      href={`/${locale}/restaurants/${item.id}`}
      imageSrc={item.imageUrl}
      imageAlt={item.name}
      badge={badge}
      title={item.name}
      subInfo={subInfo}
      rating={ratingElement}
      footerLeft={
        <div className="flex flex-col leading-tight">
          <span className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white">
            {formatSum(price)}
          </span>
          <span className="text-[11px] font-semibold text-slate-400">
            / o'rtacha chek
          </span>
        </div>
      }
    />
  );
}

export function RestaurantsView({
  dict,
  items,
  locale,
}: {
  dict: CatalogDict["restaurants"];
  items: RestaurantItem[];
  locale: Locale;
}) {
  const [query, setQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState("all");
  const [selectedCuisine, setSelectedCuisine] = useState("all");
  const allCuisinesLabel =
    (dict as { allCuisines?: string }).allCuisines ?? "Barcha oshxonalar";

  const cities = useMemo(
    () => Array.from(new Set(items.map((item) => item.cityName).filter(Boolean))),
    [items],
  );
  const cuisines = useMemo(
    () => Array.from(new Set(items.map((item) => item.cuisine).filter(Boolean))),
    [items],
  );

  const filtered = useMemo(() => {
    const normalizedQuery = query.toLowerCase();
    return items.filter((item) => {
      const matchesQuery =
        item.name.toLowerCase().includes(normalizedQuery) ||
        item.cuisine.toLowerCase().includes(normalizedQuery) ||
        item.cityName.toLowerCase().includes(normalizedQuery);
      const matchesCity =
        selectedCity === "all" ||
        item.cityName.toLowerCase() === selectedCity.toLowerCase();
      const matchesCuisine =
        selectedCuisine === "all" || item.cuisine === selectedCuisine;
      return matchesQuery && matchesCity && matchesCuisine;
    });
  }, [items, query, selectedCity, selectedCuisine]);

  return (
    <main className="mx-auto w-full md:w-[96%] max-w-[1536px] flex-1 px-4 md:px-8 py-8 sm:px-6">
      <CatalogHeader
        icon={<Utensils className="h-3.5 w-3.5 text-primary-600 dark:text-primary-400" />}
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
          <div className="flex flex-wrap gap-2">
            <Select
              value={selectedCity}
              onChange={setSelectedCity}
              options={[
                { value: "all", label: dict.allCities },
                ...cities.map((city) => ({ value: city, label: city }))
              ]}
              className="w-44"
            />
            <Select
              value={selectedCuisine}
              onChange={setSelectedCuisine}
              options={[
                { value: "all", label: allCuisinesLabel },
                ...cuisines.map((cuisine) => ({ value: cuisine, label: cuisine }))
              ]}
              className="w-44"
            />
          </div>
        }
      />

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Utensils className="h-6 w-6" />}
          title="Ma'lumot topilmadi"
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
          {filtered.map((item) => (
            <RestaurantCard key={item.id} item={item} dict={dict} locale={locale} />
          ))}
        </div>
      )}
    </main>
  );
}
