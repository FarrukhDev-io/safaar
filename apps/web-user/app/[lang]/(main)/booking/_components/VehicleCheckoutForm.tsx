'use client';

import { useActionState, useState } from 'react';
import type { Locale } from '@/i18n/config';
import type { CheckoutDict } from '@/i18n/dictionaries';
import { createVehicleBookingAction, type VehicleCheckoutState } from '@/lib/booking/actions';
import { formatSum } from '@/lib/money';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { DatePicker } from '@/components/ui/DatePicker';
import { PaymentSelector } from '@/components/features/checkout/PaymentSelector';

function daysBetween(checkIn: string, checkOut: string): number {
  const start = Date.parse(checkIn);
  const end = Date.parse(checkOut);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
    return 0;
  }
  return Math.ceil((end - start) / 86_400_000);
}

export function VehicleCheckoutForm({
  locale,
  dict,
  vehicleId,
  vehicleName,
  pricePerDaySum,
  defaults,
  isGuest = false,
}: {
  locale: Locale;
  dict: CheckoutDict & { firstName?: string; lastName?: string; email?: string; phone?: string };
  vehicleId: string;
  vehicleName: string;
  pricePerDaySum: number;
  defaults: { checkIn: string; checkOut: string };
  isGuest?: boolean;
}) {
  const [checkIn, setCheckIn] = useState(defaults.checkIn);
  const [checkOut, setCheckOut] = useState(defaults.checkOut);
  const [state, action, pending] = useActionState<VehicleCheckoutState, FormData>(
    createVehicleBookingAction,
    {},
  );

  const days = daysBetween(checkIn, checkOut);
  const total = pricePerDaySum * Math.max(days, 0);
  const errorMessage =
    state.error === 'GUEST_DETAILS_REQUIRED'
      ? dict.guestDetailsRequired
      : state.error === 'VEHICLE_ALREADY_BOOKED'
        ? "Tanlangan sanalar uchun mashina allaqachon band qilingan"
        : state.error === 'ERROR'
          ? dict.error
          : state.error;

  return (
    <form action={action} className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="vehicleId" value={vehicleId} />

      <div className="flex flex-col gap-6">
        <section className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-card p-5 shadow-sm">
          <h2 className="text-lg font-semibold">{dict.guestDetails}</h2>

          {isGuest ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1">
                <span className="text-sm font-medium">{dict.firstName || 'Ism'}</span>
                <Input
                  name="firstName"
                  autoComplete="given-name"
                  required
                  placeholder={dict.firstName || 'Ism'}
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-sm font-medium">{dict.lastName || 'Familiya'}</span>
                <Input
                  name="lastName"
                  autoComplete="family-name"
                  required
                  placeholder={dict.lastName || 'Familiya'}
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-sm font-medium">{dict.email || 'Elektron pochta'}</span>
                <Input
                  type="email"
                  name="email"
                  autoComplete="email"
                  required
                  placeholder="example@mail.com"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-sm font-medium">{dict.phone || 'Telefon raqami'}</span>
                <Input
                  type="tel"
                  name="phone"
                  autoComplete="tel"
                  required
                  placeholder="+998 90 123 45 67"
                />
              </label>
            </div>
          ) : (
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium">{dict.fullName}</span>
              <Input
                name="fullName"
                autoComplete="name"
                placeholder={dict.fullNamePlaceholder}
              />
            </label>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <DatePicker
                locale={locale}
                label={dict.checkIn}
                value={checkIn}
                onChange={setCheckIn}
                min={new Date().toISOString().split('T')[0]}
              />
              <input type="hidden" name="checkIn" value={checkIn} />
            </div>
            <div className="flex flex-col gap-1">
              <DatePicker
                locale={locale}
                label={dict.checkOut}
                value={checkOut}
                onChange={setCheckOut}
                min={checkIn || new Date().toISOString().split('T')[0]}
              />
              <input type="hidden" name="checkOut" value={checkOut} />
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-card p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            {dict.paymentMethod}
          </h2>
          <PaymentSelector defaultValue="click" name="paymentMethod" />
        </section>
      </div>

      <aside className="flex h-fit flex-col gap-3 rounded-2xl border border-slate-200 bg-card p-5 shadow-sm lg:sticky lg:top-24">
        <h2 className="text-lg font-semibold">{dict.summary}</h2>
        <div>
          <p className="font-medium">{vehicleName}</p>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">
            {formatSum(pricePerDaySum)} × {days} kun
          </span>
          <span>{formatSum(total)}</span>
        </div>
        <div className="flex justify-between border-t border-slate-200 pt-3 font-semibold">
          <span>{dict.total}</span>
          <span>{formatSum(total)}</span>
        </div>

        {days < 1 && <p className="text-sm text-amber-600">{dict.needDates}</p>}
        {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}

        <Button type="submit" variant="accent" size="lg" loading={pending} disabled={days < 1}>
          {dict.confirm}
        </Button>
      </aside>
    </form>
  );
}
