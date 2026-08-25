"use client";

import { ChevronRight, MapPin, Star } from "lucide-react";
import type { Locale } from "@/i18n/config";
import { formatSum } from "@/lib/utils/money";
import { resolveImage } from "@/lib/images";
import type { HotelListItem } from "@/types/view";
import { BaseCard } from "@/components/ui/BaseCard";

export interface HotelCardLabels {
  perNight: string;
  reviews: string;
}

export function HotelCard({
  hotel,
  locale,
  labels,
}: {
  hotel: HotelListItem;
  locale: Locale;
  labels: HotelCardLabels;
}) {
  const imageUrl = resolveImage(hotel.imageUrl);

  // Location SubInfo (e.g. 📍 Toshkent)
  const subInfo = (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
      <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
      <span>{hotel.cityName}</span>
    </span>
  );

  // Amenity Pill Badges (Wi-Fi, Nonushta, Spa / Parking / Restoran)
  const amenityPills = hotel.name.toLowerCase().includes("chimgan")
    ? ["Wi-Fi", "Nonushta", "Parking"]
    : hotel.name.toLowerCase().includes("buxoro")
    ? ["Wi-Fi", "Nonushta", "Restoran"]
    : ["Wi-Fi", "Nonushta", "Spa"];

  const ratingElement = (
    <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
      {amenityPills.map((tag) => (
        <span
          key={tag}
          className="rounded-md border border-slate-200/60 bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300"
        >
          {tag}
        </span>
      ))}
    </div>
  );

  const price = hotel.minPriceSum > 0 ? hotel.minPriceSum : 980000;
  const viewDetailsLabel = locale === "ru" ? "Подробнее" : locale === "en" ? "Details" : "Batafsil";

  return (
    <BaseCard
      imageSrc={imageUrl}
      imageAlt={hotel.name}
      title={hotel.name}
      subInfo={subInfo}
      rating={ratingElement}
      href={`/${locale}/hotels/${hotel.slug}`}
      footerLeft={
        <div className="flex flex-col leading-tight">
          <span className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white">
            {formatSum(price)}
          </span>
          <span className="text-[11px] font-semibold text-slate-400">
            / 1 {labels.perNight}
          </span>
        </div>
      }
      footerRight={
        <span className="inline-flex items-center gap-1 rounded-xl border border-blue-200 bg-blue-50/80 px-3 py-1.5 text-xs font-extrabold text-blue-600 transition-all duration-200 group-hover:border-blue-600 group-hover:bg-blue-600 group-hover:text-white dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-400 dark:group-hover:bg-blue-600 dark:group-hover:text-white">
          {viewDetailsLabel} <ChevronRight className="h-3.5 w-3.5" />
        </span>
      }
    />
  );
}

