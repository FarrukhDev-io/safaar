import Link from "next/link";
import Image from "next/image";
import { Wifi, Coffee, Car, Waves } from "lucide-react";
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

  const nameLower = hotel.name.toLowerCase();
  
  // Dynamic amenities with icons
  const renderAmenities = () => {
    if (nameLower.includes("hilton")) {
      return (
        <>
          <div className="flex items-center gap-1"><Wifi className="h-3 w-3" /> Wi-Fi</div>
          <div className="flex items-center gap-1"><Coffee className="h-3 w-3" /> Nonushta</div>
          <div className="flex items-center gap-1"><Car className="h-3 w-3" /> Parking</div>
        </>
      );
    } else if (nameLower.includes("chimgan")) {
      return (
        <>
          <div className="flex items-center gap-1"><Waves className="h-3 w-3" /> Spa</div>
          <div className="flex items-center gap-1"><Waves className="h-3 w-3" /> Basseyn</div>
          <div className="flex items-center gap-1"><Coffee className="h-3 w-3" /> Restoran</div>
        </>
      );
    }
    return (
      <>
        <div className="flex items-center gap-1"><Coffee className="h-3 w-3" /> Nonushta</div>
        <div className="flex items-center gap-1"><Wifi className="h-3 w-3" /> Wi-Fi</div>
        <span className="text-[10px] sm:text-[11px]">24/7 xizmat</span>
      </>
    );
  };

  const href = `/${locale}/hotels/${hotel.slug}`;

  return (
    <div className="group relative flex h-full overflow-hidden rounded-2xl bg-white border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:bg-slate-900 dark:border-slate-800 p-2">
      
      {/* Left Image Section */}
      <div className="relative aspect-[4/3] sm:aspect-[4/3] w-[45%] sm:w-[200px] shrink-0 overflow-hidden rounded-xl">
        <Image
          src={imageUrl || "/hotel-uzbekistan.jpeg"}
          alt={hotel.name}
          fill
          sizes="(max-width: 640px) 45vw, 200px"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {hotel.rating > 0 && (
          <div className="absolute top-2 left-2 rounded-md bg-slate-900/80 px-1.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-md shadow-sm flex items-center gap-0.5 z-10">
            <span>★</span> {hotel.rating.toFixed(1)}
          </div>
        )}
        <div className="absolute inset-0 bg-black/5 opacity-0 transition-opacity group-hover:opacity-100 pointer-events-none" />
      </div>

      {/* Right Content Section */}
      <div className="flex flex-1 flex-col justify-between py-1 px-3 sm:px-4">
        
        <div>
          <Link href={href} className="absolute inset-0 z-0" aria-label={hotel.name} />
          <h3 className="text-[15px] sm:text-base font-bold text-slate-900 dark:text-white transition-colors group-hover:text-blue-600 line-clamp-2 leading-tight">
            {hotel.name}
          </h3>
          <p className="mt-1 text-[11px] sm:text-xs font-medium text-slate-500 line-clamp-1">
            {hotel.cityName}{locationSuffix}
          </p>

          <div className="mt-2.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[10px] sm:text-[11px] font-semibold text-slate-400">
            {renderAmenities()}
          </div>
        </div>

        <div className="mt-3 flex items-end justify-between gap-2">
          <div className="min-w-0">
            {hotel.minPriceSum > 0 ? (
              <div className="flex items-baseline gap-1 flex-wrap sm:flex-nowrap">
                <span className="text-[13px] sm:text-[15px] font-extrabold text-slate-900 dark:text-white whitespace-nowrap">
                  {formatSum(hotel.minPriceSum)}
                </span>
                <span className="text-[9px] sm:text-[10px] font-medium text-slate-400 whitespace-nowrap">
                  / {dict.perNight || "kecha"}
                </span>
              </div>
            ) : (
              <span className="text-xs font-medium text-slate-400 whitespace-nowrap">Narx yo'q</span>
            )}
          </div>
          <div className="relative z-10 mb-0.5">
            <CardFavoriteButton
              targetType="hotel"
              targetId={hotel.id}
              initialFavoriteId={userFavorites?.find((f) => f.targetId === hotel.id)?.id ?? null}
              authed={authed}
              loginHref={`/${locale}/login`}
            />
          </div>
        </div>
        
      </div>
    </div>
  );
}
