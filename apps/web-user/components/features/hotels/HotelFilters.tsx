"use client";

import { useState, useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { HotelsDict } from "@/i18n/dictionaries";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Filter, ChevronDown, RotateCcw, Waves, Tv, ShieldCheck, CreditCard, Sparkles } from "lucide-react";

const AMENITIES = [
  { id: "pool", label: "Basseyn (Yopiq/Ochiq)", icon: Waves },
  { id: "tapchan", label: "Tapchan (Chayxona)", icon: Sparkles },
  { id: "sauna", label: "Sauna & Fin hammomi", icon: ShieldCheck },
  { id: "wifi", label: "Yuqori tezlikdagi Wi-Fi", icon: Tv },
  { id: "breakfast", label: "Nonushta (Breakfast)", icon: Sparkles },
  { id: "billiards", label: "Bilyard xonasi", icon: Sparkles },
] as const;

const PAYMENT_TYPES = [
  { id: "pay_at_property", label: "Joyida to'lash (Naqd/Karta)", icon: CreditCard },
  { id: "online_payment", label: "Online to'lash (Click, Payme)", icon: CreditCard },
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

  function setOrDelete(params: URLSearchParams, key: string, value: string) {
    if (value) params.set(key, value);
    else params.delete(key);
  }

  const push = useCallback((params: URLSearchParams) => {
    params.delete("page");
    const query = params.toString();
    router.push(`${pathname}${query ? `?${query}` : ""}`);
  }, [router, pathname]);

  const apply = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    setOrDelete(params, "stars", stars);
    setOrDelete(params, "min_price", minPrice);
    setOrDelete(params, "max_price", maxPrice);
    setOrDelete(params, "amenities", selectedAmenities.join(","));
    setOrDelete(params, "payment", selectedPayments.join(","));
    push(params);
    setOpen(false);
  }, [searchParams, stars, minPrice, maxPrice, selectedAmenities, selectedPayments, push]);

  const reset = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    for (const key of ["stars", "min_price", "max_price", "amenities", "payment"]) params.delete(key);
    setStars("");
    setMinPrice("");
    setMaxPrice("");
    setSelectedAmenities([]);
    setSelectedPayments([]);
    push(params);
  }, [searchParams, push]);

  return (
    <aside aria-label={dict.filters.title} className="lg:sticky lg:top-20 lg:h-fit">
      {/* Mobile Toggle Button */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="mb-3 flex w-full items-center justify-between rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 shadow-2xs transition-all hover:bg-slate-100 hover:border-slate-400 active:scale-[0.98] dark:border-slate-800 dark:bg-slate-900 dark:text-white lg:hidden"
      >
        <span className="inline-flex items-center gap-2">
          <Filter className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <span>{dict.filters.toggle}</span>
        </span>
        <ChevronDown className={cn("h-4 w-4 transition-transform text-slate-600 dark:text-slate-400", open && "rotate-180")} />
      </button>

      {/* Main Filter Container */}
      <div
        className={cn(
          "flex-col gap-4.5 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900",
          open ? "flex" : "hidden",
          "lg:flex",
        )}
      >
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3 dark:border-slate-800">
          <Filter className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <h2 className="text-base font-extrabold uppercase tracking-wide text-slate-900 dark:text-white">
            {dict.filters.title}
          </h2>
        </div>

        {/* Yulduzlar */}
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            {dict.filters.stars}
          </span>
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
        </label>

        {/* Narx chegaralari */}
        <div className="grid grid-cols-2 gap-2">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Min ({dict.filters.currency})
            </span>
            <Input
              type="number"
              min={0}
              inputMode="numeric"
              placeholder="0"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Max ({dict.filters.currency})
            </span>
            <Input
              type="number"
              min={0}
              inputMode="numeric"
              placeholder="Maks"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
            />
          </label>
        </div>

        {/* Local Uzbek Amenities Filter */}
        <div className="flex flex-col gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Qulayliklar (Amenities)
          </span>
          <div className="flex flex-col gap-1.5">
            {AMENITIES.map((item) => {
              const checked = selectedAmenities.includes(item.id);
              return (
                <label
                  key={item.id}
                  className={cn(
                    "flex cursor-pointer items-center justify-between rounded-xl border px-3 py-2 text-xs font-medium transition-all select-none",
                    checked
                      ? "border-blue-500 bg-blue-50/50 text-blue-900 font-bold dark:bg-blue-950/50 dark:text-blue-300"
                      : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300"
                  )}
                >
                  <span className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleAmenity(item.id)}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>{item.label}</span>
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Payment Type Filter */}
        <div className="flex flex-col gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            To'lov turi
          </span>
          <div className="flex flex-col gap-1.5">
            {PAYMENT_TYPES.map((item) => {
              const checked = selectedPayments.includes(item.id);
              return (
                <label
                  key={item.id}
                  className={cn(
                    "flex cursor-pointer items-center justify-between rounded-xl border px-3 py-2 text-xs font-medium transition-all select-none",
                    checked
                      ? "border-emerald-500 bg-emerald-50/50 text-emerald-900 font-bold dark:bg-emerald-950/50 dark:text-emerald-300"
                      : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300"
                  )}
                >
                  <span className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => togglePayment(item.id)}
                      className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>{item.label}</span>
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <Button
            type="button"
            onClick={apply}
            className="flex-1 rounded-xl bg-blue-600 font-bold text-white shadow-xs hover:bg-blue-700"
          >
            {dict.filters.apply}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={reset}
            className="rounded-xl border border-slate-300 bg-white font-bold text-slate-800 shadow-2xs hover:bg-slate-50 hover:border-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <RotateCcw className="h-4 w-4" />
            <span>{dict.filters.reset}</span>
          </Button>
        </div>
      </div>
    </aside>
  );
}
