"use client";

import { useQuery } from "@tanstack/react-query";
import { toFrontDeskStats } from "../_lib/api/adapters";
import { partners } from "../_lib/api";
import { useDataStore } from "../_stores/data-store";
import { useAuthStore } from "../_stores/auth-store";

/** Front Desk dashboard KPI'lari — store'dan reaktiv hisoblanadi. */
export function useFrontDeskStats() {
  // Reservations va rooms o'zgarganda statistika ham yangilanadi
  const reservations = useDataStore((s) => s.reservations);
  const rooms = useDataStore((s) => s.rooms);
  const getStats = useDataStore((s) => s.getStats);
  // Reactive bog'liqliklar: reservations va rooms o'zgarganda re-render
  void reservations;
  void rooms;
  const accessToken = useAuthStore((s) => s.tokens?.accessToken);
  const data = getStats();

  // Faqat real backend bilan sinxronlash uchun urinish — natija o'qilmaydi,
  // chunki `data` (Zustand'dan hisoblangan) har doim haqiqiy manba
  // hisoblanadi. Aks holda React Query'ning `staleTime` keshi keyingi
  // do'kon o'zgarishlarini UI'dan berkitib qo'yadi.
  const query = useQuery({
    queryKey: ["partner", "dashboard"],
    queryFn: async () => {
      try {
        return toFrontDeskStats(await partners.getRawDashboard(accessToken));
      } catch {
        return data;
      }
    },
  });

  return {
    data,
    isLoading: false,
    refetch: query.refetch,
    isFetching: query.isFetching,
  };
}
