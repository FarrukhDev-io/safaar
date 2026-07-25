"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Star, Check, Coffee, CreditCard, Flame, Heart } from "lucide-react";
import type { Locale } from "@/i18n/config";
import { useCurrency } from "@/lib/context/CurrencyContext";
import { resolveImage } from "@/lib/images";
import type { HotelListItem } from "@/types/view";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/Card";

export function FeaturedHotelCard({
  hotel,
  locale,
}: {
  hotel: HotelListItem;
  locale: Locale;
}) {
  const { format } = useCurrency();
  const [isFavorite, setIsFavorite] = useState(false);
  const imageUrl = resolveImage(hotel.imageUrl, hotel.id, 500, 380);

  const hash = hotel.id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const isFreeCancellation = hash % 2 === 0;
  const isBreakfastIncluded = hotel.stars >= 4 || hash % 3 === 0;
  const isPayAtProperty = hash % 2 !== 0;
  const isLowAvailability = hotel.rating >= 4.7 || hash % 5 === 0;

  const hasDiscount = hash % 2 === 0;
  const oldPrice = hasDiscount ? Math.round(hotel.minPriceSum * 1.22) : null;
  const discountPercent = 20;

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFavorite((v) => !v);
  };

  return (
    <Link
      href={`/${locale}/hotels/${hotel.slug}`}
      className="group block rounded-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
    >
      <Card className="flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-xs transition-all duration-300 ease-out group-hover:-translate-y-1.5 group-hover:border-blue-400/80 group-hover:shadow-2xl dark:border-slate-800 dark:bg-slate-900 dark:group-hover:border-blue-700">
        {/* Image & Overlays */}
        <div className="relative aspect-4/3 overflow-hidden bg-slate-100 dark:bg-slate-800">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={hotel.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 320px"
              className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
              quality={85}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-slate-400">
              <Star className="h-8 w-8" />
            </div>
          )}

          {/* Glassmorphism Rating Badge */}
          {hotel.rating > 0 && (
            <div className="absolute left-3 top-3 z-10 inline-flex items-center gap-1 rounded-full border border-white/50 bg-white/85 px-2.5 py-1 text-xs font-extrabold text-amber-700 shadow-sm backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/85 dark:text-amber-400">
              <Star className="h-3.5 w-3.5 fill-current text-amber-500" aria-hidden />
              <span>{hotel.rating.toFixed(1)}</span>
            </div>
          )}

          {/* Low availability urgency pulse badge */}
          {isLowAvailability && (
            <div className="absolute left-3 bottom-3 z-10 inline-flex items-center gap-1 rounded-full bg-rose-600/90 px-2.5 py-1 text-[10px] font-extrabold text-white shadow-xs backdrop-blur-xs animate-pulse">
              <Flame className="h-3 w-3 fill-current text-amber-300" aria-hidden />
              <span>Faqat 2 ta xona qoldi</span>
            </div>
          )}

          {/* 1-Click Favorite Heart Button */}
          <button
            type="button"
            onClick={handleFavoriteClick}
            aria-label="Saralanganlarga qo'shish"
            className="absolute right-3 top-3 z-20 rounded-full border border-white/40 bg-white/80 p-2 text-slate-600 shadow-xs backdrop-blur-md transition-all hover:bg-white hover:text-rose-500 active:scale-90 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-rose-400"
          >
            <Heart
              className={`h-4 w-4 transition-colors ${
                isFavorite ? "fill-rose-500 text-rose-500" : ""
              }`}
            />
          </button>
        </div>

        {/* Info */}
        <CardHeader className="p-4 pb-2 space-y-1">
          <CardTitle className="line-clamp-1 text-base font-bold text-slate-900 dark:text-white">
            {hotel.name}
          </CardTitle>
          <CardDescription className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {hotel.cityName}
            {hotel.stars > 0 && ` • ${hotel.stars}★`}
          </CardDescription>

          {/* Trust badges */}
          <div className="flex flex-wrap gap-1.5 pt-1.5">
            {isFreeCancellation && (
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                <Check className="h-3 w-3 stroke-[3]" />
                Bepul bekor qilish
              </span>
            )}
            {isBreakfastIncluded && (
              <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                <Coffee className="h-3 w-3" />
                Nonushta kiritilgan
              </span>
            )}
            {isPayAtProperty && (
              <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
                <CreditCard className="h-3 w-3" />
                Joyida to'lash
              </span>
            )}
          </div>
        </CardHeader>

        {/* Price & Rating Summary Content */}
        <CardContent className="p-4 pt-0 mt-auto">
          <div className="flex flex-col gap-1 border-t border-slate-100 pt-3 dark:border-slate-800">
            {/* Price layout */}
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
                {format(hotel.minPriceSum)}
              </span>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                / kecha
              </span>

              {oldPrice && (
                <div className="ml-auto flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-slate-400 line-through">
                    {format(oldPrice)}
                  </span>
                  <span className="rounded-md bg-emerald-100 px-1.5 py-0.5 text-[10px] font-black text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
                    -{discountPercent}%
                  </span>
                </div>
              )}
            </div>

            {/* Review count label */}
            {hotel.reviewsCount > 0 && (
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {hotel.rating >= 4.5 ? "A'lo" : "Yaxshi"} • {hotel.reviewsCount} ta sharh
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
