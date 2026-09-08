import { rawApi } from "../client";
import { camelizeKeys } from "../case";
import { toHotelDetail, toHotelListItem } from "../adapters";
import type { Locale, HotelListItem, HotelDetail } from "../types";

export interface HotelListParams {
  cityId?: string;
  search?: string;
  stars?: number;
  page?: number;
  limit?: number;
  featured?: boolean;
  sort?: "price_asc" | "price_desc" | "rating";
  minPrice?: number;
  maxPrice?: number;
  neLat?: number;
  neLng?: number;
  swLat?: number;
  swLng?: number;
  /**
   * Yashash-joyi turi bo'yicha filtr (`partner_organizations.type`). Kategoriya
   * sahifalari uchun: `dacha`, `resort`, `sanatorium` va h.k. Berilmasa —
   * umumiy "Mehmonxonalar" katalogi qaytadi.
   */
  type?: string;
}

export interface HotelListResult {
  items: HotelListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface RawListResponse {
  items?: unknown[];
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}

/**
 * Xarita "shu hududda qidirish" chegaralarini backend kutgan yagona
 * `bounds` parametriga aylantiradi — format: `sw_lat,sw_lng,ne_lat,ne_lng`
 * (backenddagi `parseGeoBounds`).
 *
 * Leaflet `map.getBounds()` uzoqlashtirilganda yoki dunyo bo'ylab
 * aylantirilganda `lat` ni ±90, `lng` ni ±180 dan tashqarida qaytarishi
 * mumkin — bunday qiymatlar backend tomonidan `GEO_BOUNDS_*` (HTTP 400)
 * bilan rad etiladi. Shu sabab bu yerda ruxsat etilgan oraliqqa siqamiz
 * va `sw_lat <= ne_lat` tartibini kafolatlaymiz.
 */
function toBoundsParam(params: HotelListParams): string | undefined {
  const { swLat, swLng, neLat, neLng } = params;
  const coords = [swLat, swLng, neLat, neLng];
  if (coords.some((n) => typeof n !== "number" || !Number.isFinite(n))) {
    return undefined;
  }
  const clampLat = (n: number) => Math.min(90, Math.max(-90, n));
  const clampLng = (n: number) => Math.min(180, Math.max(-180, n));
  const south = Math.min(clampLat(swLat!), clampLat(neLat!));
  const north = Math.max(clampLat(swLat!), clampLat(neLat!));
  return `${south},${clampLng(swLng!)},${north},${clampLng(neLng!)}`;
}

export const hotelsService = {
  /** `GET /hotels` — e'lon qilingan mehmonxonalar ro'yxati. */
  async getHotels(
    locale: Locale,
    params: HotelListParams = {},
  ): Promise<HotelListResult> {
    const raw = await rawApi.get<unknown>("/hotels", {
      query: {
        city_id: params.cityId,
        search: params.search,
        stars: params.stars,
        type: params.type,
        page: params.page,
        limit: params.limit,
        featured: params.featured ? "true" : undefined,
        sort: params.sort,
        min_price: params.minPrice,
        max_price: params.maxPrice,
        bounds: toBoundsParam(params),
      },
      next: { revalidate: 60 },
    } as any);

    const data = camelizeKeys<RawListResponse | unknown[]>(raw);
    const items = Array.isArray(data) ? data : (data.items ?? []);
    const mapped = (items ?? []).map((item) =>
      toHotelListItem(item as any, locale),
    );

    return {
      items: mapped,
      total: Array.isArray(data) ? mapped.length : (data.total ?? mapped.length),
      page: Array.isArray(data) ? 1 : (data.page ?? 1),
      limit: Array.isArray(data) ? mapped.length : (data.limit ?? mapped.length),
      totalPages: Array.isArray(data)
        ? 1
        : (data.totalPages ??
          Math.ceil((data.total ?? mapped.length) / (data.limit || mapped.length || 1))),
    };
  },

  /** `GET /hotels/:slugOrId` — bitta mehmonxona (xonalari bilan). */
  async getHotel(locale: Locale, slugOrId: string): Promise<HotelDetail> {
    const raw = await rawApi.get<unknown>(`/hotels/${encodeURIComponent(slugOrId)}`);
    return toHotelDetail(camelizeKeys(raw) as any, locale);
  },

  /** `GET /hotels/featured` — bosh sahifa uchun tanlangan mehmonxonalar. */
  async getFeaturedHotels(
    locale: Locale,
    params: HotelListParams = {},
  ): Promise<HotelListResult> {
    return this.getHotels(locale, { ...params, featured: true });
  },
};
