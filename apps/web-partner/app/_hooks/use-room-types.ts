"use client";

import { useQuery } from "@tanstack/react-query";
import { pageItems, toRoomType } from "../_lib/api/adapters";
import { partners } from "../_lib/api";
import { DACHA_UNIT_ROOM_TYPE_ID, useDataStore } from "../_stores/data-store";
import { useAuthStore } from "../_stores/auth-store";
import { isDacha } from "../_lib/utils/partner-labels";

export function useRoomTypes() {
  const accessToken = useAuthStore((s) => s.tokens?.accessToken);
  const dacha = isDacha(useAuthStore((s) => s.user?.partnerType));
  const rawFallback = useDataStore((s) => s.roomTypes);
  const fallback = dacha
    ? rawFallback
    : rawFallback.filter((rt) => rt.id !== DACHA_UNIT_ROOM_TYPE_ID);
  const query = useQuery({
    queryKey: ["partner", "room-types"],
    queryFn: async () => {
      try {
        const [hotel] = pageItems(await partners.listHotels(accessToken));
        if (!hotel) return fallback;
        return (await partners.listRoomTypes(hotel.id, accessToken)).map(toRoomType);
      } catch {
        return fallback;
      }
    },
  });

  return { data: query.data ?? fallback, isLoading: query.isLoading && !query.data };
}
