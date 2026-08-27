"use server";

import { api } from "@/lib/api";
import { ApiRequestError } from "@/lib/api";
import { getSession } from "@/lib/auth/session";
import { safeAction } from "@/lib/services/safe-action";

/**
 * Sevimli (favorite) server action'lari. Client `FavoriteButton` ularni
 * to'g'ridan-to'g'ri (event handler ichida) chaqiradi va natijaga qarab
 * holatini yangilaydi. Sessiya yo'q bo'lsa `ok:false, authRequired:true`
 * qaytadi — UI login'ga taklif qiladi (redirect emas, optimistik UX uchun).
 */

export interface FavoriteResult {
  ok: boolean;
  /** Qo'shilganda — yangi favorite id (keyin o'chirish uchun). */
  id?: string;
  /** Sessiya yo'q — kirish kerak. */
  authRequired?: boolean;
  error?: string;
}

/**
 * Backend `favorites.target_type` ustuni erkin VARCHAR(32) — hech qanday
 * enum/CHECK constraint yo'q, shuning uchun har bir katalog turi uchun
 * o'ziga xos qiymat ishlatish xavfsiz (backendda validatsiya qilinmaydi).
 * "hotel" — mavjud, "bus" — oldindan e'lon qilingan-u ishlatilmagan
 * (haqiqiy avtobus/bus-trips funksiyasi uchun ajratilgan, shu sabab
 * Transport katalogi (`vehicles` jadvali) uchun ishlatilmadi).
 */
export type FavoriteTargetType =
  | "hotel"
  | "bus"
  | "restaurant"
  | "transport"
  | "attraction";

export async function addFavoriteAction(
  targetType: FavoriteTargetType,
  targetId: string,
): Promise<FavoriteResult> {
  const session = await getSession();
  if (!session) return { ok: false, authRequired: true };
  if (!targetId) return { ok: false };

  try {
    const favorite = await api.users.addFavorite(
      { targetType, targetId },
      { token: session.accessToken },
    );
    return { ok: true, id: favorite.id };
  } catch (error: unknown) {
    return {
      ok: false,
      authRequired: error instanceof ApiRequestError && error.statusCode === 401,
    };
  }
}

export async function removeFavoriteAction(
  favoriteId: string,
): Promise<FavoriteResult> {
  const session = await getSession();
  if (!session) return { ok: false, authRequired: true };
  if (!favoriteId) return { ok: false };

  return safeAction<FavoriteResult>(
    async () => {
      await api.users.removeFavorite(favoriteId, { token: session.accessToken });
      return { ok: true };
    },
    { ok: false },
  );
}

/**
 * Katalog sahifalari (hotels/restaurants/transport/attractions) uchun —
 * joriy foydalanuvchining berilgan turdagi barcha favorite'larini BITTA
 * so'rovda oladi va `targetId -> favoriteId` map'iga aylantiradi, shunda
 * har bir karta uchun alohida so'rov yuborilmaydi. Sessiya yo'q bo'lsa
 * `authed:false` (karta ❤️ bosilganda login'ga yo'naltiriladi, backendga
 * so'rov yuborilmaydi). Xato bo'lsa ham sahifa qulamasin — bo'sh map bilan
 * davom etadi (kartalar shunchaki "sevimli emas" holatda ko'rinadi).
 */
export async function getFavoritesMap(
  targetType: FavoriteTargetType,
): Promise<{ authed: boolean; favoriteIds: Record<string, string> }> {
  const session = await getSession();
  if (!session) return { authed: false, favoriteIds: {} };

  try {
    const favorites = await api.users.getFavorites({ token: session.accessToken });
    const favoriteIds: Record<string, string> = {};
    for (const favorite of favorites) {
      if (favorite.targetType === targetType) {
        favoriteIds[favorite.targetId] = favorite.id;
      }
    }
    return { authed: true, favoriteIds };
  } catch {
    return { authed: true, favoriteIds: {} };
  }
}
