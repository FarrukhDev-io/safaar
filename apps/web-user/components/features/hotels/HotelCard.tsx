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
      <span className="rounded-full bg-slate-900/55 px-2.5 py-1 text-xs font-medium text-white">
        {"★".repeat(hotel.stars)} {hotel.stars}★
      </span>
    ) : undefined;

  const ratingElement =
    hotel.rating > 0 ? (
      <>
        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
        <span className="font-semibold text-slate-700 dark:text-slate-300">
          {hotel.rating.toFixed(1)}
        </span>
        {hotel.reviewsCount > 0 && (
          <span>
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
            <span className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white">
              {formatSum(hotel.minPriceSum)}
            </span>
            <span className="text-[11px] font-medium text-slate-400">
              / {labels.perNight}
            </span>
          </div>
        ) : undefined
      }
      footerRight={
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition-all duration-200 group-hover:bg-primary-600 group-hover:text-white group-hover:translate-x-0.5 dark:bg-slate-800 dark:text-slate-200">
          <ArrowRight className="h-4 w-4" />
        </span>
      }
    />
  );
}
