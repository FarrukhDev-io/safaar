import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { api } from "@/lib/api";
import { SearchBar } from "@/components/search/SearchBar";
import { Hero } from "@/components/features/home/Hero";
import { CityCardsSection } from "@/components/features/home/CityCardsSection";

import { FeaturedHotelsCarousel } from "@/components/features/home/FeaturedHotelsCarousel";
import { DealsSection, type DealItem } from "@/components/features/home/DealsSection";

import type { HotelListItem } from "@/types/view";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const dict = await getDictionary(lang, "home");
  return { title: dict.hero.title, description: dict.hero.subtitle };
}

const FEATURED_FALLBACK: HotelListItem[] = [
  { id: "mock-f1", slug: "tashkent-city-palace", name: "Tashkent City Palace", cityName: "Toshkent", stars: 5, rating: 4.8, reviewsCount: 234, minPriceSum: 650000, imageUrl: "/Tashkent-city-skyline.jpeg" },
  { id: "mock-f2", slug: "samarkand-plaza", name: "Samarkand Plaza", cityName: "Samarqand", stars: 5, rating: 4.7, reviewsCount: 189, minPriceSum: 520000, imageUrl: "/Samarkand-Registan-cinematic.jpeg" },
  { id: "mock-f3", slug: "grand-bukhara", name: "Grand Bukhara Hotel", cityName: "Buxoro", stars: 4, rating: 4.6, reviewsCount: 312, minPriceSum: 380000, imageUrl: "/Bukhara-old-city-golden-hour.jpeg" },
  { id: "mock-f4", slug: "khiva-ichan-kala", name: "Ichan-Kala Premier", cityName: "Xiva", stars: 4, rating: 4.9, reviewsCount: 156, minPriceSum: 450000, imageUrl: "/Khiva-Ichan-Kala-aerial.jpeg" },
];

export default async function HomePage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const locale = lang as Locale;

  const [common, dict, [citiesRes, featuredRes, dealsRes]] = await Promise.all([
    getDictionary(locale, "common"),
    getDictionary(locale, "home"),
    Promise.allSettled([
      api.catalog.getCities(locale),
      api.hotels.getFeaturedHotels(locale, { limit: 4 }),
      api.cms.getDeals(locale),
    ]),
  ]);

  const cities = citiesRes.status === "fulfilled" ? citiesRes.value : [];
  const featuredResult = featuredRes.status === "fulfilled" ? featuredRes.value : null;
  const rawDeals = dealsRes.status === "fulfilled" ? dealsRes.value : [];

  const fromApi = featuredResult?.items ?? [];
  const hotels: HotelListItem[] = [...fromApi];
  for (const fallback of FEATURED_FALLBACK) {
    if (hotels.length >= 4) break;
    if (hotels.some((h) => h.id === fallback.id || h.slug === fallback.slug)) continue;
    hotels.push(fallback);
  }

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
          <section id="search-section" className="bg-transparent pb-10 pt-6 sm:pb-14 sm:pt-8">
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
                  className="shrink-0 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-800 shadow-xs transition-all duration-150 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-700 active:scale-95 sm:px-5 sm:py-2.5 sm:text-sm"
                >
                  {city.name}
                </Link>
              ))}
            </div>
          )}
        </div>

        {hotels.length > 0 && (
          <Suspense fallback={<div className="h-48 w-full animate-pulse bg-slate-100 dark:bg-slate-900" />}>
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
        <Suspense fallback={<div className="h-64 w-full animate-pulse bg-slate-100 dark:bg-slate-900" />}>
          <DealsSection deals={deals} dict={dict.deals} locale={locale} />
        </Suspense>
      </div>

      {/* EKRAN 4: City Cards */}
      <div className="py-10 sm:py-16 md:py-20">
        <Suspense fallback={<div className="h-64 w-full animate-pulse bg-slate-100 dark:bg-slate-900" />}>
          <CityCardsSection locale={locale} dict={dict.popularCities} />
        </Suspense>
      </div>




    </main>
  );
}
