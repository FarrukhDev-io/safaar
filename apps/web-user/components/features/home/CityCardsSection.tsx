import { EmptyState } from "@/components/ui/EmptyState";
import { MapPin } from "lucide-react";
import { api } from "@/lib/api";
import type { Locale } from "@/i18n/config";
import type { HomeDict } from "@/i18n/dictionaries";
import { AccordionGallery } from "@/components/ui/AccordionGalleryClient";
import { CityCardsMobileCarousel } from "@/components/features/home/CityCardsMobileCarousel";
import { SectionHeader } from "@/components/ui/SectionHeader";

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
      image: city.imageUrl || "/Tashkent-skyline-night.jpeg", // Backendda rasm yo'q bo'lsa, fallback rasm qo'yamiz
      hotelCount: String(city.hotelCount),
      href: `/${locale}/hotels?city_id=${encodeURIComponent(city.slug)}`,
    }))
    .filter((city) => city.name && city.image);

  const galleryItems = cities.map((city) => ({
    image: city.image,
    label: `${city.name} • ${city.hotelCount} ${dict.hotels}`,
    link: city.href,
    alt: city.name,
  }));

  return (
    <section aria-labelledby="city-cards-heading">
      <div className="mx-auto w-full md:w-[96%] max-w-[1536px] px-3 sm:px-4 md:px-8">
        <SectionHeader 
          title={dict.title}
          subtitle={dict.subtitle}
        />

        {cities.length === 0 ? (
          <div className="mt-6">
            <EmptyState 
              icon={<MapPin className="h-10 w-10 text-slate-400 dark:text-slate-500" />}
              title={(dict as any).empty || "Hozircha bo'sh"} 
              description="Ayni paytda mashhur shaharlar ruyxati shakllanmoqda." 
            />
          </div>
        ) : (
          <>
            {/* Desktop — Accordion Gallery */}
            <div className="hidden sm:block mt-6 sm:mt-8 w-full max-w-full overflow-hidden">
              <AccordionGallery
                items={galleryItems}
                height={400}
                accentColor="#0284c7"
                expandRatio={0.5}
                grayscale={false}
              />
            </div>

            {/* Mobile — Swipeable Carousel */}
            <div className="sm:hidden mt-4">
              <CityCardsMobileCarousel items={galleryItems} />
            </div>
          </>
        )}
      </div>
    </section>
  );
}
