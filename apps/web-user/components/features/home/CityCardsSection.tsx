import { api } from "@/lib/api";
import type { Locale } from "@/i18n/config";
import type { HomeDict } from "@/i18n/dictionaries";
import AccordionGallery from "@/components/ui/AccordionGallery";

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
    .slice(0, 5)
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

        <div className="mt-6 sm:mt-8 w-full max-w-full overflow-hidden">
          <AccordionGallery
            items={cities.map(city => ({
              image: city.image,
              label: `${city.name} • ${city.hotelCount} ${dict.hotels}`,
              link: city.href,
              alt: city.name,
            }))}
            height={400}
            accentColor="#0284c7"
            expandRatio={0.5}
          />
        </div>
      </div>
    </section>
  );
}
