"use client";

import { useState, useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { HotelsDict } from "@/i18n/dictionaries";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Filter, ChevronDown } from "lucide-react";
import { FilterSidebar } from "@/components/ui/FilterSidebar";
import { FilterGroup } from "@/components/ui/FilterGroup";
import { Button } from "@/components/ui/Button";


export function HotelFilters({ dict }: { dict: Pick<HotelsDict, "filters"> }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") ?? "");
  const [stars, setStars] = useState(searchParams.get("stars") ?? "");
  const [minPrice, setMinPrice] = useState(searchParams.get("min_price") ?? "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("max_price") ?? "");

  const push = useCallback(
    (params: URLSearchParams) => {
      params.delete("page");
      const query = params.toString();
      router.push(`${pathname}${query ? `?${query}` : ""}`);
    },
    [router, pathname]
  );

  const apply = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (searchQuery) params.set("search", searchQuery); else params.delete("search");
    if (stars) params.set("stars", stars); else params.delete("stars");
    if (minPrice) params.set("min_price", minPrice); else params.delete("min_price");
    if (maxPrice) params.set("max_price", maxPrice); else params.delete("max_price");
    push(params);
    setOpen(false);
  }, [searchParams, searchQuery, stars, minPrice, maxPrice, push]);

  const reset = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    for (const key of ["search", "stars", "min_price", "max_price"]) {
      params.delete(key);
    }
    setSearchQuery("");
    setStars("");
    setMinPrice("");
    setMaxPrice("");
    push(params);
    setOpen(false);
  }, [searchParams, push]);

  return (
    <div className="w-full">
      {/* Mobile Toggle Trigger Button */}
      <Button
        type="button"
        variant="secondary"
        size="md"
        onClick={() => setOpen(true)}
        className="mb-4 lg:hidden"
      >
        <span className="flex items-center justify-between w-full">
          <span className="inline-flex items-center gap-2">
            <Filter className="h-4 w-4 text-primary-600 dark:text-primary-400" />
            <span>{dict.filters.toggle}</span>
          </span>
          <ChevronDown className="h-4 w-4 text-slate-600 dark:text-slate-400" />
        </span>
      </Button>

      <FilterSidebar
        title={dict.filters.title}
        isOpen={open}
        onClose={() => setOpen(false)}
        onApply={apply}
        onReset={reset}
        applyLabel={dict.filters.apply}
        resetLabel={dict.filters.reset}
      >
        {/* Name Search */}
        <FilterGroup title={dict.filters.searchName || "Nomi bo'yicha qidiruv"}>
          <Input
            type="text"
            placeholder={dict.filters.searchPlaceholder || "Masalan: Hilton"}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </FilterGroup>

        {/* Star Rating Group */}
        <FilterGroup title={dict.filters.stars}>
          <Select
            value={stars}
            onChange={setStars}
            options={[
              { value: "", label: dict.filters.anyStars },
              ...[5, 4, 3, 2, 1].map((s) => ({
                value: String(s),
                label: dict.filters.starsValue.replace("{n}", String(s)),
              })),
            ]}
          />
        </FilterGroup>

        {/* Price limits group */}
        <FilterGroup title={`Narx (${dict.filters.currency})`}>
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="number"
              min={0}
              inputMode="numeric"
              placeholder="Min"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
            />
            <Input
              type="number"
              min={0}
              inputMode="numeric"
              placeholder="Max"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
            />
          </div>
        </FilterGroup>
      </FilterSidebar>
    </div>
  );
}
