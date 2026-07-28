"use client";

import { useQuery } from "@tanstack/react-query";
import { pageItems } from "../_lib/api/adapters";
import { partners } from "../_lib/api";
import { useAuthStore } from "../_stores/auth-store";

export const primaryHotelQueryKey = ["partner", "primary-hotel"] as const;

export async function getPrimaryHotel(token?: string | null) {
  const [hotel] = pageItems(await partners.listHotels(token));
  if (!hotel) {
    throw new Error("Hamkor listingi topilmadi");
  }
  return hotel;
}

export function usePrimaryHotel() {
  const accessToken = useAuthStore((s) => s.tokens?.accessToken);
  return useQuery({
    queryKey: primaryHotelQueryKey,
    queryFn: () => getPrimaryHotel(accessToken),
    enabled: Boolean(accessToken),
  });
}
