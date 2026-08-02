/**
 * Backend mehmonxona javobini front view-model'ga aylantiruvchi adapter.
 *
 * Bu yerda 2 ta moslashuv bo'ladi:
 *  1. Ko'p tilli maydon (`name: { uz, ru, en }`) → joriy tildagi bitta satr.
 *  2. Narx tiyin → so'm (`@/lib/money`).
 */
import { tiyinToSum } from "@/lib/money";
import type { Locale } from "@/i18n/config";
import type { HotelDetail, HotelListItem, RoomTypeView } from "@/types/view";

/** Ko'p tilli matn — backend `Record<lang, string>` shaklida qaytaradi. */
type Localized = Partial<Record<Locale, string>> & Record<string, string>;

interface RawCity {
  id: string;
  name: Localized;
}

interface RawRoom {
  id: string;
  name: Localized;
  basePrice: number;
  baseOccupancy?: number;
  maxAdults?: number;
  totalInventory?: number;
  available?: number;
}

interface RawHotel {
  id: string;
  slug: string;
  name: Localized;
  description?: Localized;
  address?: string;
  stars?: number;
  ratingAverage?: number;
  reviewsCount?: number;
  amenities?: string[];
  images?: string[];
  latitude?: number;
  longitude?: number;
  checkInTime?: string;
  checkOutTime?: string;
  minPrice?: number;
  city?: RawCity;
  rooms?: RawRoom[];
}

/** Ko'p tilli matndan joriy til, bo'lmasa uz, bo'lmasa birinchi mavjud. */
function pickLocale(value: Localized | undefined, locale: Locale): string {
  if (!value) return "";
  return value[locale] ?? value.uz ?? Object.values(value)[0] ?? "";
}

function toHotelBase(raw: RawHotel, locale: Locale): HotelListItem {
  return {
    id: raw.id,
    slug: raw.slug,
    name: pickLocale(raw.name, locale),
    cityName: pickLocale(raw.city?.name, locale),
    stars: raw.stars ?? 0,
    rating: raw.ratingAverage ?? 0,
    reviewsCount: raw.reviewsCount ?? 0,
    minPriceSum: tiyinToSum(raw.minPrice ?? 0),
    imageUrl: raw.images?.[0],
    latitude: raw.latitude,
    longitude: raw.longitude,
  };
}

export function toHotelListItem(raw: RawHotel, locale: Locale): HotelListItem {
  return toHotelBase(raw, locale);
}

function toRoomView(raw: RawRoom, locale: Locale): RoomTypeView {
  return {
    id: raw.id,
    name: pickLocale(raw.name, locale),
    priceSum: tiyinToSum(raw.basePrice ?? 0),
    capacity: raw.baseOccupancy ?? raw.maxAdults ?? 1,
    available: raw.available ?? raw.totalInventory ?? 0,
  };
}

export function toHotelDetail(raw: RawHotel, locale: Locale): HotelDetail {
  return {
    ...toHotelBase(raw, locale),
    description: pickLocale(raw.description, locale),
    address: raw.address ?? "",
    amenities: raw.amenities ?? [],
    images: raw.images ?? [],
    latitude: raw.latitude ?? 0,
    longitude: raw.longitude ?? 0,
    checkInTime: raw.checkInTime ?? "",
    checkOutTime: raw.checkOutTime ?? "",
    rooms: (raw.rooms ?? []).map((room) => toRoomView(room, locale)),
  };
}
