"use client";

import { useQuery } from "@tanstack/react-query";
import { toFrontDeskStats } from "../_lib/api/adapters";
import { partners } from "../_lib/api";
import { useAuthStore } from "../_stores/auth-store";

export function useFrontDeskStats() {
  const accessToken = useAuthStore((s) => s.tokens?.accessToken);
  const query = useQuery({
    queryKey: ["partner", "dashboard"],
    queryFn: async () => toFrontDeskStats(await partners.getRawDashboard(accessToken)),
    enabled: Boolean(accessToken),
  });

  return {
    data:
      query.data ?? {
        occupancyPercent: 0,
        occupiedRooms: 0,
        totalRooms: 0,
        arrivalsToday: 0,
        departuresToday: 0,
        pendingReservations: 0,
        monthRevenue: 0,
      },
    isLoading: query.isLoading && !query.data,
    refetch: query.refetch,
    isFetching: query.isFetching,
  };
}
