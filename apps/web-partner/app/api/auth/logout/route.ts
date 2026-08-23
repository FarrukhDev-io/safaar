import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  PARTNER_REFRESH_COOKIE,
  backendBaseUrl,
  clearRefreshCookie,
  unwrapEnvelope,
} from '../_shared';

/**
 * Chiqishda nafaqat httpOnly cookie'ni tozalaydi, balki backend
 * sessiyasini ham bekor qiladi — aks holda cookie shu brauzerda
 * o'chirilgan bo'lsa-da, o'g'irlangan access/refresh token (agar
 * bo'lsa) backend session revoke qilinmagani sababli ishlashda davom
 * etardi. Brauzer JS access tokenni bermaydi (u httpOnly emas, lekin
 * bu route uni talab qilmaydi) — buning o'rniga cookie'dagi refresh
 * tokenning o'zidan backend'da yangi (bir martalik) access token olib,
 * shu bilan sessiyani `session_id` bo'yicha bekor qilamiz. Bu — mavjud
 * `/auth/partner/refresh` + `/auth/partner/logout` endpoint'laridan
 * foydalanadi, yangi backend API talab qilmaydi.
 */
export async function POST() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get(PARTNER_REFRESH_COOKIE)?.value;

  if (refreshToken) {
    try {
      const refreshRes = await fetch(`${backendBaseUrl()}/auth/partner/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
        cache: 'no-store',
      });
      if (refreshRes.ok) {
        const payload = await refreshRes.json().catch(() => null);
        const data = unwrapEnvelope<{ accessToken?: string }>(payload);
        if (data?.accessToken) {
          await fetch(`${backendBaseUrl()}/auth/partner/logout`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${data.accessToken}` },
            cache: 'no-store',
          }).catch(() => {
            // Backend sessiyani bekor qila olmadi — baribir cookie
            // tozalanadi, foydalanuvchi shu brauzerdan chiqa oladi.
          });
        }
      }
    } catch {
      // Backend'ga umuman ulanib bo'lmadi — baribir mahalliy cookie
      // tozalanadi, chiqish bloklanmasligi kerak.
    }
  }

  const res = NextResponse.json({ ok: true });
  clearRefreshCookie(res);
  return res;
}
