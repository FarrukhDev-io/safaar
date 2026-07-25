"use client";

import { useActionState } from "react";
import { createPaymentSessionAction, type RetryPaymentState } from "@/lib/payments/actions";
import { PaymentSelector } from "@/components/features/checkout/PaymentSelector";
import { Button } from "@/components/ui/Button";

export function RetryPaymentForm({
  bookingId,
  locale,
  initialProvider = "click",
}: {
  bookingId: string;
  locale: string;
  initialProvider?: "click" | "payme" | "uzcard" | "humo" | "cash";
}) {
  const [state, action, pending] = useActionState<RetryPaymentState, FormData>(
    createPaymentSessionAction,
    {}
  );

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="bookingId" value={bookingId} />

      <PaymentSelector defaultValue={initialProvider} name="paymentMethod" />

      {state.error && (
        <p className="text-sm font-medium text-red-600 dark:text-red-400">
          To'lovni amalga oshirishda xatolik yuz berdi. Qayta urinib ko'ring.
        </p>
      )}

      <Button
        type="submit"
        variant="accent"
        size="lg"
        loading={pending}
        className="w-full font-bold shadow-md"
      >
        Qayta to'lash (To'lov sahifasiga o'tish)
      </Button>
    </form>
  );
}
