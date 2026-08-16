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
    <section className="mx-auto mt-10 w-full max-w-[1400px] px-4 lg:px-8 sm:mt-14 relative z-10 pb-20">
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl text-slate-900 dark:text-white">
            {dict.title}
          </h2>
          <p className="mt-2 text-sm font-medium text-slate-600 sm:text-base dark:text-slate-400">
            Foydalanuvchilar tomonidan eng ko'p tanlangan joylar
          </p>
        </div>
        <Link
          href={`/${locale}/hotels`}
          className="shrink-0 text-sm font-bold text-[#2563EB] transition-colors hover:text-[#1D4ED8] flex items-center gap-1 pb-1"
        >
          Barchasini ko'rish →
        </Link>
      </div>
      
      {/* Mobile: horizontal scroll */}
      <FeaturedHotelsMobileCarousel itemsCount={cards.length}>
        {cards.map((hotel) => (
          <div
            key={hotel.id}
            className="w-[85vw] sm:w-[350px] shrink-0 snap-start"
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

      {/* Desktop: 3 cards grid */}
      <div className="hidden gap-6 sm:grid lg:grid-cols-3">
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
