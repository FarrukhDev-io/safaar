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
import { Button } from "@/components/ui/Button";

export type { PropertyType, SearchDefaults };

const fieldWrapperClass = "group relative flex min-w-0 flex-1 items-center gap-3.5 rounded-2xl border border-slate-100 bg-slate-50/50 px-4 py-3 transition-all duration-300 hover:bg-slate-100/80 hover:border-slate-200 md:rounded-full md:border-transparent md:bg-transparent md:px-6 md:py-3 md:hover:bg-slate-50 cursor-pointer dark:border-slate-800/40 dark:bg-slate-900/30 dark:md:bg-transparent dark:md:hover:bg-slate-800/40";

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
    <div className="mx-auto w-full max-w-5xl">
      <form
        onSubmit={handleSubmit}
        className="relative flex flex-col gap-3 rounded-3xl border border-slate-100/50 bg-white p-3.5 shadow-[0_20px_50px_-12px_rgba(15,23,42,0.08)] backdrop-blur-md transition-all duration-300 dark:border-slate-800/80 dark:bg-slate-950 md:flex-row md:items-center md:gap-0 md:rounded-full md:p-2 sm:p-4"
      >
        {/* 1. Shahar / Destinatsiya */}
        <div className={fieldWrapperClass}>
          <MapPin className="h-5 w-5 shrink-0 text-blue-500 group-hover:text-blue-600 transition-colors" aria-hidden />
          <div className="min-w-0 flex-1">
            <span className="block text-[11px] font-semibold text-slate-400 dark:text-slate-500 mb-0.5">
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

        <div className="hidden h-10 w-px shrink-0 bg-slate-100 md:block" aria-hidden />

        {/* 2. Kirish sanasi */}
        <div className={fieldWrapperClass}>
          <Calendar className="h-5 w-5 shrink-0 text-blue-500 group-hover:text-blue-600 transition-colors" aria-hidden />
          <div className="min-w-0 flex-1">
            <span className="block text-[11px] font-semibold text-slate-400 dark:text-slate-500 mb-0.5">
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
        </div>

        <div className="hidden h-10 w-px shrink-0 bg-slate-100 md:block" aria-hidden />

        {/* 3. Chiqish sanasi */}
        <div className={fieldWrapperClass}>
          <Calendar className="h-5 w-5 shrink-0 text-blue-500 group-hover:text-blue-600 transition-colors" aria-hidden />
          <div className="min-w-0 flex-1">
            <span className="block text-[11px] font-semibold text-slate-400 dark:text-slate-500 mb-0.5">
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

        <div className="hidden h-10 w-px shrink-0 bg-slate-100 md:block" aria-hidden />

        {/* 3. Mehmonlar soni */}
        <div className={fieldWrapperClass}>
          <div className="flex w-full items-center gap-3.5">
            <Users className="h-5 w-5 shrink-0 text-blue-500 group-hover:text-blue-600 transition-colors" aria-hidden />
            <div className="flex-1">
              <span className="block text-[11px] font-semibold text-slate-400 dark:text-slate-500 mb-0.5">
                {dict.guests}
              </span>
              <GuestPicker value={guests} onChange={setGuests} />
            </div>
          </div>
        </div>

        {/* 4. Qidirish tugmasi */}
        <div className="shrink-0 pt-1 md:pt-0 md:pl-2">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            rounded="full"
            className="w-full md:w-auto px-8 h-12 md:h-14 font-bold text-sm bg-blue-600 hover:bg-blue-700"
          >
            <Search className="h-4.5 w-4.5 stroke-[2.5]" aria-hidden />
            <span>{dict.submit}</span>
          </Button>
        </div>
      </form>
    </div>
  );
}
