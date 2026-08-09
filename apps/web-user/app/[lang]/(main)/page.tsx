import type { Metadata } from 'next';
import { Suspense } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { isLocale, type Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';
import { api } from '@/lib/api';
import { SearchBar } from '@/components/search/SearchBar';
import { Hero } from '@/components/features/home/Hero';
import { CityCardsSection } from '@/components/features/home/CityCardsSection';

import { FeaturedHotelsCarousel } from '@/components/features/home/FeaturedHotelsCarousel';
import {
  DealsSection,
  type DealItem,
} from '@/components/features/home/DealsSection';
import { PromoCodesSectionLive } from '@/components/features/home/PromoCodesSectionLive';
import { Skeleton } from '@/components/ui/Skeleton';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const dict = await getDictionary(lang, 'home');
  return { title: dict.hero.title, description: dict.hero.subtitle };
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const locale = lang as Locale;

  const [common, dict, cities, featuredResult, rawDeals, , promos] =
    await Promise.all([
      getDictionary(locale, 'common'),
      getDictionary(locale, 'home'),
      api.catalog.getCities(locale),
      api.hotels.getFeaturedHotels(locale, { limit: 4 }),
      api.cms.getDeals(locale),
      api.cms.getPublicStats().catch(() => null),
      api.promos.listActive().catch(() => []),
    ]);

  const hotels = featuredResult.items;

  const deals: DealItem[] = rawDeals.map((d) => ({
    id: d.id,
    slug: d.slug,
    name: d.name,
    cityName: d.cityName,
    imageUrl: d.imageUrl,
    oldPriceSum: d.oldPriceSum,
    newPriceSum: d.newPriceSum,
    discountPercent: d.discountPercent,
    endsAt: d.endsAt,
  }));

  return (
    <main className="relative flex flex-1 flex-col">
      {/* EKRAN 1: Hero + SearchBar + Featured Hotels */}
      <div className="flex min-h-svh flex-col justify-between">
        <Hero dict={dict.hero} />

        <div className="relative z-40">
          <section
            id="search-section"
            className="bg-transparent pb-10 pt-6 sm:pb-14 sm:pt-8"
          >
            <div className="mx-auto max-w-4xl px-4">
              <SearchBar locale={locale} dict={common.search} cities={cities} />
            </div>
          </section>

          {cities.length > 0 && (
            <div className="mx-auto mt-4 flex max-w-5xl flex-nowrap items-center justify-start sm:justify-center gap-1.5 overflow-x-auto px-4 sm:mt-6 sm:gap-2 pb-1 scrollbar-none">
              {cities.slice(0, 8).map((city) => (
                <Link
                  key={city.id}
                  href={`/${locale}/hotels?city_id=${encodeURIComponent(city.id)}`}
                  className="shrink-0 rounded-full border border-slate-200 bg-card px-3.5 py-1.5 text-xs font-bold text-slate-800 shadow-xs transition-all duration-150 hover:border-primary-500 hover:bg-primary-50 hover:text-primary-700 active:scale-95 sm:px-5 sm:py-2.5 sm:text-sm"
                >
                  {city.name}
                </Link>
              ))}
            </div>
          )}
        </div>

        {hotels.length > 0 && (
          <Suspense fallback={<Skeleton className="h-48 w-full" />}>
            <FeaturedHotelsCarousel
              hotels={hotels}
              dict={dict.featured}
              locale={locale}
            />
          </Suspense>
        )}
      </div>

      {/* EKRAN 2: Chegirmadagi takliflar */}
      <div className="py-10 sm:py-14">
        <Suspense fallback={<Skeleton className="h-64 w-full" />}>
          <DealsSection deals={deals} dict={dict.deals} locale={locale} />
        </Suspense>
      </div>

      {/* EKRAN 3: Promo-kodlar (real-time) */}
      <PromoCodesSectionLive initialPromos={promos} />

      {/* EKRAN 4: City Cards */}
      <div className="py-10 sm:py-16 md:py-20">
        <Suspense fallback={<Skeleton className="h-64 w-full" />}>
          <CityCardsSection locale={locale} dict={dict.popularCities} />
        </Suspense>
      </div>
    </main>
  );
}
