import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { api, ApiRequestError } from "@/lib/api";
import { getSession } from "@/lib/auth/session";
import { formatSum } from "@/lib/money";
import { HotelGallery } from "@/components/hotels/HotelGallery";
import { RoomList } from "@/components/hotels/RoomList";
import { ReviewsList } from "@/components/reviews/ReviewsList";
import { FavoriteButton } from "@/components/favorites/FavoriteButton";
import { BackButton } from "@/components/ui/BackButton";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Star, MapPin, Wifi, Waves, Car, Utensils, ShieldCheck } from "lucide-react";
import type { HotelDetail } from "@/types/view";

type SearchParams = Record<string, string | string[] | undefined>;

function one(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function num(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

const AMENITY_ICONS: Record<string, typeof Wifi> = {
  wifi: Wifi,
  pool: Waves,
  parking: Car,
  restaurant: Utensils,
  security: ShieldCheck,
};

const BADGE_TRANSLATIONS: Record<Locale, Record<string, string>> = {
  uz: {
    wifi: "Bepul Wi-Fi",
    pool: "Hovuz",
    parking: "Bepul turargoh",
    restaurant: "Restoran",
    security: "Xavfsizlik xizmati",
  },
  ru: {
    wifi: "Бесплатный Wi-Fi",
    pool: "Бассейн",
    parking: "Бесплатная парковка",
    restaurant: "Ресторан",
    security: "Служба безопасности",
  },
  en: {
    wifi: "Free Wi-Fi",
    pool: "Swimming pool",
    parking: "Free parking",
    restaurant: "Restaurant",
    security: "Security service",
  },
};

/* ─── Mock Fallback Data ─────────────────────────────────────────── */
const MOCK_HOTELS_DETAIL: Record<string, HotelDetail> = {
  "khiva-ichan-kala": {
    id: "mock-h-1",
    slug: "khiva-ichan-kala",
    name: "Khiva Ichan Kala Hotel",
    cityName: "Xiva",
    stars: 4,
    rating: 4.8,
    reviewsCount: 120,
    minPriceSum: 450000,
    imageUrl: "/Khiva-Ichan-Kala-aerial.jpeg",
    description: "Qadimiy Ichan Qal'a markazida joylagan, an'anaviy uslubdagi shinam mehmonxona. Tarixiy obidalarga piyoda masofa.",
    address: "Ichan Qal'a, Xiva, O'zbekiston",
    amenities: ["wifi", "restaurant", "security"],
    images: ["/Khiva-Ichan-Kala-aerial.jpeg", "/Samarkand-Registan-cinematic.jpeg"],
    latitude: 41.3783,
    longitude: 60.3639,
    checkInTime: "14:00",
    checkOutTime: "12:00",
    rooms: [
      { id: "mock-r-1", name: "Standart Ikki Kishilik Xona", priceSum: 450000, capacity: 2, available: 3 },
      { id: "mock-r-2", name: "Lyuks Xona", priceSum: 800000, capacity: 2, available: 1 },
    ],
  },
  "xiva-ichan-kala-hotel": {
    id: "mock-h-1",
    slug: "xiva-ichan-kala-hotel",
    name: "Khiva Ichan Kala Hotel",
    cityName: "Xiva",
    stars: 4,
    rating: 4.8,
    reviewsCount: 120,
    minPriceSum: 450000,
    imageUrl: "/Khiva-Ichan-Kala-aerial.jpeg",
    description: "Qadimiy Ichan Qal'a markazida joylashgan, an'anaviy uslubdagi shinam mehmonxona. Tarixiy obidalarga piyoda masofa.",
    address: "Ichan Qal'a, Xiva, O'zbekiston",
    amenities: ["wifi", "restaurant", "security"],
    images: ["/Khiva-Ichan-Kala-aerial.jpeg", "/Samarkand-Registan-cinematic.jpeg"],
    latitude: 41.3783,
    longitude: 60.3639,
    checkInTime: "14:00",
    checkOutTime: "12:00",
    rooms: [
      { id: "mock-r-1", name: "Standart Ikki Kishilik Xona", priceSum: 450000, capacity: 2, available: 3 },
      { id: "mock-r-2", name: "Lyuks Xona", priceSum: 800000, capacity: 2, available: 1 },
    ],
  },
  "tashkent-city-palace": {
    id: "mock-h-2",
    slug: "tashkent-city-palace",
    name: "Tashkent City Palace",
    cityName: "Toshkent",
    stars: 5,
    rating: 4.9,
    reviewsCount: 250,
    minPriceSum: 1200000,
    imageUrl: "/Tashkent-city-skyline.jpeg",
    description: "Toshkent markazidagi hashamatli mehmonxona. Premium xizmat ko'rsatish va shahar manzarasi.",
    address: "Amir Temur ko'chasi, Toshkent, O'zbekiston",
    amenities: ["wifi", "pool", "parking", "restaurant", "security"],
    images: ["/Tashkent-city-skyline.jpeg", "/Charvak-Lake-drone.jpeg"],
    latitude: 41.3111,
    longitude: 69.2797,
    checkInTime: "14:00",
    checkOutTime: "12:00",
    rooms: [
      { id: "mock-r-3", name: "Deluxe Superior King Room", priceSum: 1200000, capacity: 2, available: 5 },
      { id: "mock-r-4", name: "Executive Suite", priceSum: 2200000, capacity: 3, available: 2 },
    ],
  },
  "samarkand-plaza": {
    id: "mock-h-3",
    slug: "samarkand-plaza",
    name: "Samarkand Plaza Hotel",
    cityName: "Samarqand",
    stars: 4,
    rating: 4.7,
    reviewsCount: 180,
    minPriceSum: 750000,
    imageUrl: "/Samarkand-Registan-cinematic.jpeg",
    description: "Samarqandning nufuzli hududida joylashgan, yuqori darajadagi qulaylikka ega bo'lgan zamonaviy mehmonxona.",
    address: "Dagbitskaya ko'chasi, Samarqand, O'zbekiston",
    amenities: ["wifi", "pool", "parking", "restaurant"],
    images: ["/Samarkand-Registan-cinematic.jpeg", "/Charvak-Lake-drone.jpeg"],
    latitude: 39.6542,
    longitude: 66.9589,
    checkInTime: "14:00",
    checkOutTime: "12:00",
    rooms: [
      { id: "mock-r-5", name: "Standard Twin Room", priceSum: 750000, capacity: 2, available: 2 },
      { id: "mock-r-6", name: "Junior Suite", priceSum: 1100000, capacity: 2, available: 1 },
    ],
  },
  "grand-bukhara": {
    id: "mock-h-4",
    slug: "grand-bukhara",
    name: "Grand Bukhara Hotel",
    cityName: "Buxoro",
    stars: 4,
    rating: 4.6,
    reviewsCount: 95,
    minPriceSum: 600000,
    imageUrl: "/Bukhara-old-city-golden-hour.jpeg",
    description: "Eski shahar manzarasi va Kalon minorasiga yaqin masofada joylashgan an'anaviy va shinam mehmonxona.",
    address: "Ibrohim Mo'minov ko'chasi, Buxoro, O'zbekiston",
    amenities: ["wifi", "restaurant", "security"],
    images: ["/Bukhara-old-city-golden-hour.jpeg", "/Samarkand-Registan-cinematic.jpeg"],
    latitude: 39.7747,
    longitude: 64.4286,
    checkInTime: "14:00",
    checkOutTime: "12:00",
    rooms: [
      { id: "mock-r-7", name: "Standard Double Room", priceSum: 600000, capacity: 2, available: 3 },
      { id: "mock-r-8", name: "Family Suite", priceSum: 1000000, capacity: 4, available: 1 },
    ],
  },
};

const getCachedHotel = cache(async (locale: Locale, slug: string): Promise<HotelDetail | 404 | null> => {
  try {
    const res = await api.hotels.getHotel(locale, slug);
    return res;
  } catch (error: unknown) {
    if (MOCK_HOTELS_DETAIL[slug]) {
      return MOCK_HOTELS_DETAIL[slug];
    }
    if (error instanceof ApiRequestError && error.statusCode === 404) {
      return 404 as const;
    }
    return null;
  }
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}): Promise<Metadata> {
  const { lang, slug } = await params;
  const locale = isLocale(lang) ? lang : "uz";
  const hotel = await getCachedHotel(locale, slug);
  if (!hotel || hotel === 404) return {};
  return {
    title: `${hotel.name} — Safaar`,
    description: hotel.description,
  };
}

export default async function HotelDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string; slug: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { lang, slug } = await params;
  const locale = isLocale(lang) ? lang : "uz";
  const sp = await searchParams;

  const [hotel, dict, favDict, reviewsDict, session, amenitiesRes] = await Promise.all([
    getCachedHotel(locale, slug),
    getDictionary(locale, "hotelDetail"),
    getDictionary(locale, "favorites"),
    getDictionary(locale, "reviews"),
    getSession(),
    api.catalog.getAmenities(locale).catch(() => []),
  ]);

  if (hotel === 404) {
    notFound();
  }

  if (!hotel) {
    return (
      <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-16">
        <p className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-800 shadow-btn dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300">
          {dict.error || "Xatolik yuz berdi. Iltimos qayta urinib ko'ring."}
        </p>
      </main>
    );
  }

  const [favoriteId, reviews] = await Promise.all([
    session
      ? api.users.findFavoriteId(hotel.id, { token: session.accessToken }).catch(() => null)
      : Promise.resolve(null),
    api.reviews.getHotelReviews(hotel.id).catch(() => []),
  ]);

  const amenityName = new Map<string, string>(
    amenitiesRes.map((a: { id: string; name: string }) => [a.id, a.name])
  );

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6">
      {/* Navigation Header */}
      <div className="flex items-center justify-between">
        <BackButton />
        <FavoriteButton
          targetType="hotel"
          targetId={hotel.id}
          initialFavoriteId={favoriteId}
          authed={!!session}
          loginHref={`/${locale}/login?next=${encodeURIComponent(
            `/${locale}/hotels/${slug}`,
          )}`}
          dict={favDict}
        />
      </div>

      {/* Bento Photo Gallery */}
      <HotelGallery images={hotel.images || []} alt={hotel.name || "Mehmonxona"} />

      {/* Title & Trust Header */}
      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
              {hotel.name}
            </h1>
            <p className="mt-1 flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400">
              <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
              {hotel.cityName}
              {hotel.address ? ` · ${hotel.address}` : ""}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {(hotel.rating || 0) > 0 && (
              <Badge variant="outline" className="gap-1 px-3 py-1 text-sm text-amber-700 dark:text-amber-400">
                <Star className="h-4 w-4 fill-current text-amber-500" />
                {hotel.rating.toFixed(1)}
              </Badge>
            )}
            {(hotel.stars || 0) > 0 && (
              <span className="text-sm text-amber-500 font-bold">
                {"★".repeat(hotel.stars)}
              </span>
            )}
          </div>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
          {hotel.amenities?.includes("wifi") && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
              <Wifi className="h-3.5 w-3.5 stroke-[2.5]" />
              {BADGE_TRANSLATIONS[locale].wifi}
            </span>
          )}
          {hotel.amenities?.includes("pool") && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
              <Waves className="h-3.5 w-3.5" />
              {BADGE_TRANSLATIONS[locale].pool}
            </span>
          )}
          {hotel.amenities?.includes("parking") && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300">
              <Car className="h-3.5 w-3.5" />
              {BADGE_TRANSLATIONS[locale].parking}
            </span>
          )}
        </div>
      </header>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_300px]">
        <div className="flex flex-col gap-8">
          {hotel.description && (
            <section className="flex flex-col gap-2">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">{dict.about}</h2>
              <p className="leading-relaxed text-slate-600 dark:text-slate-300">
                {hotel.description}
              </p>
            </section>
          )}

          {hotel.amenities && hotel.amenities.length > 0 && (
            <section className="flex flex-col gap-3">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">{dict.amenities}</h2>
              <ul className="flex flex-wrap gap-2">
                {hotel.amenities.map((id: string) => {
                  const Icon = AMENITY_ICONS[id];
                  return (
                    <li
                      key={id}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                    >
                      {Icon && <Icon className="h-3.5 w-3.5 text-primary-600 dark:text-primary-400" />}
                      <span>{amenityName.get(id) ?? id}</span>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          <section id="rooms" className="flex scroll-mt-24 flex-col gap-3">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">{dict.rooms}</h2>
            <RoomList
              rooms={hotel.rooms || []}
              locale={locale}
              hotelId={hotel.id}
              dict={dict}
              search={{
                checkIn: one(sp.check_in) ?? one(sp.checkIn),
                checkOut: one(sp.check_out) ?? one(sp.checkOut),
                guests: num(one(sp.guests)),
              }}
            />
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">{dict.reviews}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {(hotel.reviewsCount || 0) > 0
                ? dict.ratingSummary.replace(
                    "{count}",
                    String(hotel.reviewsCount),
                  )
                : dict.noReviews}
            </p>
            <ReviewsList
              reviews={reviews}
              dict={reviewsDict}
              locale={locale}
              hotelName={hotel.name}
            />
          </section>
        </div>

        {/* Sticky Pricing Sidebar Widget */}
        <aside className="flex h-fit flex-col gap-4 rounded-3xl border border-slate-100 bg-white p-6 shadow-[0_20px_45px_-12px_rgba(0,0,0,0.06),_0_10px_20px_-8px_rgba(0,0,0,0.03)] dark:border-slate-800 dark:bg-slate-900 lg:sticky lg:top-24">
          <div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{dict.from}</span>
            <p className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {formatSum(hotel.minPriceSum || 0)}
              <span className="text-sm font-normal text-slate-500 dark:text-slate-400">
                {" "}
                / {dict.perNight}
              </span>
            </p>
          </div>

          <div className="flex flex-col gap-2 border-t border-slate-100 pt-3 text-sm dark:border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 dark:text-slate-400">{dict.checkIn}</span>
              <span className="text-xs font-bold text-slate-900 dark:text-white">{hotel.checkInTime || "14:00"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 dark:text-slate-400">{dict.checkOut}</span>
              <span className="text-xs font-bold text-slate-900 dark:text-white">{hotel.checkOutTime || "12:00"}</span>
            </div>
          </div>

          <a href="#rooms" className="w-full">
            <Button variant="accent" size="lg" className="w-full font-extrabold">
              {dict.selectRoom}
            </Button>
          </a>
        </aside>
      </div>
    </main>
  );
}
