/**
 * Foydalanuvchi sessiyasi — httpOnly cookie'da saqlanadi.
 *
 * Nega cookie? Server Component'lar himoyalangan ma'lumotni (bron, profil)
 * serverda oladi — token/sessiyani o'qiy olishi kerak. localStorage faqat
 * brauzerda, shuning uchun cookie eng to'g'ri yo'l.
 *
 * Himoyalangan so'rovlarda backend real JWT access tokenni
 * `Authorization: Bearer` headeridan o'qiydi.
 */
import "server-only";
import { cookies } from "next/headers";
import { Role } from "@safaar/types";
import { config } from "../../config/config";

const COOKIE_NAME = "safaar_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 kun

export interface Session {
  userId: string;
  role: Role;
  email?: string;
  accessToken: string;
  refreshToken: string;
}

/**
 * Access token'ning `exp` (Unix soniya) maydonini imzoni tekshirmasdan
 * o'qiydi — bu shunchaki UX uchun: muddati o'tgan bo'lsa sahifalar
 * "Sessiya topilmadi" xatosi bilan qulash o'rniga tozza login'ga
 * yo'naltiradi. Haqiqiy xavfsizlik tekshiruvi baribir backend'da.
 */
function isTokenExpired(token: string): boolean {
  try {
    const payloadPart = token.split(".")[1];
    if (!payloadPart) return true;
    const payload = JSON.parse(
      Buffer.from(payloadPart, "base64url").toString("utf-8"),
    ) as { exp?: number };
    if (typeof payload.exp !== "number") return false;
    return payload.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
}

export async function getSession(): Promise<Session | null> {
  const store = await cookies();
  const raw = store.get(COOKIE_NAME)?.value;
  if (!raw) return null;
  try {
    const session = JSON.parse(raw) as Session;
    if (!session.accessToken || isTokenExpired(session.accessToken)) {
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export async function setSession(session: Session): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_NAME, JSON.stringify(session), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: config.isProd,
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function clearSession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

/** Backend JWT auth headerlari (himoyalangan endpointlar uchun). */
export function getAuthHeaders(session: Session | string | null): Record<string, string> {
  const token = typeof session === "string" ? session : session?.accessToken;
  return token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : {};
}

/** Dev/Legacy alias */
export const devAuthHeaders = getAuthHeaders;

