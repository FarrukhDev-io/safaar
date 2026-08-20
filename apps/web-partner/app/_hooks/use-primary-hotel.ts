"use client";

import { useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { pageItems } from "../_lib/api/adapters";
import { partners } from "../_lib/api";
import { useAuthStore } from "../_stores/auth-store";

export const primaryHotelQueryKey = ["partner", "primary-hotel"] as const;

async function fetchPrimaryHotel(token?: string | null) {
  let [hotel] = pageItems(await partners.listHotels(token));
  if (!hotel) {
    const user = useAuthStore.getState().user;
    const partnerType = user?.partnerType;
    if (partnerType && partnerType !== 'bus') {
      hotel = await partners.createHotel({ name: 'Yangi obyekt' }, token);
    }
  }
  return hotel;
}

/**
 * Sahifa yuklanganda bir nechta hook (listing, rooms, beds, ...) bir vaqtda
 * "asosiy obyekt"ni so'rashi mumkin. Har biri to'g'ridan-to'g'ri fetch
 * qilsa, obyekt hali yo'q hamkorda hammasi bo'sh ro'yxat ko'rib, bir vaqtda
 * POST /hotels yuborib, poyga (race) natijasida bir nechta obyekt yaratilishi
 * yoki backend'dagi slug to'qnashuvida xato qaytishi mumkin edi. Shu sabab
 * bu yerda React Query keshi (`ensureQueryData`) orqali chaqiriladi — bir xil
 * so'rov bir marta yuboriladi, qolganlar shu natijani kutib oladi.
 */
export function getPrimaryHotel(queryClient: QueryClient, token?: string | null) {
  return queryClient.ensureQueryData({
    queryKey: primaryHotelQueryKey,
    queryFn: () => fetchPrimaryHotel(token),
  });
}

export function usePrimaryHotel() {
  const accessToken = useAuthStore((s) => s.tokens?.accessToken);
  return useQuery({
    queryKey: primaryHotelQueryKey,
    queryFn: () => fetchPrimaryHotel(accessToken),
    enabled: Boolean(accessToken),
  });
}
