"use client";

import { useState, useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { HotelsDict } from "@/i18n/dictionaries";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Filter, ChevronDown } from "lucide-react";
import { FilterSidebar } from "@/components/ui/FilterSidebar";
import { Checkbox } from "@/components/ui/Checkbox";
import { FilterGroup } from "@/components/ui/FilterGroup";
import { Button } from "@/components/ui/Button";

const AMENITIES = [
  { id: "pool", label: "Basseyn (Yopiq/Ochiq)" },
  { id: "tapchan", label: "Tapchan (Chayxona)" },
  { id: "sauna", label: "Sauna & Fin hammomi" },
  { id: "wifi", label: "Yuqori tezlikdagi Wi-Fi" },
  { id: "breakfast", label: "Nonushta (Breakfast)" },
  { id: "billiards", label: "Bilyard xonasi" },
] as const;

const PAYMENT_TYPES = [
  { id: "pay_at_property", label: "Joyida to'lash (Naqd/Karta)" },
  { id: "online_payment", label: "Online to'lash (Click, Payme)" },
] as const;

export function HotelFilters({ dict }: { dict: Pick<HotelsDict, "filters"> }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [open, setOpen] = useState(false);
  const [stars, setStars] = useState(searchParams.get("stars") ?? "");
  const [minPrice, setMinPrice] = useState(searchParams.get("min_price") ?? "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("max_price") ?? "");

  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(() => {
    const raw = searchParams.get("amenities");
    return raw ? raw.split(",") : [];
  });

  const [selectedPayments, setSelectedPayments] = useState<string[]>(() => {
    const raw = searchParams.get("payment");
    return raw ? raw.split(",") : [];
  });

  const toggleAmenity = useCallback((id: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  }, []);

  const togglePayment = useCallback((id: string) => {
    setSelectedPayments((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  }, []);

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
    if (stars) params.set("stars", stars); else params.delete("stars");
    if (minPrice) params.set("min_price", minPrice); else params.delete("min_price");
    if (maxPrice) params.set("max_price", maxPrice); else params.delete("max_price");
    if (selectedAmenities.length) params.set("amenities", selectedAmenities.join(",")); else params.delete("amenities");
    if (selectedPayments.length) params.set("payment", selectedPayments.join(",")); else params.delete("payment");
    push(params);
    setOpen(false);
  }, [searchParams, stars, minPrice, maxPrice, selectedAmenities, selectedPayments, push]);

  const reset = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    for (const key of ["stars", "min_price", "max_price", "amenities", "payment"]) {
      params.delete(key);
    }
    setStars("");
    setMinPrice("");
    setMaxPrice("");
    setSelectedAmenities([]);
    setSelectedPayments([]);
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
            <Filter className="h-4 w-4 text-blue-600 dark:text-blue-400" />
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

        {/* Amenities group */}
        <FilterGroup title="Qulayliklar">
          <div className="flex flex-col gap-2">
            {AMENITIES.map((item) => {
              const checked = selectedAmenities.includes(item.id);
              return (
                <Checkbox
                  key={item.id}
                  checked={checked}
                  onChange={() => toggleAmenity(item.id)}
                  label={item.label}
                  className={`flex-row-reverse justify-between items-center w-full rounded-lg border px-3 py-2 text-xs font-medium transition-all ${
                    checked
                      ? "border-blue-500 bg-blue-50/50 !text-blue-900 dark:bg-blue-950/50 dark:!text-blue-300"
                      : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300"
                  }`}
                />
              );
            })}
          </div>
        </FilterGroup>

        {/* Payment types group */}
        <FilterGroup title="To'lov turi">
          <div className="flex flex-col gap-2">
            {PAYMENT_TYPES.map((item) => {
              const checked = selectedPayments.includes(item.id);
              return (
                <Checkbox
                  key={item.id}
                  checked={checked}
                  onChange={() => togglePayment(item.id)}
                  label={item.label}
                  className={`flex-row-reverse justify-between items-center w-full rounded-lg border px-3 py-2 text-xs font-medium transition-all ${
                    checked
                      ? "border-blue-500 bg-blue-50/50 !text-blue-900 dark:bg-blue-950/50 dark:!text-blue-300"
                      : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300"
                  }`}
                />
              );
            })}
          </div>
        </FilterGroup>
      </FilterSidebar>
    </div>
  );
}
