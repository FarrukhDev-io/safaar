"use client";

import { useState, type FormEvent } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, Calendar, Users, MapPin } from "lucide-react";
import { DatePicker } from "./DatePicker";
import { CityPicker } from "./CityPicker";
import { GuestPicker } from "./GuestPicker";
import type { PropertyType, SearchDefaults } from "./types";
import type { Locale } from "@/i18n/config";
import type { CommonDict } from "@/i18n/dictionaries";
import type { CityOption } from "@/types/view";
import { trackSearchPerformed } from "@/lib/services/analytics/tracker";

export type { PropertyType, SearchDefaults };

export function SearchBar({
  locale,
  dict,
  cities,
  defaults,
}: {
  locale: Locale;
  dict: CommonDict["search"];
  cities: CityOption[];
  defaults?: SearchDefaults;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [cityId, setCityId] = useState(defaults?.cityId ?? "");
  const [checkIn, setCheckIn] = useState(defaults?.checkIn ?? "");
  const [checkOut, setCheckOut] = useState(defaults?.checkOut ?? "");
  const [guests, setGuests] = useState(defaults?.guests ?? 2);

  const typeFromPath = pathname.split("/").pop() as PropertyType;
  const typePathsReverse: Record<string, PropertyType> = {
    hotels: "hotel",
    dachas: "dacha",
    guesthouses: "guesthouse",
    sanatoriums: "sanatorium",
    resorts: "resort",
  };
  const activeType =
    typePathsReverse[typeFromPath] ||
    (searchParams.get("type") as PropertyType) ||
    "hotel";

  const today = new Date().toISOString().split("T")[0];

  const typePaths: Record<PropertyType, string> = {
    hotel: `/${locale}/hotels`,
    dacha: `/${locale}/dachas`,
    guesthouse: `/${locale}/guesthouses`,
    sanatorium: `/${locale}/sanatoriums`,
    resort: `/${locale}/resorts`,
  };

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (cityId) params.set("city_id", cityId);
    if (checkIn) params.set("check_in", checkIn);
    if (checkOut) params.set("check_out", checkOut);
    if (guests) params.set("guests", String(guests));

    const selectedCity = cities.find((c) => c.id === cityId)?.name || cityId;
    trackSearchPerformed({
      city: selectedCity,
      checkIn,
      checkOut,
      guests,
    });

    const base = typePaths[activeType] ?? `/${locale}/hotels`;
    const query = params.toString();
    router.push(`${base}${query ? `?${query}` : ""}`);
  }

  return (
    <div className="mx-auto w-full max-w-4xl">
      <form
        onSubmit={handleSubmit}
        className="rounded-3xl border border-slate-200/80 bg-card p-3.5 shadow-xl shadow-slate-200/50 transition-all duration-200 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none sm:p-4"
      >
        {/* Desktop grid layout & Mobile stack layout */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-2">
          {/* 1. Shahar / Destinatsiya */}
          <div className="flex min-w-0 flex-1 items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 transition-colors hover:border-slate-300 hover:bg-slate-50 md:border-none md:bg-transparent md:p-1.5">
            <MapPin className="h-5 w-5 shrink-0 text-primary-600" aria-hidden />
            <div className="min-w-0 flex-1">
              <span className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-700">
                {dict.city}
              </span>
              <CityPicker
                cities={cities}
                value={cityId}
                onChange={setCityId}
                placeholder={dict.cityPlaceholder}
              />
            </div>
          </div>

          <div className="hidden h-9 w-px shrink-0 bg-slate-300 md:block" aria-hidden />

          {/* 2. Sanalar (Kirish va Chiqish) */}
          <div className="flex min-w-0 flex-1 items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 transition-colors hover:border-slate-300 hover:bg-slate-50 md:border-none md:bg-transparent md:p-1.5">
            <Calendar className="h-5 w-5 shrink-0 text-primary-600" aria-hidden />
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <div className="min-w-0 flex-1">
                <span className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-700">
                  {dict.checkIn}
                </span>
                <DatePicker
                  locale={locale}
                  label=""
                  value={checkIn}
                  min={today}
                  icon={null}
                  compact
                  onChange={(iso) => {
                    setCheckIn(iso);
                    if (checkOut && iso > checkOut) setCheckOut("");
                  }}
                />
              </div>
              <span className="text-xs font-bold text-slate-400">—</span>
              <div className="min-w-0 flex-1">
                <span className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-700">
                  {dict.checkOut}
                </span>
                <DatePicker
                  locale={locale}
                  label=""
                  value={checkOut}
                  min={checkIn || today}
                  icon={null}
                  compact
                  onChange={setCheckOut}
                />
              </div>
            </div>
          </div>

          <div className="hidden h-9 w-px shrink-0 bg-slate-300 md:block" aria-hidden />

          {/* 3. Mehmonlar soni */}
          <div className="flex items-center justify-between gap-2.5 rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 transition-colors hover:border-slate-300 hover:bg-slate-50 md:border-none md:bg-transparent md:p-1.5">
            <div className="flex items-center gap-2.5">
              <Users className="h-5 w-5 shrink-0 text-primary-600" aria-hidden />
              <div>
                <span className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-700">
                  {dict.guests}
                </span>
                <GuestPicker value={guests} onChange={setGuests} />
              </div>
            </div>
          </div>

          {/* 4. Qidirish tugmasi */}
          <div className="shrink-0 pt-1 md:pt-0">
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-600 px-6 py-3.5 text-sm font-bold text-white shadow-md transition-all duration-150 hover:bg-primary-700 active:scale-[0.98] md:w-auto md:py-3"
            >
              <Search className="h-4 w-4 stroke-[2.5]" aria-hidden />
              <span className="uppercase tracking-wide">{dict.submit}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
