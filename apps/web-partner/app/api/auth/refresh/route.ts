import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  PARTNER_REFRESH_COOKIE,
  backendBaseUrl,
  clearRefreshCookie,
  setRefreshCookie,
  unwrapEnvelope,
} from '../_shared';

interface RefreshResult {
  accessToken?: string;
  refreshToken?: string;
}

/**
 * Brauzer 401 olganda shu route'ga (tanasiz) murojaat qiladi — refresh
 * tokenni o'zi hech qachon ko'rmaydi/yubormaydi, chunki u httpOnly
 * cookie'da va brauzer uni avtomatik shu so'rovga qo'shadi (same-origin).
 * Backend'dan yangi juftlik olib, cookie'ni ROTATSIYA qilamiz (eski
 * refresh token endi ishlamaydi — backend reuse-detection'i buni
 * kutyapti) va faqat yangi access tokenni JS'ga qaytaramiz.
 */
export async function POST() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get(PARTNER_REFRESH_COOKIE)?.value;

  if (!refreshToken) {
    return NextResponse.json({ error: 'NO_REFRESH_TOKEN' }, { status: 401 });
  }

  let backendRes: Response;
  try {
    backendRes = await fetch(`${backendBaseUrl()}/auth/partner/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
      cache: 'no-store',
    });
  } catch {
    return NextResponse.json({ error: 'BACKEND_UNREACHABLE' }, { status: 503 });
  }

  if (!backendRes.ok) {
    const res = NextResponse.json({ error: 'REFRESH_FAILED' }, { status: 401 });
    // Reuse/eskirgan refresh token — sessiyani butunlay yakunlaymiz,
    // aks holda brauzer shu yaroqsiz cookie bilan cheksiz urinaverardi.
    clearRefreshCookie(res);
    return res;
  }

  const payload = await backendRes.json().catch(() => null);
  const data = unwrapEnvelope<RefreshResult>(payload);

  if (!data?.accessToken || !data?.refreshToken) {
    const res = NextResponse.json({ error: 'REFRESH_FAILED' }, { status: 401 });
    clearRefreshCookie(res);
    return res;
  }

  const res = NextResponse.json({ accessToken: data.accessToken });
  setRefreshCookie(res, data.refreshToken);
  return res;
}
