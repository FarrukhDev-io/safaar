"use server";

import {
  clearAdminSession,
  getAdminAccessToken,
  setAdminSession,
  type AdminSessionUser,
} from "./session";

const DEFAULT_API_BASE_URL =
  process.env.NODE_ENV === "development"
    ? "http://localhost:4000/v1"
    : "https://backend-production-87e6.up.railway.app/v1";
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.trim() || DEFAULT_API_BASE_URL;

interface BackendEnvelope<T> {
  success: boolean;
  data?: T;
  error?: { code?: string; message?: string };
}

/** Per-attempt ceiling: a healthy connect+response is ~1–2 s, so 8 s only ever
 *  trips on a black-holed (dead-keep-alive) socket, which we then retry. */
const BACKEND_ATTEMPT_TIMEOUT_MS = 8_000;
const BACKEND_MAX_ATTEMPTS = 3;

async function backendPost<T>(path: string, body: unknown): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const payload = JSON.stringify(body);

  // This runs inside the low-traffic `/login` Server Action function. Node's
  // global fetch (undici) pools keep-alive sockets; the backend sits behind a
  // tunnelled path that silently drops idle connections, so between infrequent
  // logins the pooled socket goes dead and the next login reuses it — the
  // request black-holes and fetch rejects with a bare "fetch failed" once the
  // socket times out. undici evicts the broken socket on that failure, so an
  // immediate retry lands on a fresh connection. Retry ONLY transport failures
  // (never a received HTTP response — a 401 for bad credentials must pass
  // straight through and must not be re-sent).
  let response: Response | undefined;
  let transportError: unknown;
  for (let attempt = 1; attempt <= BACKEND_MAX_ATTEMPTS && !response; attempt += 1) {
    try {
      response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
        cache: "no-store",
        signal: AbortSignal.timeout(BACKEND_ATTEMPT_TIMEOUT_MS),
      });
    } catch (err) {
      transportError = err;
      const causeCode = (err as { cause?: { code?: string } })?.cause?.code;
      // Server-side only (Vercel runtime logs) — no secrets, host is public.
      console.error(
        `[adminAuth] POST ${path} transport failure ${attempt}/${BACKEND_MAX_ATTEMPTS}: ` +
          `${(err as Error)?.name}: ${(err as Error)?.message}` +
          (causeCode ? ` (cause ${causeCode})` : ""),
      );
      if (attempt < BACKEND_MAX_ATTEMPTS) {
        await new Promise((resolve) => setTimeout(resolve, 300 * attempt));
      }
    }
  }

  if (!response) {
    throw transportError instanceof Error
      ? transportError
      : new Error("fetch failed");
  }

  const envelope = (await response.json()) as BackendEnvelope<T>;
  if (!response.ok || !envelope.success) {
    throw new Error(envelope.error?.message ?? "Tizimga kirishda xatolik");
  }
  return envelope.data as T;
}

function toSessionUser(admin: Record<string, unknown> | undefined, fallbackEmail: string): AdminSessionUser {
  return {
    id: String(admin?.id ?? "admin"),
    name: String(admin?.full_name ?? admin?.email ?? "Admin"),
    email: String(admin?.email ?? fallbackEmail),
    role: (admin?.role as AdminSessionUser["role"]) ?? "SUPER_ADMIN",
    has2FA: Boolean(admin?.has_2fa),
  };
}

export type AdminLoginResult =
  | { requires2FA: true; challengeId: string }
  | { requires2FA: false; user: AdminSessionUser }
  | { error: string };

/**
 * Login javobidagi haqiqiy JWT hech qachon bu funksiyaning qaytish
 * qiymatida bo'lmaydi — u to'g'ridan-to'g'ri shu yerda (serverda)
 * httpOnly cookie'ga yoziladi. Klient faqat "muvaffaqiyatli"/"2FA kerak"
 * degan signalni va (token bo'lmagan) foydalanuvchi ma'lumotini oladi.
 */
export async function adminLoginAction(
  username: string,
  password: string,
): Promise<AdminLoginResult> {
  try {
    const data = await backendPost<Record<string, unknown>>(
      "/auth/admin/login",
      { username, password },
    );

    if (data.requires_2fa) {
      return {
        requires2FA: true,
        challengeId: String(data.challenge_id),
      };
    }

    const accessToken = String(data.accessToken ?? data.access_token ?? "");
    if (!accessToken) {
      return { error: "Login token qaytmadi" };
    }
    const refreshToken = data.refreshToken ?? data.refresh_token;
    const user = toSessionUser(
      data.admin as Record<string, unknown> | undefined,
      username,
    );

    await setAdminSession({
      accessToken,
      refreshToken: refreshToken ? String(refreshToken) : undefined,
      user,
    });

    return { requires2FA: false, user };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Xatolik yuz berdi",
    };
  }
}

export type AdminVerify2FAResult =
  | { ok: true; user: AdminSessionUser }
  | { ok: false; expired: boolean; error: string };

export async function adminVerify2FAAction(
  challengeId: string,
  code: string,
): Promise<AdminVerify2FAResult> {
  try {
    const data = await backendPost<Record<string, unknown>>(
      "/auth/admin/verify-2fa",
      { challenge_id: challengeId, code },
    );

    const accessToken = String(data.accessToken ?? data.access_token ?? "");
    if (!accessToken) {
      return { ok: false, expired: false, error: "Login token qaytmadi" };
    }
    const refreshToken = data.refreshToken ?? data.refresh_token;
    const user = toSessionUser(data.admin as Record<string, unknown> | undefined, "");

    await setAdminSession({
      accessToken,
      refreshToken: refreshToken ? String(refreshToken) : undefined,
      user,
    });

    return { ok: true, user };
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    const expired = message.includes("AUTH_2FA_EXPIRED");
    return {
      ok: false,
      expired,
      error: expired ? "Vaqt tugadi, qaytadan kiring" : "Kod noto'g'ri",
    };
  }
}

export async function adminLogoutAction(): Promise<void> {
  await clearAdminSession();
}

/**
 * `use-socket.ts` (Socket.IO ulanishi) uchun — WebSocket handshake'i
 * brauzerda ishlaydi va token'ni `auth` maydonida yuborishi kerak, shu
 * sabab bu yerda uni bir martalik server chaqiruvi orqali olib beramiz.
 * Bu httpOnly cookie'dan farqli — token endi hech qachon localStorage/
 * js-cookie kabi doimiy, XSS orqali skanerlash mumkin bo'lgan joyda
 * saqlanmaydi, faqat shu chaqiruv natijasida vaqtincha xotirada bo'ladi.
 */
export async function getSocketAuthTokenAction(): Promise<string | null> {
  return getAdminAccessToken();
}
