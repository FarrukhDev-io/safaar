"use client";

import type { Locale } from "@/i18n/config";
import { resolveImage } from "@/lib/images";
import type { HotelListItem } from "@/types/view";
import { UniversalCard } from "@/components/ui/UniversalCard";

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

  // Amenity Pill Badges (Wi-Fi, Nonushta, Spa / Parking / Restoran)
  const amenityPills = hotel.name.toLowerCase().includes("chimgan")
    ? ["Wi-Fi", "Nonushta", "Parking"]
    : hotel.name.toLowerCase().includes("buxoro")
    ? ["Wi-Fi", "Nonushta", "Restoran"]
    : ["Wi-Fi", "Nonushta", "Spa"];

  const price = hotel.minPriceSum > 0 ? hotel.minPriceSum : 980000;
  const viewDetailsLabel = locale === "ru" ? "Подробнее" : locale === "en" ? "Details" : "Batafsil";

  return (
    <UniversalCard
      imageSrc={imageUrl}
      imageAlt={hotel.name}
      showFavorite
      title={hotel.name}
      location={hotel.cityName}
      tags={amenityPills}
      href={`/${locale}/hotels/${hotel.slug}`}
      price={{
        amount: price,
        period: `1 ${labels.perNight}`,
      }}
      actionLabel={viewDetailsLabel}
    />
  );
}


