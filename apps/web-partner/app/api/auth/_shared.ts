import type { NextResponse } from 'next/server';

/**
 * Partner refresh tokeni saqlanadigan httpOnly cookie.
 *
 * Bu tokenni brauzer JS'i (localStorage/Zustand persist) hech qachon
 * ko'rmaydi — faqat shu Next.js server (Route Handler) o'qiy/yoza oladi.
 * XSS orqali sessiyani cheksiz davom ettirish imkoniyatini yopadi.
 */
export const PARTNER_REFRESH_COOKIE = 'safaar_partner_rt';

const DEFAULT_API_BASE_URL =
  process.env.NODE_ENV === 'development'
    ? 'http://localhost:4000/v1'
    : 'https://backend-production-87e6.up.railway.app/v1';

export function backendBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_API_URL?.trim() || DEFAULT_API_BASE_URL).replace(
    /\/$/,
    '',
  );
}

export function setRefreshCookie(res: NextResponse, refreshToken: string): void {
  res.cookies.set(PARTNER_REFRESH_COOKIE, refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    // JWT_REFRESH_TTL default'i (backend) 30 kun — cookie shunga mos.
    maxAge: 60 * 60 * 24 * 30,
  });
}

export function clearRefreshCookie(res: NextResponse): void {
  res.cookies.delete(PARTNER_REFRESH_COOKIE);
}

/** Backend javobi `{success, data, meta}` bilan o'ralgan bo'lishi mumkin. */
export function unwrapEnvelope<T>(payload: unknown): T {
  if (
    payload &&
    typeof payload === 'object' &&
    'success' in payload &&
    'data' in payload
  ) {
    return (payload as { data: T }).data;
  }
  return payload as T;
}
