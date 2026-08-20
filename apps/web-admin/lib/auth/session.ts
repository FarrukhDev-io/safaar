/**
 * Admin sessiyasi — httpOnly cookie'da saqlanadi.
 *
 * ILGARI: token `js-cookie` orqali oddiy (JS o'qiy oladigan) cookie'da
 * saqlanardi — panelda XSS bo'lsa, `document.cookie` orqali SUPER_ADMIN
 * tokeni to'liq o'g'irlanishi mumkin edi. Endi token faqat shu modul
 * orqali, server tomonida (`next/headers`) o'qiladi/yoziladi — brauzer
 * JavaScript'i unga umuman kira olmaydi.
 *
 * Cookie nomi ataylab eskisi bilan bir xil (`admin_token`) qoldirilgan —
 * `proxy.ts` (middleware) bu nomni faqat mavjudligini tekshirish uchun
 * o'qiydi (middleware serverda ishlaydi, httpOnly cookie'ni ham o'qiy
 * oladi — cheklov faqat brauzer JS'iga tegishli), shu sabab uni
 * o'zgartirish shart emas edi.
 */
import { cookies } from "next/headers";

const COOKIE_NAME = "admin_token";
const MAX_AGE_SECONDS = 60 * 60 * 24; // 1 kun — avvalgi cookie muddati bilan bir xil

export interface AdminSessionUser {
  id: string;
  name: string;
  email: string;
  role: "SUPER_ADMIN" | "ADMIN" | "MODERATOR";
  has2FA?: boolean;
}

export interface AdminSession {
  accessToken: string;
  refreshToken?: string;
  user: AdminSessionUser;
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const store = await cookies();
  const raw = store.get(COOKIE_NAME)?.value;
  if (!raw) return null;
  try {
    const session = JSON.parse(raw) as AdminSession;
    return session.accessToken ? session : null;
  } catch {
    return null;
  }
}

/** Faqat access token kerak bo'lgan joylar uchun qulay yordamchi. */
export async function getAdminAccessToken(): Promise<string | null> {
  const session = await getAdminSession();
  return session?.accessToken ?? null;
}

export async function setAdminSession(session: AdminSession): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_NAME, JSON.stringify(session), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function clearAdminSession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}
