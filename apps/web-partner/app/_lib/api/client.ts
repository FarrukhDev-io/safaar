import type { ApiError } from '@safaar/types';

const DEFAULT_API_BASE_URL =
  process.env.NODE_ENV === 'development'
    ? '/api/backend'
    : 'https://backend-production-87e6.up.railway.app/v1';
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.trim() || DEFAULT_API_BASE_URL;

interface ApiEnvelope<T> {
  success: true;
  data: T;
  meta?: {
    request_id?: string;
  };
}

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public payload?: ApiError,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

type UnauthorizedHandler = (error: HttpError) => void;

let unauthorizedHandler: UnauthorizedHandler | null = null;

export function setUnauthorizedHandler(handler: UnauthorizedHandler | null) {
  unauthorizedHandler = handler;
}

type AccessTokenUpdater = (accessToken: string) => void;

let accessTokenUpdater: AccessTokenUpdater | null = null;

/** `session-expiry-handler.tsx` shu orqali yangi access tokenni Zustand
 * store'ga yozadi — `client.ts` store'ni to'g'ridan-to'g'ri import
 * qilmaydi (xuddi `setUnauthorizedHandler` kabi ataylab bo'shashtirilgan
 * bog'lanish). */
export function setAccessTokenUpdater(updater: AccessTokenUpdater | null) {
  accessTokenUpdater = updater;
}

/**
 * Chiqish (logout) paytida `clearSession()` access tokenni bo'shatadi —
 * bu `SessionExpiryHandler`dagi "tab yangi ochilganda jimgina refresh
 * qilib ko'rish" effektini ham qayta ishga tushiradi (u `hasTokens`
 * false bo'lishini kuzatadi). Ataylab chiqilganda bu ikkalasi poyga
 * qiladi: agar jim-refresh birinchi bo'lib bajarilsa, refresh-token
 * ROTATSIYA qilinib, foydalanuvchi chiqib ketgandan keyin ham
 * "qayta kirib qolishi" mumkin edi (real E2E orqali topilgan xato).
 * Shu bayroq orqali chiqish paytida jim-refresh urinishi o'tkazib
 * yuboriladi.
 */
let loggingOut = false;

export function setLoggingOut(value: boolean) {
  loggingOut = value;
}

export function isLoggingOut(): boolean {
  return loggingOut;
}

/**
 * 401 kelganda bitta umumiy refresh urinishini boshqaradi — 5 ta parallel
 * so'rov bir vaqtda 401 olsa, 5 ta emas, faqat BITTA `/api/auth/refresh`
 * chaqiruvi ketadi (single-flight). Refresh tokenning o'zi httpOnly
 * cookie'da, shu sabab bu yerda hech qanday token qo'lda yuborilmaydi.
 */
let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (isLoggingOut()) return null;
  if (!refreshPromise) {
    refreshPromise = fetch('/api/auth/refresh', { method: 'POST' })
      .then(async (res) => {
        if (!res.ok || isLoggingOut()) return null;
        const data = (await res.json().catch(() => null)) as
          | { accessToken?: string }
          | null;
        return data?.accessToken ?? null;
      })
      .catch(() => null)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

/**
 * Chiqish paytida logout so'rovidan OLDIN allaqachon boshlangan (masalan
 * bildirishnomalar panelidan kelgan 401 sabab ishga tushgan) "single-flight"
 * refresh so'rovi bo'lishi mumkin — u logout so'rovidan KEYIN javob qaytarib,
 * `/api/auth/refresh` orqali YANGI refresh-token cookie'ni yozib qo'yishi
 * (va shu bilan chiqishni bekor qilib qo'yishi) mumkin edi (real E2E orqali
 * topilgan holat). `useLogout()` shu funksiya orqali bunday "in-flight"
 * refresh'ni kutib, keyin cookie'ni yana bir bor tozalaydi.
 */
export async function waitForPendingRefresh(): Promise<void> {
  if (refreshPromise) {
    await refreshPromise.catch(() => {});
  }
}

function isAuthEndpoint(path: string): boolean {
  return /\/auth\//.test(path);
}

function handleUnauthorized(error: HttpError, token?: string | null) {
  // Demo token bilan 401 bo'lsa logout qilmaymiz
  if (token && token.startsWith('demo.')) return;
  if (error.status === 401 && token) {
    unauthorizedHandler?.(error);
  }
}

/** LocalStorage'dagi tokenni o'qib demo rejimda ekanligini aniqlaydi. */
function isDemoMode(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const auth = JSON.parse(
      localStorage.getItem('safaar-partner-auth') || '{}',
    );
    const token: unknown = auth?.state?.tokens?.accessToken;
    return typeof token === 'string' && token.startsWith('demo.');
  } catch {
    return false;
  }
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  token?: string | null;
  organizationId?: string;
  searchParams?: Record<string, string | number | boolean | undefined>;
}

