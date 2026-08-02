import { rawApi } from "../client";
import { camelizeKeys } from "../case";
import { tiyinToSum } from "../money";
import type { Locale } from "../types";

export interface PublicStatsView {
  totalHotels: number;
  totalCities: number;
  averageRating: number;
  totalBookings: number;
  totalPartners: number;
}

type Localized = Partial<Record<Locale, string>> & Record<string, string>;

function pickLocale(value: Localized | undefined, locale: Locale): string {
  if (!value) return "";
  return value[locale] ?? value.uz ?? Object.values(value)[0] ?? "";
}

export interface DealView {
  id: string;
  slug: string;
  name: string;
  cityName: string;
  imageUrl: string;
  oldPriceSum: number;
  newPriceSum: number;
  discountPercent: number;
  endsAt: string;
  status: string;
}

interface RawDeal {
  id: string;
  slug: string;
  name: Localized;
  cityName?: Localized;
  imageUrl?: string;
  oldPrice?: number;
  newPrice?: number;
  discountPercent?: number;
  endsAt?: string;
  status?: string;
}

function toDealView(raw: RawDeal, locale: Locale): DealView {
  return {
    id: raw.id,
    slug: raw.slug,
    name: pickLocale(raw.name, locale),
    cityName: pickLocale(raw.cityName, locale),
    imageUrl: raw.imageUrl ?? "",
    oldPriceSum: tiyinToSum(raw.oldPrice ?? 0),
    newPriceSum: tiyinToSum(raw.newPrice ?? 0),
    discountPercent: raw.discountPercent ?? 0,
    endsAt: raw.endsAt ?? "",
    status: raw.status ?? "active",
  };
}

export const cmsService = {
  /** `GET /cms/offers` — bosh sahifa "Chegirmadagi takliflar" uchun. */
  async getDeals(locale: Locale): Promise<DealView[]> {
    const raw = await rawApi.get<unknown>("/cms/offers", {
      next: { revalidate: 300 },
    } as any);
    const items = camelizeKeys<RawDeal[]>(raw);
    return (items ?? [])
      .filter((item) => {
        const status = item.status ?? "active";
        return status === "active" || status === "published";
      })
      .map((item) => toDealView(item, locale));
  },

  /** `GET /stats/public` — bosh sahifa "TrustBar" statistikasi uchun. */
  async getPublicStats(): Promise<PublicStatsView | null> {
    const raw = await rawApi.get<unknown>("/stats/public", {
      next: { revalidate: 3600 },
    } as any);
    if (!raw) return null;
    const data = camelizeKeys<PublicStatsView>(raw);
    return {
      totalHotels: data.totalHotels ?? 0,
      totalCities: data.totalCities ?? 0,
      averageRating: Number(data.averageRating) || 0,
      totalBookings: data.totalBookings ?? 0,
      totalPartners: data.totalPartners ?? 0,
    };
  },
};
