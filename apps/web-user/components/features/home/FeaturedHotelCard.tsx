import Link from "next/link";
import Image from "next/image";
import type { Locale } from "@/i18n/config";
import { formatSum } from "@/lib/utils/money";
import { resolveImage } from "@/lib/images";
import type { HotelListItem, FavoriteView } from "@/types/view";
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
  dict: { perNight?: string; reviews?: string; excellent?: string; good?: string; };
  userFavorites?: FavoriteView[];
  authed?: boolean;
}) {
  const imageUrl = resolveImage(hotel.imageUrl);
  const cityNameLower = hotel.cityName.toLowerCase();
  
  const locationSuffix = 
    cityNameLower === "toshkent" || cityNameLower === "buxoro" || cityNameLower === "samarqand"
      ? ", O'zbekiston" 
      : cityNameLower === "chimgan" 
        ? ", Toshkent viloyati" 
        : "";

  let amenitiesText = "Bepul Wi-Fi · Nonushta";
  if (hotel.name.toLowerCase().includes("hilton")) {
    amenitiesText = "Wi-Fi · Nonushta · Parking";
  } else if (hotel.name.toLowerCase().includes("chimgan")) {
    amenitiesText = "Spa · Basseyn · Restoran";
  } else if (hotel.name.toLowerCase().includes("buxoro") || hotel.name.toLowerCase().includes("bukhara")) {
    amenitiesText = "Nonushta · Wi-Fi · 24/7 xizmat";
  }

  const href = `/${locale}/hotels/${hotel.slug}`;

  return (
    <div className="group relative flex flex-col sm:flex-row overflow-hidden rounded-[20px] bg-white border border-slate-100 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:bg-slate-900 dark:border-slate-800">
      
      {/* Left Image Section */}
      <div className="relative aspect-[4/3] w-full sm:w-[280px] shrink-0 overflow-hidden">
        <Image
          src={imageUrl || "/hotel-uzbekistan.jpeg"}
          alt={hotel.name}
          fill
          sizes="(max-width: 640px) 100vw, 280px"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {hotel.rating > 0 && (
          <div className="absolute top-3 left-3 rounded-lg bg-white/90 px-2 py-1 text-xs font-bold text-slate-900 backdrop-blur-md dark:bg-slate-900/90 dark:text-white shadow-sm flex items-center gap-1 z-10">
            <span className="text-[#F59E0B]">★</span> {hotel.rating.toFixed(1)}
          </div>
        )}
        <div className="absolute inset-0 bg-black/5 opacity-0 transition-opacity group-hover:opacity-100 pointer-events-none" />
      </div>

      {/* Right Content Section */}
      <div className="flex flex-1 flex-col p-5">
        
        <div className="flex justify-between items-start gap-4">
          <div>
            <Link href={href} className="absolute inset-0 z-0" aria-label={hotel.name} />
            <h3 className="text-xl font-bold text-slate-900 dark:text-white transition-colors group-hover:text-blue-600 line-clamp-1">
              {hotel.name}
            </h3>
            <p className="mt-1 text-sm font-medium text-slate-500 line-clamp-1">
              {hotel.cityName}{locationSuffix}
            </p>
          </div>
          <div className="relative z-10">
            <CardFavoriteButton
              targetType="hotel"
              targetId={hotel.id}
              initialFavoriteId={userFavorites?.find((f) => f.targetId === hotel.id)?.id ?? null}
              authed={authed}
              loginHref={`/${locale}/login`}
            />
          </div>
        </div>

        <div className="mt-3">
          <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
            {amenitiesText}
          </p>
        </div>

        <div className="mt-auto pt-4 flex items-end justify-between border-t border-slate-100 dark:border-slate-800">
          <div>
            {hotel.minPriceSum > 0 ? (
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-bold text-slate-900 dark:text-white">
                  {formatSum(hotel.minPriceSum)}
                </span>
                <span className="text-xs font-medium text-slate-500">
                  / {dict.perNight || "kecha"}
                </span>
              </div>
            ) : (
              <span className="text-sm font-medium text-slate-400">Narx mavjud emas</span>
            )}
          </div>
        </div>
        
      </div>
    </div>
  );
}
