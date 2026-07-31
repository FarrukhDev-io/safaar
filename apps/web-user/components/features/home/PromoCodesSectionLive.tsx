"use client";

import { useCallback, useState } from "react";
import type { PromoView } from "@safaar/api-client";
import { api } from "@/lib/api";
import { useRealtimeEvent } from "@/lib/services/realtime/socket-provider";
import { PromoCodesSection } from "./PromoCodesSection";

/**
 * `PromoCodesSection`ning real-time o'rami — admin panelda promo-kod
 * o'zgarganda sahifani yangilamasdan ro'yxat darhol yangilanadi.
 */
export function PromoCodesSectionLive({
  initialPromos,
}: {
  initialPromos: PromoView[];
}) {
  const [promos, setPromos] = useState(initialPromos);

  const refresh = useCallback(() => {
    api.promos
      .listActive()
      .then(setPromos)
      .catch(() => {});
  }, []);

  useRealtimeEvent("promos.updated", refresh, [refresh]);

  return <PromoCodesSection promos={promos} />;
}
