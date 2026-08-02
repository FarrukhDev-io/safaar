"use client";

import { useCallback, useState } from "react";
import { PromoBar } from "./PromoBar";
import { useRealtimeEvent } from "@/lib/services/realtime/socket-provider";
import { getPromoBarConfig, type PromoBarConfig } from "@/lib/promo";

/**
 * `PromoBar`ning real-time o'rami: admin panelda promo-kod
 * qo'shilsa/tahrirlansa/o'chirilsa, sahifani yangilamasdan darhol
 * yangilanadi (`promos.updated` WebSocket hodisasi orqali).
 */
export function PromoBarLive({
  initialConfig,
  locale,
}: {
  initialConfig: PromoBarConfig | null;
  locale: string;
}) {
  const [config, setConfig] = useState(initialConfig);

  const refresh = useCallback(() => {
    getPromoBarConfig(locale)
      .then(setConfig)
      .catch(() => {});
  }, [locale]);

  useRealtimeEvent("promos.updated", refresh, [refresh]);

  return <PromoBar config={config} locale={locale} />;
}
