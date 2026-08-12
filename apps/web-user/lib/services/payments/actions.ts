"use server";

import { redirect } from "next/navigation";
import { api } from "@/lib/api";
import { getSession } from "@/lib/auth/session";
import { defaultLocale, isLocale } from "@/i18n/config";
import { safeAction } from "@/lib/services/safe-action";
import type { PaymentProvider } from "./payments";

export interface RetryPaymentState {
  error?: string;
  url?: string;
}

export async function createPaymentSessionAction(
  _prev: RetryPaymentState,
  formData: FormData,
): Promise<RetryPaymentState> {
  const rawLocale = String(formData.get("locale") ?? defaultLocale);
  const locale = isLocale(rawLocale) ? rawLocale : defaultLocale;
  const bookingId = String(formData.get("bookingId") ?? "").trim();
  const provider = (String(formData.get("paymentMethod") ?? "click")) as PaymentProvider;

  const session = await getSession();
  if (!session) {
    redirect(`/${locale}/login?next=${encodeURIComponent(`/${locale}/booking/${bookingId}`)}`);
  }

  if (!bookingId) {
    return { error: "INVALID_BOOKING" };
  }

  if (provider === "cash") {
    redirect(`/${locale}/booking/${bookingId}?status=confirmed&payment=cash`);
  }

  let checkoutUrl = "";
  const result = await safeAction<RetryPaymentState>(
    async () => {
      const res = await api.payments.createPaymentSession(bookingId, provider, {
        token: session.accessToken,
      });
      return { url: res.paymentUrl ?? "" };
    },
    { error: "ERROR" },
  );

  if (result.error) return result;
  checkoutUrl = result.url ?? "";

  if (checkoutUrl) {
    redirect(checkoutUrl);
  }

  redirect(`/${locale}/booking/${bookingId}?payment=pending&provider=${provider}`);
}
