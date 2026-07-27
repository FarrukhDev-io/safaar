"use client";

import { useQuery } from "@tanstack/react-query";
import { pageItems, toListing } from "../_lib/api/adapters";
import { partners } from "../_lib/api";
import { useDataStore } from "../_stores/data-store";

/** E'lon (listing) — mehmonxona mijozga ko'rinadigan sahifasi. */
export function useListing() {
  const fallback = useDataStore((s) => s.listing);

  // Faqat real backend bilan sinxronlash uchun urinish — natija o'qilmaydi,
  // chunki `fallback` (Zustand) har doim haqiqiy manba hisoblanadi. Aks holda
  // React Query'ning `staleTime` keshi keyingi do'kon o'zgarishlarini
  // (masalan reseed yoki tahrirlarni) UI'dan berkitib qo'yadi.
  useQuery({
    queryKey: ["partner", "listing"],
    queryFn: async () => {
      try {
        const [hotel] = pageItems(await partners.listHotels());
        return hotel ? toListing(hotel) : fallback;
      } catch {
        return fallback;
      }
    },
  });

  return { data: fallback, isLoading: false };
}

/** E'lon to'ldirilganligini tekshirish. */
export function useListingCompleteness() {
  // Selector reaktivligi uchun listing'ni ko'rsatamiz
  const listing = useDataStore((s) => s.listing);
  const check = useDataStore((s) => s.isListingComplete);
  void listing;
  return check();
}
