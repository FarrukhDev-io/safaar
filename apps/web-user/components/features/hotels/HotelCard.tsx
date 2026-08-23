"use client";

import { ArrowRight, Star } from "lucide-react";
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

  const badge =
    hotel.stars > 0 ? (
      <span className="rounded-full bg-slate-900/60 backdrop-blur-xs px-2 py-0.5 text-[10px] sm:text-xs font-semibold text-white">
        {"★".repeat(hotel.stars)} {hotel.stars}★
      </span>
    ) : undefined;

  const ratingElement =
    hotel.rating > 0 ? (
      <>
        <Star className="h-3 w-3 sm:h-3.5 sm:w-3.5 fill-amber-400 text-amber-400 shrink-0" />
        <span className="font-bold text-slate-800 dark:text-slate-200">
          {hotel.rating.toFixed(1)}
        </span>
        {hotel.reviewsCount > 0 && (
          <span className="hidden sm:inline text-slate-400">
            · {hotel.reviewsCount} {labels.reviews}
          </span>
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
        hotel.minPriceSum > 0 ? (
          <div className="flex flex-col leading-tight">
            <span className="text-xs sm:text-base md:text-lg font-black tracking-tight text-slate-900 dark:text-white">
              {formatSum(hotel.minPriceSum)}
            </span>
            <span className="text-[9px] sm:text-[11px] font-medium text-slate-400">
              / {labels.perNight}
            </span>
          </div>
        ) : undefined
      }
      footerRight={
        <span className="inline-flex h-6 w-6 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition-all duration-200 group-hover:bg-primary-600 group-hover:text-white group-hover:translate-x-0.5 dark:bg-slate-800 dark:text-slate-200">
          <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4" />
        </span>
      }
    />
  );
}
