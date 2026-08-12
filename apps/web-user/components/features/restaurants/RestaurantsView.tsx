"use client";

import { useMemo, useState } from "react";
import { Clock, MapPin, PhoneCall, Star, Utensils, Search } from "lucide-react";
import { formatSum } from "@/lib/money";
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
}: {
  item: RestaurantItem;
  dict: CatalogDict["restaurants"];
}) {
  const badge = item.cuisine ? (
    <span className="rounded-full bg-slate-900/55 px-2.5 py-1 text-xs font-medium text-white">
      {item.cuisine}
    </span>
  ) : undefined;

  const subInfo = (
    <>
      <MapPin className="h-3.5 w-3.5 shrink-0" />
      {[item.cityName, item.address].filter(Boolean).join(" · ")}
    </>
  );

  const ratingElement =
    item.rating > 0 ? (
      <>
        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
        <span className="font-semibold text-slate-700 dark:text-slate-300">
          {item.rating.toFixed(1)}
        </span>
        {item.reviewsCount > 0 && <span>· {item.reviewsCount} ta sharh</span>}
      </>
    ) : undefined;

  return (
    <BaseCard
      href={`/restaurants/${item.id}`}
      imageSrc={item.imageUrl}
      imageAlt={item.name}
      badge={badge}
      title={item.name}
      subInfo={subInfo}
      rating={ratingElement}
      footerLeft={
        <>
          {item.workingHours && (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-400">
              <Clock className="h-3.5 w-3.5 shrink-0" />
              {item.workingHours}
            </span>
          )}
          {item.averageCheckSum > 0 && (
            <span className="text-sm font-bold text-slate-900 dark:text-white">
              {dict.avgCheck}: {formatSum(item.averageCheckSum)}
            </span>
          )}
        </>
      }
      footerRight={
        item.phone ? (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              window.location.href = `tel:${item.phone.replace(/\s+/g, "")}`;
            }}
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <PhoneCall className="h-3.5 w-3.5" />
          </button>
        ) : undefined
      }
    />
  );
}

export function RestaurantsView({
  dict,
  items,
}: {
  dict: CatalogDict["restaurants"];
  items: RestaurantItem[];
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
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
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
            <RestaurantCard key={item.id} item={item} dict={dict} />
          ))}
        </div>
      )}
    </main>
  );
}
