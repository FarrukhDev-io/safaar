import { Heart } from "lucide-react";
import type { Locale } from "@/i18n/config";
import { formatSum } from "@/lib/utils/money";
import { resolveImage } from "@/lib/images";
import type { HotelListItem, FavoriteView } from "@/types/view";
import { BaseCard } from "@/components/ui/BaseCard";
import { CardFavoriteButton } from "@/components/favorites/CardFavoriteButton";

export function FeaturedHotelCard({
  hotel,
  locale,
  dict,
  userFavorites = [],
  authed = false,
}: {
  hotel: HotelListItem;
  locale: Locale;
  dict: {
    perNight?: string;
    reviews?: string;
    excellent?: string;
    good?: string;
  };
  userFavorites?: FavoriteView[];
  authed?: boolean;
}) {
  const imageUrl = resolveImage(hotel.imageUrl);

  const badge =
    hotel.rating > 0 ? (
      <span className="rounded-lg bg-slate-900/60 px-2 py-0.5 text-xs font-bold text-white backdrop-blur-xs flex items-center gap-1">
        ★ {hotel.rating.toFixed(1)}
      </span>
    ) : undefined;

  const cityNameLower = hotel.cityName.toLowerCase();
  const locationSuffix = 
    cityNameLower === "toshkent" || cityNameLower === "buxoro" || cityNameLower === "samarqand"
      ? ", O'zbekiston" 
      : cityNameLower === "chimgan" 
        ? ", Toshkent viloyati" 
        : "";

  const subInfo = (
    <>
      {hotel.cityName}
      {locationSuffix}
    </>
  );

  let amenitiesText = "Bepul Wi-Fi · Nonushta";
  if (hotel.name.toLowerCase().includes("hilton")) {
    amenitiesText = "Bepul Wi-Fi · Nonushta · Parking";
  } else if (hotel.name.toLowerCase().includes("chimgan")) {
    amenitiesText = "Spa · Basseyn · Restoran";
  } else if (hotel.name.toLowerCase().includes("buxoro") || hotel.name.toLowerCase().includes("bukhara") || hotel.name.toLowerCase().includes("palace")) {
    amenitiesText = "Nonushta · Wi-Fi · 24/7 xizmat";
  }

  return (
    <BaseCard
      imageSrc={imageUrl}
      imageAlt={hotel.name}
      badge={badge}
      title={hotel.name}
      subInfo={subInfo}
      amenities={amenitiesText}
      href={`/${locale}/hotels/${hotel.slug}`}
      footerLeft={
        hotel.minPriceSum > 0 ? (
          <>
            <span className="text-sm font-bold text-slate-950 dark:text-white">
              {formatSum(hotel.minPriceSum)}
            </span>
            <span className="text-[10px] text-slate-400">/ {dict.perNight || "kecha"}</span>
          </>
        ) : undefined
      }
      footerRight={
        <CardFavoriteButton
          targetType="hotel"
          targetId={hotel.id}
          initialFavoriteId={userFavorites?.find((f) => f.targetId === hotel.id)?.id ?? null}
          authed={authed}
          loginHref={`/${locale}/login`}
        />
      }
    />
  );
}
