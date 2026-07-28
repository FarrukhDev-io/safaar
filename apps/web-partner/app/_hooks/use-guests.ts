"use client";

import { useReservations } from "./use-reservations";
import type { GuestProfile } from "../_lib/domain/types";

export function useGuests() {
  const reservations = useReservations();
  const byId = new Map<string, GuestProfile>();
  for (const reservation of reservations.data) {
    const previous = byId.get(reservation.guest.id);
    byId.set(reservation.guest.id, {
      id: reservation.guest.id,
      fullName: reservation.guest.fullName,
      phone: reservation.guest.phone,
      email: reservation.guest.email,
      totalStays: (previous?.totalStays ?? 0) + 1,
      totalSpent: (previous?.totalSpent ?? 0) + reservation.totalPrice,
      lastStay:
        previous?.lastStay && previous.lastStay > reservation.checkOut
          ? previous.lastStay
          : reservation.checkOut,
      isVip:
        (previous?.totalSpent ?? 0) + reservation.totalPrice >= 10_000_000,
      tags: previous?.tags ?? [],
    });
  }
  const data = Array.from(byId.values());
  return { data, isLoading: reservations.isLoading };
}
