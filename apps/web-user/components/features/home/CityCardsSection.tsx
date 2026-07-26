import { api } from "@/lib/api";
import type { Locale } from "@/i18n/config";
import type { HomeDict } from "@/i18n/dictionaries";
import { BaseCard } from "@/components/ui/BaseCard";

const KNOWN_CITY_IMAGES: Record<string, string> = {
  toshkent: "/Tashkent-city-skyline.jpeg",
  samarqand: "/Samarkand-Registan-cinematic.jpeg",
  samarkand: "/Samarkand-Registan-cinematic.jpeg",
  buxoro: "/Bukhara-old-city-golden-hour.jpeg",
  bukhara: "/Bukhara-old-city-golden-hour.jpeg",
  xiva: "/Khiva-Ichan-Kala-aerial.jpeg",
  khiva: "/Khiva-Ichan-Kala-aerial.jpeg",
  charvak: "/Charvak-Lake-drone.jpeg",
  chorvoq: "/Charvak-Lake-drone.jpeg",
  chimgan: "/Chimgan-mountains-landscape.jpeg",
  chimgon: "/Chimgan-mountains-landscape.jpeg",
  zaamin: "/Zaamin.jpeg",
  zomin: "/Zaamin.jpeg",
  fargona: "/Uzbekistan-travel.jpeg",
  fergana: "/Uzbekistan-travel.jpeg",
  namangan: "/Uzbekistan-travel.jpeg",
  andijon: "/Uzbekistan-travel.jpeg",
  andijan: "/Uzbekistan-travel.jpeg",
  nukus: "/Uzbekistan-travel.jpeg",
  termez: "/Uzbekistan-travel.jpeg",
  termiz: "/Uzbekistan-travel.jpeg",
};

function getCityImage(imageUrl?: string | null, slug?: string, name?: string): string {
  if (imageUrl && (imageUrl.startsWith("http://") || imageUrl.startsWith("https://") || imageUrl.startsWith("/"))) {
    return imageUrl;
  }
  const slugKey = (slug || "").toLowerCase().trim();
  const nameKey = (name || "").toLowerCase().trim();
  return (
    KNOWN_CITY_IMAGES[slugKey] ??
    KNOWN_CITY_IMAGES[nameKey] ??
    Object.entries(KNOWN_CITY_IMAGES).find(([k]) => slugKey.includes(k) || nameKey.includes(k))?.[1] ??
    "/Uzbekistan-travel.jpeg"
  );
}

export async function CityCardsSection({
  locale,
  dict,
}: {
  locale: Locale;
  dict: HomeDict["popularCities"];
}) {
  const raw = await api.catalog.getPopularCities(locale).catch(() => []);
  const cities = raw
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .slice(0, 8)
    .map((c) => ({
      name: c.name,
      image: getCityImage(c.imageUrl, c.slug, c.name),
      hotelCount: String(c.hotelCount),
      href: `/${locale}/hotels?city_id=${encodeURIComponent(c.slug)}`,
    }))
    .filter((c) => c.name);

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

        <div className="flex gap-3 overflow-x-auto scrollbar-none snap-x snap-mandatory sm:grid sm:grid-cols-4 sm:gap-4 sm:overflow-visible">
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
