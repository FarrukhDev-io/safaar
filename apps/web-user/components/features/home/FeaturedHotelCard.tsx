"use client";

import type { Locale } from "@/i18n/config";
import { resolveImage } from "@/lib/images";
import type { HotelListItem } from "@/types/view";
import { UniversalCard } from "@/components/ui/UniversalCard";
import { useFavoriteToggle } from "@/components/features/favorites/useFavoriteToggle";

export function FeaturedHotelCard({
  hotel,
  locale,
  dict,
  authed = false,
  favoriteId = null,
  loginHref = `/${locale}/login`,
}: {
  hotel: HotelListItem;
  locale: Locale;
  dict: {
    perNight?: string;
    reviews?: string;
    excellent?: string;
    good?: string;
  };
  authed?: boolean;
  favoriteId?: string | null;
  loginHref?: string;
}) {
  const imageUrl = resolveImage(hotel.imageUrl);
  const favorite = useFavoriteToggle({
    targetType: "hotel",
    targetId: hotel.id,
    initialFavoriteId: favoriteId,
    authed,
    loginHref,
  });
  const amenityPills = ["Wi-Fi", "Nonushta", "Spa"];
  const viewDetailsLabel = locale === "ru" ? "Подробнее" : locale === "en" ? "Details" : "Batafsil";

  return (
    <UniversalCard
      imageSrc={imageUrl}
      imageAlt={hotel.name}
      showFavorite
      isFavorite={favorite.isFavorite}
      favoritePending={favorite.pending}
      onFavoriteToggle={favorite.toggle}
      title={hotel.name}
      location={hotel.cityName}
      tags={amenityPills}
      href={`/${locale}/hotels/${hotel.slug}`}
      price={
        hotel.minPriceSum > 0
          ? {
              amount: hotel.minPriceSum,
              period: `1 ${dict.perNight || "kecha"}`,
            }
          : undefined
      }
      actionLabel={viewDetailsLabel}
    />
  );
}

