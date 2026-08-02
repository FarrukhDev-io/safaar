"use client";

import { useMemo, useState } from "react";
import { Clock, Compass, MapPin, Star } from "lucide-react";
import type { CatalogDict } from "@/i18n/dictionaries";
import { CatalogHeader } from "@/components/catalog/CatalogHeader";
import type { AttractionItem } from "@/components/catalog/types";
import { BaseCard } from "@/components/ui/BaseCard";
import { EmptyState } from "@/components/ui/EmptyState";

export type { AttractionItem };

function AttractionCard({
  item,
  categoryLabel,
  dict,
}: {
  item: AttractionItem;
  categoryLabel: string;
  dict: CatalogDict["attractions"];
}) {
  const badge = (
    <span className="rounded-full bg-slate-900/55 px-2.5 py-1 text-xs font-medium text-white">
      {categoryLabel}
    </span>
  );

  const subInfo = (
    <>
      <MapPin className="h-3.5 w-3.5 shrink-0" />
      {item.cityName}
    </>
  );

  const ratingElement =
    item.rating > 0 ? (
      <>
        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
        <span className="font-semibold text-slate-700 dark:text-slate-300">
          {item.rating.toFixed(1)}
        </span>
      </>
    ) : undefined;

  return (
    <BaseCard
      imageSrc={item.imageUrl}
      imageAlt={item.name}
      badge={badge}
      title={item.name}
      subInfo={subInfo}
      rating={ratingElement}
      footerLeft={
        item.bestTimeToVisit ? (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400">
            <Clock className="h-3.5 w-3.5 shrink-0" />
            {dict.bestTime} {item.bestTimeToVisit}
          </span>
        ) : undefined
      }
    />
  );
}

export function AttractionsView({
  dict,
  items,
}: {
  dict: CatalogDict["attractions"];
  items: AttractionItem[];
}) {
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const categories = useMemo(
    () => [
      { id: "all", label: dict.categories?.all ?? dict.allPlaces },
      { id: "historical", label: dict.categories?.historical ?? "Tarixiy Obida" },
      { id: "unesco", label: dict.categories?.unesco ?? "UNESCO Merosi" },
      { id: "nature", label: dict.categories?.nature ?? "Tabiat & Hordiq" },
    ],
    [dict],
  );

  const filtered = useMemo(() => {
    const normalizedQuery = query.toLowerCase();
    return items.filter((item) => {
      const matchesQuery =
        item.name.toLowerCase().includes(normalizedQuery) ||
        item.cityName.toLowerCase().includes(normalizedQuery) ||
        item.description.toLowerCase().includes(normalizedQuery);
      const matchesCategory =
        selectedCategory === "all" || item.categoryKey === selectedCategory;
      return matchesQuery && matchesCategory;
    });
  }, [items, query, selectedCategory]);

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
      <CatalogHeader
        icon={<Compass className="h-3.5 w-3.5 text-primary-600 dark:text-primary-400" />}
        badge={dict.badge}
        title={dict.title}
        subtitle={dict.subtitle}
        searchValue={query}
        onSearchChange={setQuery}
        searchPlaceholder={dict.searchPlaceholder}
        filterControls={
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => setSelectedCategory(category.id)}
                className={`min-h-[40px] rounded-xl px-3 py-2 text-xs font-bold transition-all ${
                  selectedCategory === category.id
                    ? "bg-blue-600 text-white shadow-xs"
                    : "border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>
        }
      />

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Compass className="h-6 w-6" />}
          title="Ma'lumot topilmadi"
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
          {filtered.map((item) => (
            <AttractionCard
              key={item.id}
              item={item}
              categoryLabel={
                dict.categories?.[item.categoryKey] ?? item.categoryDefault
              }
              dict={dict}
            />
          ))}
        </div>
      )}
    </main>
  );
}
