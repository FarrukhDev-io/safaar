/**
 * Backend sharh (review) javobini front view-model'ga aylantiruvchi adapter.
 *
 * Backend sharhlarni flat `snake_case` yozuv sifatida qaytaradi
 * (`{ id, user_id, rating, body, status, created_at, ... }`), `camelizeKeys`
 * orqali allaqachon `camelCase`ga o'tkazilgan. Faqat UI uchun kerakli
 * maydonlarni olamiz.
 */
import type { ReviewView } from "@/types/view";

interface RawReview {
  id?: string;
  rating?: number;
  body?: string;
  status?: string;
  createdAt?: string;
  firstName?: string;
  lastName?: string;
  authorName?: string;
  avatarUrl?: string;
  photos?: unknown;
  isVerifiedGuest?: boolean;
}

export function toReviewView(raw: RawReview): ReviewView {
  const authorName =
    raw.authorName ??
    [raw.firstName, raw.lastName].filter(Boolean).join(" ").trim();
  const photos = Array.isArray(raw.photos)
    ? raw.photos.filter((photo): photo is string => typeof photo === "string")
    : undefined;

  return {
    id: raw.id ?? "",
    rating: typeof raw.rating === "number" ? raw.rating : 0,
    body: raw.body ?? "",
    createdAt: raw.createdAt ?? "",
    ...(authorName ? { authorName } : {}),
    ...(raw.avatarUrl ? { avatarUrl: raw.avatarUrl } : {}),
    ...(photos && photos.length > 0 ? { photos } : {}),
    ...(raw.isVerifiedGuest === true ? { isVerifiedGuest: true } : {}),
  };
}
