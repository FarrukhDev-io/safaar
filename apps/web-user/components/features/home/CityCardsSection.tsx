import { api } from "@/lib/api";
import type { Locale } from "@/i18n/config";
import type { HomeDict } from "@/i18n/dictionaries";
import { BaseCard } from "@/components/ui/BaseCard";

export async function CityCardsSection({
  locale,
  dict,
}: {
  locale: Locale;
  dict: HomeDict["popularCities"];
}) {
  const raw = await api.catalog.getPopularCities(locale);
  const cities = raw
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .slice(0, 8)
    .map((city) => ({
      name: city.name,
      image: city.imageUrl,
      hotelCount: String(city.hotelCount),
      href: `/${locale}/hotels?city_id=${encodeURIComponent(city.slug)}`,
    }))
    .filter((city) => city.name && city.image);

  if (cities.length === 0) return null;

  return (
    <section aria-labelledby="city-cards-heading">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="mb-4 sm:mb-6">
          <h2
            id="city-cards-heading"
            className="text-xl font-black tracking-tight text-slate-900 sm:text-2xl dark:text-white"
          >
            {dict.title}
          </h2>
          <p className="mt-0.5 text-xs font-semibold text-slate-600 sm:mt-1 sm:text-sm dark:text-slate-400">
            {dict.subtitle}
          </p>
        </div>

        <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto scrollbar-none sm:grid sm:grid-cols-4 sm:gap-4 sm:overflow-visible">
          {cities.map((city) => (
            <div key={city.name} className="w-1/2 shrink-0 snap-start sm:w-auto">
              <BaseCard
                variant="overlay"
                imageSrc={city.image}
                imageAlt={city.name}
                title={city.name}
                subInfo={`${city.hotelCount} ${dict.hotels}`}
                href={city.href}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