function buildUrl(
  path: string,
  searchParams?: RequestOptions['searchParams'],
): string {
  const rawUrl = path.startsWith('http')
    ? path
    : `${API_BASE_URL.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
  const isAbsolute = /^https?:\/\//i.test(rawUrl);
  const base =
    typeof window !== 'undefined' ? window.location.origin : 'http://localhost';
  const url = isAbsolute ? new URL(rawUrl) : new URL(rawUrl, base);

  if (searchParams) {
    for (const [key, value] of Object.entries(searchParams)) {
      if (value === undefined) continue;
      url.searchParams.set(key, String(value));
    }
  }

  return isAbsolute
    ? url.toString()
    : `${url.pathname}${url.search}${url.hash}`;
}

function storedOrganizationId(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    const auth = JSON.parse(
      localStorage.getItem('safaar-partner-auth') || '{}',
    );
    if (auth?.state?.user?.organizationId) {
      return auth.state.user.organizationId;
    }
  } catch {}
  return undefined;
}

async function parseErrorPayload(response: Response): Promise<ApiError> {
  let payload:
    | {
        error?: {
          message?: string;
          fields?: ApiError['fields'];
          code?: string;
        };
        message?: string;
        fields?: ApiError['fields'];
        code?: string;
      }
    | undefined;
  try {
    payload = await response.json();
  } catch {
    // ignore
  }

  return {
    message: payload?.error?.message ?? payload?.message ?? response.statusText,
    fields: payload?.error?.fields ?? payload?.fields,
    code: payload?.error?.code ?? payload?.code,
    statusCode: response.status,
  };
}

/**
 * Backend uchun universal HTTP wrapper.
 *
 * - JSON serialization/deserialization avtomatik
 * - `Authorization: Bearer <token>` qo'yiladi (token mavjud bo'lsa)
 * - Xato bo'lsa `HttpError` tashlaydi (status, payload bilan)
 *
 * @example
 *   const data = await request<Hotel[]>("/hotels");
 */
export async function request<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  return requestInternal<T>(path, options, false);
}

async function requestInternal<T>(
  path: string,
  options: RequestOptions,
  isRetryAfterRefresh: boolean,
): Promise<T> {
  const {
    body,
    token,
    organizationId = storedOrganizationId(),
    searchParams,
    headers,
    ...rest
  } = options;

  const init: RequestInit = {
    ...rest,
    headers: {
      Accept: 'application/json',
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(organizationId ? { 'x-organization-id': organizationId } : {}),
      ...headers,
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  };

  let response: Response;
  try {
    // Demo rejimda backend so'rovlarini o'tkazib yuboramiz
    if (isDemoMode() || (token && token.startsWith('demo.'))) {
      // Endpoint turiga qarab bo'sh natija qaytaramiz
      return (Array.isArray([]) ? [] : null) as unknown as T;
    }
    response = await fetch(buildUrl(path, searchParams), init);
  } catch (cause) {
    // fetch'ning o'zi otgan xato: tarmoq yo'q, CORS, backend offline va h.k.
    throw new HttpError(
      0,
      "Backend bilan bog'lana olmadi. Internet va server holatini tekshiring.",
      {
        statusCode: 0,
        message: cause instanceof Error ? cause.message : 'Network error',
      },
    );
  }

  if (!response.ok) {
    const apiError = await parseErrorPayload(response);
    const error = new HttpError(response.status, apiError.message, apiError);

    if (
      error.status === 401 &&
      token &&
      !isRetryAfterRefresh &&
      !isAuthEndpoint(path) &&
      !isLoggingOut()
    ) {
      const newAccessToken = await refreshAccessToken();
      if (newAccessToken) {
        accessTokenUpdater?.(newAccessToken);
        return requestInternal<T>(
          path,
          { ...options, token: newAccessToken },
          true,
        );
      }
    }

    handleUnauthorized(error, token);
    throw error;
  }

  // 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  const payload = (await response.json()) as T | ApiEnvelope<T>;
  if (
    typeof payload === 'object' &&
    payload !== null &&
    'success' in payload &&
    'data' in payload
  ) {
    return (payload as ApiEnvelope<T>).data;
  }

  return payload as T;
}

export async function requestFormData<T>(
  path: string,
  formData: FormData,
  options: Omit<RequestOptions, 'body'> = {},
): Promise<T> {
  return requestFormDataInternal<T>(path, formData, options, false);
}

async function requestFormDataInternal<T>(
  path: string,
  formData: FormData,
  options: Omit<RequestOptions, 'body'>,
  isRetryAfterRefresh: boolean,
): Promise<T> {
  const {
    token,
    organizationId = storedOrganizationId(),
    searchParams,
    headers,
    ...rest
  } = options;
  const response = await fetch(buildUrl(path, searchParams), {
    ...rest,
    method: rest.method ?? 'POST',
    headers: {
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(organizationId ? { 'x-organization-id': organizationId } : {}),
      ...headers,
    },
    body: formData,
  });

  if (!response.ok) {
    const apiError = await parseErrorPayload(response);
    const error = new HttpError(response.status, apiError.message, apiError);

    if (
      error.status === 401 &&
      token &&
      !isRetryAfterRefresh &&
      !isAuthEndpoint(path) &&
      !isLoggingOut()
    ) {
      const newAccessToken = await refreshAccessToken();
      if (newAccessToken) {
        accessTokenUpdater?.(newAccessToken);
        return requestFormDataInternal<T>(
          path,
          formData,
          { ...options, token: newAccessToken },
          true,
        );
      }
    }

    handleUnauthorized(error, token);
    throw error;
  }

  const payload = (await response.json()) as T | ApiEnvelope<T>;
  if (
    typeof payload === 'object' &&
    payload !== null &&
    'success' in payload &&
    'data' in payload
  ) {
    return (payload as ApiEnvelope<T>).data;
  }

  return payload as T;
}
