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

const fieldWrapperClass = "group relative flex min-w-0 flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 transition-all duration-200 hover:border-slate-300 hover:bg-slate-50 md:rounded-full md:border-transparent md:bg-transparent md:px-6 md:py-3.5 md:hover:bg-slate-100 cursor-pointer";

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
        className="relative flex flex-col gap-3 rounded-3xl border border-slate-300 bg-white p-3.5 shadow-xl shadow-slate-300/40 transition-all duration-300 dark:border-slate-700 dark:bg-slate-900 dark:shadow-none md:flex-row md:items-center md:gap-0 md:rounded-full md:p-2 sm:p-4"
      >
        {/* 1. Shahar / Destinatsiya */}
        <div className={fieldWrapperClass}>
          <MapPin className="h-5 w-5 shrink-0 text-primary-600 group-hover:text-primary-700 transition-colors" aria-hidden />
          <div className="min-w-0 flex-1">
            <span className="block text-xs font-extrabold uppercase tracking-wider text-slate-700">
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

        <div className="hidden h-10 w-px shrink-0 bg-slate-200 md:block" aria-hidden />

        {/* 2. Kirish sanasi */}
        <div className={fieldWrapperClass}>
          <Calendar className="h-5 w-5 shrink-0 text-primary-600 group-hover:text-primary-700 transition-colors" aria-hidden />
          <div className="min-w-0 flex-1">
            <span className="block text-xs font-extrabold uppercase tracking-wider text-slate-700">
              {dict.checkIn}
            </span>
            <DatePicker
              locale={locale}
              label=""
              placeholder={dict.checkIn}
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

        <div className="hidden h-10 w-px shrink-0 bg-slate-200 md:block" aria-hidden />

        {/* 3. Chiqish sanasi */}
        <div className={fieldWrapperClass}>
          <Calendar className="h-5 w-5 shrink-0 text-primary-600 group-hover:text-primary-700 transition-colors" aria-hidden />
          <div className="min-w-0 flex-1">
            <span className="block text-xs font-extrabold uppercase tracking-wider text-slate-700">
              {dict.checkOut}
            </span>
            <DatePicker
              locale={locale}
              label=""
              placeholder={dict.checkOut}
              value={checkOut}
              min={checkIn || today}
              icon={null}
              compact
              onChange={setCheckOut}
            />
          </div>
        </div>

        <div className="hidden h-10 w-px shrink-0 bg-slate-200 md:block" aria-hidden />

        {/* 3. Mehmonlar soni */}
        <div className={fieldWrapperClass}>
          <div className="flex w-full items-center gap-3">
            <Users className="h-5 w-5 shrink-0 text-primary-600 group-hover:text-primary-700 transition-colors" aria-hidden />
            <div className="flex-1">
              <span className="block text-xs font-extrabold uppercase tracking-wider text-slate-700">
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
            className="w-full md:w-auto uppercase tracking-wide px-8 h-12 md:h-14"
          >
            <Search className="h-5 w-5 stroke-[2.5]" aria-hidden />
            <span>{dict.submit}</span>
          </Button>
        </div>
      </form>
    </div>
  );
}
