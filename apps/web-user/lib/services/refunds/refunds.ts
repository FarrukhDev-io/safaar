import { ApiRequestError } from "@safaar/api-client";
import { config } from "@/lib/config";

export type RefundStatus = "requested" | "processing" | "approved" | "rejected" | "paid";

export interface RefundView {
  id: string;
  bookingId: string;
  status: RefundStatus;
  requestedAmount: number;
  approvedAmount: number | null;
  currency: string;
  reason: string;
  createdAt: string;
  updatedAt: string;
}

function toRefundView(raw: Record<string, unknown>): RefundView {
  return {
    id: String(raw.id ?? ""),
    bookingId: String(raw.booking_id ?? raw.bookingId ?? ""),
    status: String(raw.status ?? "requested") as RefundStatus,
    requestedAmount: Number(raw.requested_amount ?? raw.requestedAmount ?? 0),
    approvedAmount:
      raw.approved_amount != null || raw.approvedAmount != null
        ? Number(raw.approved_amount ?? raw.approvedAmount)
        : null,
    currency: String(raw.currency ?? "UZS"),
    reason: String(raw.reason ?? ""),
    createdAt: String(raw.created_at ?? raw.createdAt ?? ""),
    updatedAt: String(raw.updated_at ?? raw.updatedAt ?? ""),
  };
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

export const refundsService = {
  /** `POST /refunds` — bron uchun qaytarish so'rovi (backend refundable summani hisoblaydi). */
  async createRefund(
    bookingId: string,
    reason?: string,
    options?: { token?: string }
  ): Promise<RefundView> {
    const raw = await rawPost<Record<string, unknown>>(
      "/refunds",
      { booking_id: bookingId, reason },
      options?.token
    );
    return toRefundView(raw);
  },

  /** `GET /refunds/:id` — bitta qaytarish so'rovi holati. */
  async getRefund(id: string, options?: { token?: string }): Promise<RefundView> {
    const raw = await rawGet<Record<string, unknown>>(`/refunds/${encodeURIComponent(id)}`, options?.token);
    return toRefundView(raw);
  },

  /** `GET /me/refunds` — joriy foydalanuvchining barcha qaytarish so'rovlari. */
  async getMyRefunds(options?: { token?: string }): Promise<RefundView[]> {
    const raw = await rawGet<Record<string, unknown>[]>("/me/refunds", options?.token);
    return (raw ?? []).map(toRefundView);
  },
};
