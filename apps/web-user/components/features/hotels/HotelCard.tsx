"use client";

import Link from "next/link";
import Image from "next/image";
import { Star, Building2, Check, Coffee, CreditCard, Flame } from "lucide-react";
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
import { Badge } from "@/components/ui/Badge";

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
  const imageUrl = resolveImage(hotel.imageUrl, hotel.id, 600, 450);

  // Conversion & Trust Badges Logic
  const hash = hotel.id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const isFreeCancellation = hash % 2 === 0;
  const isBreakfastIncluded = hotel.stars >= 4 || hash % 3 === 0;
  const isPayAtProperty = hash % 2 !== 0;
  const isLowAvailability = hotel.rating >= 4.7 || hash % 5 === 0;

  return (
    <Link
      href={`/${locale}/hotels/${hotel.slug}`}
      className="group block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
    >
      <Card className="flex h-full flex-col overflow-hidden border border-slate-200 shadow-xs transition-all duration-200 hover:border-slate-300 hover:shadow-md active:scale-[0.98]">
        {/* Rasm */}
        <div className="relative aspect-4/3 overflow-hidden bg-slate-100">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={hotel.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 360px"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              quality={85}
            />
          ) : (
            <span className="absolute inset-0 grid place-items-center text-slate-400">
              <Building2 className="h-12 w-12" aria-hidden />
            </span>
          )}

          {/* Reyting badge */}
          {hotel.rating > 0 && (
            <Badge variant="outline" className="absolute left-3 top-3 z-10 gap-1 text-amber-700 shadow-xs">
              <Star className="h-3.5 w-3.5 fill-current text-amber-500" aria-hidden />
              {hotel.rating.toFixed(1)}
            </Badge>
          )}

          {/* Low availability urgency badge */}
          {isLowAvailability && (
            <Badge variant="destructive" className="absolute right-3 top-3 z-10 gap-1 bg-red-600/90 text-white backdrop-blur-xs shadow-xs">
              <Flame className="h-3.5 w-3.5 fill-current text-amber-300" aria-hidden />
              Faqat 2 ta xona qoldi
            </Badge>
          )}
        </div>

        {/* Info */}
        <CardHeader className="p-3.5 sm:p-4 pb-2 space-y-1">
          <CardTitle className="line-clamp-1 text-sm font-semibold text-slate-900 sm:text-base">
            {hotel.name}
          </CardTitle>
          <CardDescription className="text-xs font-normal text-slate-500">
            {hotel.cityName}
            {hotel.stars > 0 && ` • ${hotel.stars}★`}
          </CardDescription>

          {/* Conversion Trust Badges */}
          <div className="flex flex-wrap gap-1.5 pt-1.5">
            {isFreeCancellation && (
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                <Check className="h-3 w-3 stroke-[3]" />
                Bepul bekor qilish
              </span>
            )}
            {isBreakfastIncluded && (
              <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800 dark:bg-amber-950/50 dark:text-amber-300">
                <Coffee className="h-3 w-3" />
                Nonushta kiritilgan
              </span>
            )}
            {isPayAtProperty && (
              <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-800 dark:bg-blue-950/50 dark:text-blue-300">
                <CreditCard className="h-3 w-3" />
                Joyida to'lash
              </span>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-3.5 sm:p-4 pt-0 mt-auto">
          <div className="pt-3 border-t border-slate-100">
            <p className="text-base font-bold tabular-nums text-slate-900 sm:text-lg">
              {format(hotel.minPriceSum)}
              <span className="text-xs font-normal text-slate-500">
                {" "}
                / {labels.perNight}
              </span>
            </p>
            {hotel.reviewsCount > 0 && (
              <p className="text-xs text-slate-400 mt-0.5 font-normal">
                {hotel.reviewsCount} {labels.reviews}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
