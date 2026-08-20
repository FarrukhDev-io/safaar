"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { partners } from "../_lib/api";
import { useAuthStore } from "../_stores/auth-store";

export const vehiclesQueryKey = ["partner", "vehicles"] as const;

export type VehicleDraft = {
  name: string;
  plateNumber: string;
  seatsCount: number;
  pricePerDay: number;
  status: "active" | "inactive";
};

export function useVehicles() {
  const accessToken = useAuthStore((s) => s.tokens?.accessToken);
  const isBus = useAuthStore((s) => s.user?.partnerType === 'bus');
  
  const query = useQuery({
    queryKey: vehiclesQueryKey,
    queryFn: async () => {
      const data = await partners.listVehicles(accessToken);
      return data.map(v => ({
        id: v.id,
        name: v.name,
        plateNumber: v.plate_number,
        seatsCount: v.seats_count,
        pricePerDay: v.price_per_day,
        status: v.status,
      }));
    },
    enabled: Boolean(accessToken) && isBus,
  });

  return { 
    data: query.data ?? [], 
    isLoading: query.isLoading && !query.data 
  };
}

export function useCreateVehicle() {
  const accessToken = useAuthStore((s) => s.tokens?.accessToken);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: VehicleDraft) => {
      return partners.createVehicle({
        name: values.name,
        plate_number: values.plateNumber,
        seats_count: values.seatsCount,
        price_per_day: values.pricePerDay,
        status: values.status,
      }, accessToken);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: vehiclesQueryKey });
    },
  });
}

export function useUpdateVehicle() {
  const accessToken = useAuthStore((s) => s.tokens?.accessToken);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: Partial<VehicleDraft> }) => {
      const payload: Record<string, unknown> = {};
      if (values.name !== undefined) payload.name = values.name;
      if (values.plateNumber !== undefined) payload.plate_number = values.plateNumber;
      if (values.seatsCount !== undefined) payload.seats_count = values.seatsCount;
      if (values.pricePerDay !== undefined) payload.price_per_day = values.pricePerDay;
      if (values.status !== undefined) payload.status = values.status;
      
      return partners.updateVehicle(id, payload, accessToken);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: vehiclesQueryKey });
    },
  });
}
