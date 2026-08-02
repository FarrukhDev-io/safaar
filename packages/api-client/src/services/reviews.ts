import { rawApi } from "../client";
import { camelizeKeys } from "../case";
import { toReviewView } from "../adapters";
import type { ReviewView } from "../types";

interface RawReviewItem {
  status?: string;
}

function mapReviews(raw: unknown): ReviewView[] {
  const items = camelizeKeys<(RawReviewItem & Record<string, unknown>)[]>(raw);
  return (items ?? [])
    .filter((item) => (item.status ?? "published") !== "hidden")
    .map((item) => toReviewView(item));
}

export const reviewsService = {
  /** `GET /hotels/:id/reviews` — mehmonxona sharhlari. */
  async getHotelReviews(hotelId: string): Promise<ReviewView[]> {
    const raw = await rawApi.get<unknown>(
      `/hotels/${encodeURIComponent(hotelId)}/reviews`,
      { next: { revalidate: 60 } } as any,
    );
    return mapReviews(raw);
  },

  /** `GET /bus-companies/:id/reviews` — avtobus kompaniyasi sharhlari. */
  async getBusCompanyReviews(companyId: string): Promise<ReviewView[]> {
    if (!companyId) return [];
    const raw = await rawApi.get<unknown>(
      `/bus-companies/${encodeURIComponent(companyId)}/reviews`,
      { next: { revalidate: 60 } } as any,
    );
    return mapReviews(raw);
  },
};
