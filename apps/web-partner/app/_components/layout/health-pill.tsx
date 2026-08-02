"use client";

import { useQuery } from "@tanstack/react-query";
import { Wifi, WifiOff } from "lucide-react";
import { health } from "../../_lib/api";

export function HealthPill() {
  const query = useQuery({
    queryKey: ["health"],
    queryFn: health.getHealth,
    refetchInterval: 30_000,
    retry: false,
  });
  const online = query.data?.status === "ok";
  const Icon = online ? Wifi : WifiOff;

  return (
    <span
      role="status"
      className="hidden items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700 md:inline-flex dark:bg-brand-900/40 dark:text-brand-200"
    >
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {online ? "Backend online" : "Backend offline"}
    </span>
  );
}
