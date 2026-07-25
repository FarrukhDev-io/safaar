"use client";

import { useActionState, useState } from "react";
import type { Locale } from "@/i18n/config";
import type { CheckoutDict } from "@/i18n/dictionaries";
import { createBookingAction, type CheckoutState } from "@/lib/booking/actions";
import { formatSum } from "@/lib/money";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PaymentSelector } from "@/components/features/checkout/PaymentSelector";
import { trackBookingStarted } from "@/lib/services/analytics/tracker";


function nightsBetween(checkIn: string, checkOut: string): number {
  const start = Date.parse(checkIn);
  const end = Date.parse(checkOut);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
    return 0;
  }
  return Math.ceil((end - start) / 86_400_000);
}

export function CheckoutForm({
  locale,
  dict,
  hotelId,
  hotelName,
  room,
  defaults,
}: {
  locale: Locale;
  dict: CheckoutDict;
  hotelId: string;
  hotelName: string;
  room: { id: string; name: string; priceSum: number };
  defaults: { checkIn: string; checkOut: string; guests: number };
}) {
  const [checkIn, setCheckIn] = useState(defaults.checkIn);
  const [checkOut, setCheckOut] = useState(defaults.checkOut);
  const [guests, setGuests] = useState(defaults.guests);
  const [state, action, pending] = useActionState<CheckoutState, FormData>(
    createBookingAction,
    {},
  );

  const nights = nightsBetween(checkIn, checkOut);
  const total = room.priceSum * Math.max(nights, 0);

  const handleSubmitForm = (formData: FormData) => {
    trackBookingStarted({
      hotelId,
      roomId: room.id,
      totalSum: total,
    });
    action(formData);
  };

  return (
    <form
      action={handleSubmitForm}
      className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]"
    >
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="hotelId" value={hotelId} />
      <input type="hidden" name="roomId" value={room.id} />

      <div className="flex flex-col gap-6">
        <section className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">{dict.guestDetails}</h2>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">{dict.fullName}</span>
            <Input
              name="fullName"
              autoComplete="name"
              placeholder={dict.fullNamePlaceholder}
            />
          </label>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium">{dict.checkIn}</span>
              <Input
                type="date"
                name="checkIn"
                required
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium">{dict.checkOut}</span>
              <Input
                type="date"
                name="checkOut"
                required
                min={checkIn || undefined}
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium">{dict.guests}</span>
              <Input
                type="number"
                name="guests"
                min={1}
                max={20}
                value={guests}
                onChange={(e) => setGuests(Math.max(1, Number(e.target.value)))}
              />
            </label>
          </div>
        </section>

        <section className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">{dict.paymentMethod}</h2>
          <PaymentSelector defaultValue="click" name="paymentMethod" />
        </section>
      </div>

      <aside className="flex h-fit flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-24">
        <h2 className="text-lg font-semibold">{dict.summary}</h2>
        <div>
          <p className="font-medium">{hotelName}</p>
          <p className="text-sm text-slate-500">{room.name}</p>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">
            {formatSum(room.priceSum)} × {nights} {dict.nights}
          </span>
          <span>{formatSum(total)}</span>
        </div>
        <div className="flex justify-between border-t border-slate-200 pt-3 font-semibold">
          <span>{dict.total}</span>
          <span>{formatSum(total)}</span>
        </div>

        {nights < 1 && (
          <p className="text-sm text-amber-600">{dict.needDates}</p>
        )}
        {state.error && <p className="text-sm text-red-600">{dict.error}</p>}

        <Button
          type="submit"
          variant="accent"
          size="lg"
          loading={pending}
          disabled={nights < 1}
        >
          {dict.confirm}
        </Button>
      </aside>
    </form>
  );
}
