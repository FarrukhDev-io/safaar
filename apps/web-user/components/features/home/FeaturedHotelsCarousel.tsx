import Link from "next/link";
import { FeaturedHotelCard } from "./FeaturedHotelCard";
import { FeaturedHotelsMobileCarousel } from "./FeaturedHotelsMobileCarousel";
import type { HotelListItem } from "@/types/view";
import type { Locale } from "@/i18n/config";
import type { HomeDict } from "@/i18n/dictionaries";

export function FeaturedHotelsCarousel({
  hotels,
  dict,
  locale,
}: {
  hotels: HotelListItem[];
  dict: HomeDict["featured"];
  locale: Locale;
}) {
  const cards = hotels;

  if (cards.length === 0) return null;

  return (
    <section className="mx-auto mt-6 w-full md:w-[96%] max-w-[1536px] px-3 sm:px-4 md:px-8 relative sm:mt-8">
      <div className="mb-3 flex items-center justify-between gap-4">
        <h2 className="text-base font-bold tracking-tight sm:text-lg">
          {dict.title}
        </h2>
        <div className="flex items-center gap-2">
          <Link
            href={`/${locale}/hotels`}
            className="shrink-0 text-xs font-semibold text-primary-600 transition-colors hover:text-primary-700 sm:text-sm"
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
            className="w-[85vw] max-w-[320px] sm:w-[calc(50%-0.375rem)] shrink-0 snap-start"
          >
            <FeaturedHotelCard hotel={hotel} locale={locale} dict={dict} />
          </div>
        ))}
      </FeaturedHotelsMobileCarousel>

      {/* Desktop: 4 cards grid */}
      <div className="hidden gap-4 md:grid md:grid-cols-4">
        {cards.map((hotel) => (
          <FeaturedHotelCard key={hotel.id} hotel={hotel} locale={locale} dict={dict} />
        ))}
      </div>
    </section>
  );
}
