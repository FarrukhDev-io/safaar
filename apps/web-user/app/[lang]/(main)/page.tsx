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
import { Skeleton } from "@/components/ui/Skeleton";
import { buttonVariants } from "@/components/ui/button-variants";
import { CategoryPills } from "@/components/features/home/CategoryPills";

import { getSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

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

export default async function HomePage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const locale = lang as Locale;

  const session = await getSession();

  const [common, dict, cities, featuredResult, rawDeals] = await Promise.all([
    getDictionary(locale, "common"),
    getDictionary(locale, "home"),
    api.catalog.getCities(locale),
    api.hotels.getFeaturedHotels(locale, { limit: 10 }),
    api.cms.getDeals(locale),
    api.cms.getPublicStats().catch(() => null),
  ]);

  const userFavorites = session
    ? await api.users.getFavorites({ token: session.accessToken }).catch(() => [])
    : [];

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
          <section id="search-section" className="relative z-50 bg-transparent -mt-20 sm:-mt-28 pb-4 pt-2">
            <div className="mx-auto max-w-[1400px] px-4 lg:px-8">
              <SearchBar locale={locale} dict={common.search} cities={cities} />
            </div>
          </section>

          <CategoryPills locale={locale} />
        </div>

        {hotels.length > 0 && (
          <Suspense fallback={<Skeleton className="h-48 w-full" />}>
            <FeaturedHotelsCarousel
              hotels={hotels}
              dict={dict.featured}
              locale={locale}
              userFavorites={userFavorites}
              authed={!!session}
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



      {/* EKRAN 4: City Cards */}
      <div className="py-10 sm:py-16 md:py-20">
        <Suspense fallback={<Skeleton className="h-64 w-full" />}>
          <CityCardsSection locale={locale} dict={dict.popularCities} />
        </Suspense>
      </div>




    </main>
  );
}
