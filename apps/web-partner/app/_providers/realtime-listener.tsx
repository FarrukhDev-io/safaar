"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useSocket } from "../_hooks/use-socket";
import { listingQueryKey } from "../_hooks/use-listing";
import { primaryHotelQueryKey } from "../_hooks/use-primary-hotel";
import { isLimitedPartnerAccessStatus } from "../_lib/auth/access-status";
import { useAuthStore } from "../_stores/auth-store";

/**
 * Backend `RealtimeGateway`sidan e'lon holati o'zgarishi (admin
 * tasdiqladi/rad etdi) haqidagi hodisalarni tinglaydi va tegishli
 * react-query cache'larini bekor qiladi — hamkor sahifani qo'lda
 * yangilamasdan darhol yangi holatni ko'radi.
 */
export function RealtimeListener() {
  const accessStatus = useAuthStore((s) => s.user?.accessStatus);
  const limitedAccess = isLimitedPartnerAccessStatus(accessStatus);
  const { on } = useSocket({ enabled: !limitedAccess });
  const queryClient = useQueryClient();

  useEffect(() => {
    const refresh = () => {
      void queryClient.invalidateQueries({ queryKey: listingQueryKey });
      void queryClient.invalidateQueries({ queryKey: primaryHotelQueryKey });
    };

    const offModerated = on("hotel.moderation_changed", (...args) => {
      const payload = args[0] as { status?: string } | undefined;
      refresh();
      if (payload?.status === "published") {
        toast.success("E'lon admin tomonidan tasdiqlandi va nashr qilindi");
      } else if (payload?.status === "rejected") {
        toast.error("E'lon admin tomonidan rad etildi");
      }
    });
    const offChanged = on("hotel.listing_changed", refresh);

    return () => {
      offModerated?.();
      offChanged?.();
    };
  }, [on, queryClient]);

  return null;
}
