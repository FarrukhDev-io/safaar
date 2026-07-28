import { ApiRequestError } from "@safaar/api-client";
import { config } from "@/lib/config";

export type PaymentProvider = "click" | "payme" | "uzcard" | "humo" | "cash";

export interface CreatePaymentInput {
  provider: PaymentProvider;
}

export interface PaymentResult {
  id: string;
  bookingId: string;
  provider: string;
  status: string;
  amount: number;
  currency: string;
  paymentUrl?: string;
}

async function rawPost<T>(path: string, body: unknown, token?: string): Promise<T> {
  const base = config.apiUrl.endsWith("/") ? config.apiUrl : `${config.apiUrl}/`;
  const url = new URL(path.replace(/^\//, ""), base).toString();
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });

  const payload = (await res.json().catch(() => null)) as Record<string, unknown> | null;
  if (!res.ok || !payload) {
    throw new ApiRequestError(
      {
        success: false,
        message: typeof payload?.message === "string" ? payload.message : res.statusText || "Server error",
        code: typeof payload?.code === "string" ? payload.code : undefined,
      },
      res.status
    );
  }
  return (payload.data ?? payload) as T;
}

async function rawGet<T>(path: string, token?: string): Promise<T> {
  const base = config.apiUrl.endsWith("/") ? config.apiUrl : `${config.apiUrl}/`;
  const url = new URL(path.replace(/^\//, ""), base).toString();
  const res = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  const payload = (await res.json().catch(() => null)) as Record<string, unknown> | null;
  if (!res.ok || !payload) {
    throw new ApiRequestError(
      {
        success: false,
        message: typeof payload?.message === "string" ? payload.message : res.statusText || "Server error",
        code: typeof payload?.code === "string" ? payload.code : undefined,
      },
      res.status
    );
  }
  return (payload.data ?? payload) as T;
}

export const paymentsService = {
  /** `POST /payments/:bookingId/create` — to'lov sessiyasini yaratish va redirect URL olish. */
  async createPaymentSession(
    bookingId: string,
    provider: PaymentProvider,
    options?: { token?: string },
  ): Promise<PaymentResult> {
    const raw = await rawPost<Record<string, unknown>>(
      `/payments/${encodeURIComponent(bookingId)}/create`,
      { provider },
      options?.token,
    );

    const paymentUrl =
      (raw.payment_url as string | undefined) ??
      (raw.paymentUrl as string | undefined);

    return {
      id: String(raw.id ?? bookingId),
      bookingId: String(raw.booking_id ?? bookingId),
      provider: String(raw.provider ?? provider),
      status: String(raw.status ?? "pending"),
      amount: Number(raw.amount ?? 0),
      currency: String(raw.currency ?? "UZS"),
      paymentUrl,
    };
  },

  /** `GET /payments/:bookingId` — to'lov holatini tekshirish. */
  async getPaymentStatus(
    bookingId: string,
    options?: { token?: string },
  ): Promise<PaymentResult | null> {
    try {
      const raw = await rawGet<Record<string, unknown>>(
        `/payments/${encodeURIComponent(bookingId)}`,
        options?.token,
      );
      return {
        id: String(raw.id ?? ""),
        bookingId: String(raw.booking_id ?? bookingId),
        provider: String(raw.provider ?? ""),
        status: String(raw.status ?? "pending"),
        amount: Number(raw.amount ?? 0),
        currency: String(raw.currency ?? "UZS"),
        paymentUrl: (raw.payment_url as string | undefined) ?? (raw.paymentUrl as string | undefined),
      };
    } catch {
      return null;
    }
  },
};
