"use client";

import { hasBuses } from "../../_lib/utils/partner-labels";
import { useAuthStore } from "../../_stores/auth-store";
import { FleetView } from "./fleet-view";
import { RoomsView } from "./rooms-view";

export function RoomsGate() {
  const partnerType = useAuthStore((s) => s.user?.partnerType);
  if (hasBuses(partnerType)) return <FleetView />;
  return <RoomsView />;
}
