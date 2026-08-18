"use client";

import { RoomsView } from "./rooms-view";
import { VehiclesView } from "./vehicles-view";
import { useAuthStore } from "../../_stores/auth-store";
import { hasBuses } from "../../_lib/utils/partner-labels";

export default function RoomsPage() {
  const partnerType = useAuthStore((s) => s.user?.partnerType);
  if (hasBuses(partnerType)) {
    return <VehiclesView />;
  }
  return <RoomsView />;
}
