"use client";

import { useQuery } from "@tanstack/react-query";
import { pageItems, toRoom } from "../_lib/api/adapters";
import { partners } from "../_lib/api";
import { DACHA_UNIT_ROOM_ID, useDataStore } from "../_stores/data-store";
import { useAuthStore } from "../_stores/auth-store";
import { isDacha } from "../_lib/utils/partner-labels";

export function useRooms() {
  const accessToken = useAuthStore((s) => s.tokens?.accessToken);
  const dacha = isDacha(useAuthStore((s) => s.user?.partnerType));
  const rawFallback = useDataStore((s) => s.rooms);
  const fallback = dacha
    ? rawFallback
    : rawFallback.filter((r) => r.id !== DACHA_UNIT_ROOM_ID);
  const query = useQuery({
    queryKey: ["partner", "rooms"],
    queryFn: async () => {
      try {
        const [hotel] = pageItems(await partners.listHotels(accessToken));
        if (!hotel) return fallback;
        const rawRooms = await partners.listRooms(hotel.id, accessToken);
        return rawRooms.map(toRoom);
      } catch {
        return fallback;
      }
    },
  });

  return { data: query.data ?? fallback, isLoading: query.isLoading && !query.data };
}
