import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import { isLocale, type Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';
import { api, ApiRequestError } from '@/lib/api';
import { getSession } from '@/lib/auth/session';
import { formatSum } from '@/lib/money';
import { HotelGallery } from '@/components/hotels/HotelGallery';
import { RoomList } from '@/components/hotels/RoomList';
import { ReviewsList } from '@/components/reviews/ReviewsList';
import { FavoriteButton } from '@/components/favorites/FavoriteButton';
import { BackButton } from '@/components/ui/BackButton';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  Car,
  MapPin,
  ShieldCheck,
  Star,
  Utensils,
  Waves,
  Wifi,
} from 'lucide-react';

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

const getCachedHotel = cache(async (locale: Locale, slug: string) => {
  try {
    return await api.hotels.getHotel(locale, slug);
  } catch (error: unknown) {
    if (error instanceof ApiRequestError && error.statusCode === 404) {
      return 404 as const;
    }
    throw error;
  }
});

async function getFavoriteIdOrNull(hotelId: string, token?: string) {
  if (!token) return null;

  try {
    return await api.users.findFavoriteId(hotelId, { token });
  } catch (error: unknown) {
    if (error instanceof ApiRequestError) {
      return null;
    }
    throw error;
  }
}

async function getHotelReviewsOrEmpty(hotelId: string) {
  try {
    return await api.reviews.getHotelReviews(hotelId);
  } catch (error: unknown) {
    if (error instanceof ApiRequestError) {
      return [];
    }
    throw error;
  }
}

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
    description: hotel.description?.slice(0, 160),
  };
}

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string; slug: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { lang, slug } = await params;
  const locale = isLocale(lang) ? lang : "uz";
  const sp = await searchParams;

  const [hotel, dict, favDict, reviewsDict, session, amenitiesRes] =
    await Promise.all([
      getCachedHotel(locale, slug),
      getDictionary(locale, 'hotelDetail'),
      getDictionary(locale, 'favorites'),
      getDictionary(locale, 'reviews'),
      getSession(),
      api.catalog.getAmenities(locale),
    ]);

  if (hotel === 404) {
    notFound();
  }

  if (!hotel) {
    return (
      <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-16">
        <p className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-800 shadow-btn dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300">
          {dict.error}
        </p>
      </main>
    );
  }

  const [favoriteId, reviews] = await Promise.all([
    getFavoriteIdOrNull(hotel.id, session?.accessToken),
    getHotelReviewsOrEmpty(hotel.id),
  ]);

  const amenityName = new Map(
    amenitiesRes.map((amenity) => [amenity.id, amenity.name]),
  );

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6">
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

      <HotelGallery images={hotel.images} alt={hotel.name} />

      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
              {hotel.name}
            </h1>
            <p className="mt-1 flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400">
              <MapPin className="h-4 w-4 shrink-0 text-slate-400" />
              {hotel.cityName}
              {hotel.address ? ` · ${hotel.address}` : ''}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {hotel.rating > 0 && (
              <Badge
                variant="outline"
                className="gap-1 px-3 py-1 text-sm text-amber-700 dark:text-amber-400"
              >
                <Star className="h-4 w-4 fill-current text-amber-500" />
                {hotel.rating.toFixed(1)}
              </Badge>
            )}
            {hotel.stars > 0 && (
              <span className="text-sm font-bold text-amber-500">
                {'★'.repeat(hotel.stars)}
              </span>
            )}
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_300px]">
        <div className="flex flex-col gap-8">
          {hotel.description && (
            <section className="flex flex-col gap-2">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {dict.about}
              </h2>
              <p className="leading-relaxed text-slate-600 dark:text-slate-300">
                {hotel.description}
              </p>
            </section>
          )}

          {hotel.amenities.length > 0 && (
            <section className="flex flex-col gap-3">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {dict.amenities}
              </h2>
              <ul className="flex flex-wrap gap-2">
                {hotel.amenities.map((id: string) => {
                  const Icon = AMENITY_ICONS[id];
                  return (
                    <li
                      key={id}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                    >
                      {Icon && (
                        <Icon className="h-3.5 w-3.5 text-primary-600 dark:text-primary-400" />
                      )}
                      <span>{amenityName.get(id) ?? id}</span>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          <section id="rooms" className="flex scroll-mt-24 flex-col gap-3">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              {dict.rooms}
            </h2>
            <RoomList
              rooms={hotel.rooms}
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
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              {dict.reviews}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {hotel.reviewsCount > 0
                ? dict.ratingSummary.replace(
                    '{count}',
                    String(hotel.reviewsCount),
                  )
                : dict.noReviews}
            </p>
            <ReviewsList reviews={reviews} dict={reviewsDict} locale={locale} />
          </section>
        </div>

        <aside className="flex h-fit flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-md dark:border-slate-800 dark:bg-slate-900 lg:sticky lg:top-24">
          <div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {dict.from}
            </span>
            <p className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {formatSum(hotel.minPriceSum)}
              <span className="text-sm font-normal text-slate-500 dark:text-slate-400">
                {' '}
                / {dict.perNight}
              </span>
            </p>
          </div>

          {(hotel.checkInTime || hotel.checkOutTime) && (
            <div className="flex flex-col gap-2 border-t border-slate-100 pt-3 text-sm dark:border-slate-800">
              {hotel.checkInTime && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {dict.checkIn}
                  </span>
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    {hotel.checkInTime}
                  </span>
                </div>
              )}
              {hotel.checkOutTime && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {dict.checkOut}
                  </span>
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    {hotel.checkOutTime}
                  </span>
                </div>
              )}
            </div>
          )}

          <a href="#rooms" className="w-full">
            <Button
              variant="accent"
              size="lg"
              className="w-full font-extrabold"
            >
              {dict.selectRoom}
            </Button>
          </a>
        </aside>
      </div>
    </main>
  );
}
