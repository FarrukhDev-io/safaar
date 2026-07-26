"use client";

import { Star, ArrowRight } from "lucide-react";
import type { Locale } from "@/i18n/config";
import { useCurrency } from "@/lib/context/CurrencyContext";
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
  const { format } = useCurrency();
  const imageUrl = resolveImage(hotel.imageUrl, hotel.id, 600, 450) || "/Hotel-placeholder.jpeg";

  const badge = hotel.stars > 0 ? (
    <span className="rounded-full bg-slate-900/55 px-2.5 py-1 text-xs font-medium text-white">
      {"★".repeat(hotel.stars)} {hotel.stars}★
    </span>
  ) : undefined;

  const ratingElement = hotel.rating > 0 ? (
    <>
      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
      <span className="font-semibold text-slate-700 dark:text-slate-300">
        {hotel.rating.toFixed(1)}
      </span>
      {hotel.reviewsCount > 0 && (
        <span>· {hotel.reviewsCount} {labels.reviews}</span>
      )}
    </>
  ) : undefined;

  return (
    <BaseCard
      imageSrc={imageUrl}
      imageAlt={hotel.name}
      badge={badge}
      title={hotel.name}
      subInfo={hotel.cityName}
      rating={ratingElement}
      href={`/${locale}/hotels/${hotel.slug}`}
      footerLeft={
        <>
          <span className="text-sm font-bold text-slate-900 dark:text-white">
            {format(hotel.minPriceSum)}
          </span>
          <span className="text-[10px] text-slate-400">/ {labels.perNight}</span>
        </>
      }
      footerRight={
        <span className="inline-flex min-h-[44px] items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
          <ArrowRight className="h-3.5 w-3.5" />
        </span>
      }
    />
  );
}
