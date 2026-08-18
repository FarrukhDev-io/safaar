import { api } from "@/lib/api";
import type { Locale } from "@/i18n/config";
import type { HomeDict } from "@/i18n/dictionaries";
import { AccordionGallery } from "@/components/ui/AccordionGalleryClient";
import { CityCardsMobileCarousel } from "@/components/features/home/CityCardsMobileCarousel";
import SoftBlurIn from "@/components/animata/text/soft-blur-in";

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

  const galleryItems = cities.map((city) => ({
    image: city.image,
    label: `${city.name} • ${city.hotelCount} ${dict.hotels}`,
    link: city.href,
    alt: city.name,
  }));

  return (
    <section aria-labelledby="city-cards-heading">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
        <div className="mb-4 sm:mb-6">
          <div className="text-xl font-black tracking-tight text-slate-900 sm:text-2xl dark:text-white">
            <SoftBlurIn text={dict.title} className="h-8 sm:h-10" holdMs={999999} />
          </div>
          <p className="mt-0.5 text-xs font-semibold text-slate-600 sm:mt-1 sm:text-sm dark:text-slate-400">
            {dict.subtitle}
          </p>
        </div>

        {/* Desktop — Accordion Gallery */}
        <div className="hidden sm:block mt-6 sm:mt-8 w-full max-w-full overflow-hidden">
          <AccordionGallery
            items={galleryItems}
            height={400}
            accentColor="#0284c7"
            expandRatio={0.5}
          />
        </div>

        {/* Mobile — Swipeable Carousel */}
        <div className="sm:hidden mt-4">
          <CityCardsMobileCarousel items={galleryItems} />
        </div>
      </div>
    </section>
  );
}
