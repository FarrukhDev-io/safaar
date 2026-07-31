"use client";

import { ArrowRight } from "lucide-react";
import type { Locale } from "@/i18n/config";
import { useCurrency } from "@/lib/context/CurrencyContext";
import { resolveImage } from "@/lib/images";
import type { HotelListItem } from "@/types/view";
import { BaseCard } from "@/components/ui/BaseCard";

export function FeaturedHotelCard({
  hotel,
  locale,
  dict,
}: {
  hotel: HotelListItem;
  locale: Locale;
  dict: {
    perNight?: string;
    reviews?: string;
    excellent?: string;
    good?: string;
  };
}) {
  const { format } = useCurrency();
  const imageUrl = resolveImage(hotel.imageUrl);

  const badge =
    hotel.rating > 0 ? (
      <span className="rounded-full bg-slate-900/55 px-2.5 py-1 text-xs font-medium text-white">
        ★ {hotel.rating.toFixed(1)}
      </span>
    ) : undefined;

  const subInfo = (
    <>
      {hotel.cityName}
      {hotel.stars > 0 && ` · ${hotel.stars}★`}
    </>
  );

  const ratingElement = hotel.reviewsCount > 0 ? (
    <span>
      {hotel.rating >= 4.5 ? (dict.excellent || "A'lo") : (dict.good || "Yaxshi")} · {hotel.reviewsCount} {locale === "uz" ? "ta sharh" : (dict.reviews || "reviews")}
    </span>
  ) : undefined;

  return (
    <BaseCard
      imageSrc={imageUrl}
      imageAlt={hotel.name}
      badge={badge}
      title={hotel.name}
      subInfo={subInfo}
      rating={ratingElement}
      href={`/${locale}/hotels/${hotel.slug}`}
      footerLeft={
        hotel.minPriceSum > 0 ? (
          <>
            <span className="text-sm font-bold text-slate-900 dark:text-white">
              {format(hotel.minPriceSum)}
            </span>
            <span className="text-[10px] text-slate-400">/ {dict.perNight || "kecha"}</span>
          </>
        ) : undefined
      }
      footerRight={
        <span className="inline-flex min-h-[44px] items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-350 dark:hover:bg-slate-800">
          <ArrowRight className="h-3.5 w-3.5" />
        </span>
      }
    />
  );
}
