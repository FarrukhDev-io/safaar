"use client";

import { hasBuses } from "../../_lib/utils/partner-labels";
import { useAuthStore } from "../../_stores/auth-store";
import { CompanyOverview } from "./company-overview";
import { ListingOverview } from "./listing-overview";

export function ListingGate() {
  const partnerType = useAuthStore((s) => s.user?.partnerType);
  if (hasBuses(partnerType)) return <CompanyOverview />;
  return <ListingOverview />;
}
