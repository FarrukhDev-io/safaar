"use client";

import { useMemo, useState } from "react";
import { Clock, Compass, MapPin, Star, Search } from "lucide-react";
import type { CatalogDict } from "@/i18n/dictionaries";
import { CatalogHeader } from "@/components/catalog/CatalogHeader";
import type { AttractionItem } from "@/components/catalog/types";
import { BaseCard } from "@/components/ui/BaseCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";

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
    <span className="inline-flex items-center gap-1 rounded-full border border-slate-100/60 bg-white/95 px-2.5 py-1 text-xs font-extrabold text-slate-900 shadow-md backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95 dark:text-white">
      <Star className="h-3.5 w-3.5 fill-emerald-500 text-emerald-500 shrink-0" />
      <span>{item.rating > 0 ? item.rating.toFixed(1) : "4.8"}</span>
    </span>
  );

  const subInfo = (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
      <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
      <span>{item.cityName}</span>
    </span>
  );

  const ratingElement = (
    <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
      <span className="rounded-md border border-slate-200/60 bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300">
        {categoryLabel}
      </span>
      {item.bestTimeToVisit && (
        <span className="rounded-md border border-slate-200/60 bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300 flex items-center gap-1">
          <Clock className="h-3 w-3" /> {item.bestTimeToVisit}
        </span>
      )}
    </div>
  );

  return (
    <BaseCard
      imageSrc={item.imageUrl}
      imageAlt={item.name}
      badge={badge}
      title={item.name}
      subInfo={subInfo}
      rating={ratingElement}
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
    <main className="mx-auto w-full md:w-[96%] max-w-[1536px] flex-1 px-4 md:px-8 py-8 sm:px-6">
      <CatalogHeader
        icon={<Compass className="h-3.5 w-3.5 text-primary-600 dark:text-primary-400" />}
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
            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => setSelectedCategory(category.id)}
                className={`min-h-[40px] rounded-xl px-3 py-2 text-xs font-bold transition-all ${
                  selectedCategory === category.id
                    ? "bg-primary-600 text-white shadow-xs"
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
