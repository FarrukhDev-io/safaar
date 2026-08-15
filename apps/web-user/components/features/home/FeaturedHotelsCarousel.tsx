import Link from "next/link";
import { FeaturedHotelCard } from "./FeaturedHotelCard";
import { FeaturedHotelsMobileCarousel } from "./FeaturedHotelsMobileCarousel";
import type { HotelListItem, FavoriteView } from "@/types/view";
import type { Locale } from "@/i18n/config";
import type { HomeDict } from "@/i18n/dictionaries";

export function FeaturedHotelsCarousel({
  hotels,
  dict,
  locale,
  userFavorites = [],
  authed = false,
}: {
  hotels: HotelListItem[];
  dict: HomeDict["featured"];
  locale: Locale;
  userFavorites?: FavoriteView[];
  authed?: boolean;
}) {
  const cards = hotels;

  if (cards.length === 0) return null;

  return (
    <section className="mx-auto mt-10 w-full max-w-5xl px-4 sm:mt-14 relative">
      <div className="mb-4 sm:mb-5">
        <h2 className="text-xl font-black tracking-tight sm:text-2xl text-slate-900 dark:text-white">
          {dict.title}
        </h2>
        <div className="flex items-center justify-between gap-4 mt-1">
          <p className="text-xs font-semibold text-slate-600 sm:text-sm dark:text-slate-400">
            Foydalanuvchilar tomonidan eng ko'p tanlangan joylar
          </p>
          <Link
            href={`/${locale}/hotels`}
            className="shrink-0 text-xs font-bold text-blue-650 transition-colors hover:text-blue-750 sm:text-sm flex items-center gap-1"
          >
            {dict.all} →
          </Link>
        </div>
      </div>
      
      {/* Mobile: horizontal scroll with client wrapper for buttons and scroll logic */}
      <FeaturedHotelsMobileCarousel itemsCount={cards.length}>
        {cards.map((hotel) => (
          <div
            key={hotel.id}
            className="w-[calc(50%-0.375rem)] shrink-0 snap-start"
          >
            <FeaturedHotelCard 
              hotel={hotel} 
              locale={locale} 
              dict={dict} 
              userFavorites={userFavorites}
              authed={authed}
            />
          </div>
        ))}
      </FeaturedHotelsMobileCarousel>

      {/* Desktop: 4 cards grid */}
      <div className="hidden gap-5 sm:grid sm:grid-cols-3 lg:grid-cols-3">
        {cards.slice(0, 3).map((hotel) => (
          <FeaturedHotelCard 
            key={hotel.id} 
            hotel={hotel} 
            locale={locale} 
            dict={dict} 
            userFavorites={userFavorites}
            authed={authed}
          />
        ))}
      </div>
    </section>
  );
}
