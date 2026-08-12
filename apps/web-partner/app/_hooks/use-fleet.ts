"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { partners } from "../_lib/api";
import type { BackendBusCompany, BackendVehicle } from "../_lib/api/endpoints/partners";
import { useAuthStore } from "../_stores/auth-store";

export const busCompanyQueryKey = ["partner", "bus-company"] as const;
export const vehiclesQueryKey = ["partner", "vehicles"] as const;

/**
 * Transport (bus) hamkorining "e'loni" — mehmonxona `Listing`sidan farqli
 * o'laroq, atayin `getPrimaryHotel()`dagi kabi yashirin avtomatik
 * yaratish YO'Q (bir nechta hook bir vaqtda o'qib, poyga holatida ikki
 * marta yaratib yubormasligi uchun — xuddi shu turdagi bug shu sessiyada
 * `getPrimaryHotel()` uchun allaqachon topilib tuzatilgan edi). Kompaniya
 * hali yo'q bo'lsa `null` qaytadi, va foydalanuvchi aniq "Yaratish"
 * tugmasini bosgandagina `useCreateBusCompany()` chaqiriladi.
 */
export function useBusCompany() {
  const accessToken = useAuthStore((s) => s.tokens?.accessToken);
  return useQuery({
    queryKey: busCompanyQueryKey,
    queryFn: () => partners.getBusCompany(accessToken),
    enabled: Boolean(accessToken),
  });
}

export function useCreateBusCompany() {
  const accessToken = useAuthStore((s) => s.tokens?.accessToken);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      partners.createBusCompany({ name }, accessToken),
    onSuccess: (company: BackendBusCompany) => {
      queryClient.setQueryData(busCompanyQueryKey, company);
    },
  });
}

export function useUpdateBusCompany() {
  const accessToken = useAuthStore((s) => s.tokens?.accessToken);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      partners.updateBusCompany({ name }, accessToken),
    onSuccess: (company: BackendBusCompany) => {
      queryClient.setQueryData(busCompanyQueryKey, company);
    },
  });
}

const EMPTY_VEHICLES: BackendVehicle[] = [];

export function useVehicles() {
  const accessToken = useAuthStore((s) => s.tokens?.accessToken);
  const query = useQuery({
    queryKey: vehiclesQueryKey,
    queryFn: () => partners.listVehicles(accessToken),
    enabled: Boolean(accessToken),
  });
  return {
    data: query.data ?? EMPTY_VEHICLES,
    isLoading: query.isLoading && !query.data,
  };
}

export interface VehicleDraft {
  name: string;
  plateNumber?: string;
  seatsCount: number;
}

export function useCreateVehicle() {
  const accessToken = useAuthStore((s) => s.tokens?.accessToken);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: VehicleDraft) =>
      partners.createVehicle(
        {
          name: values.name,
          plate_number: values.plateNumber,
          seats_count: values.seatsCount,
        },
        accessToken,
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: vehiclesQueryKey });
    },
  });
}

export function useUpdateVehicle() {
  const accessToken = useAuthStore((s) => s.tokens?.accessToken);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: Partial<VehicleDraft> & { status?: string } }) =>
      partners.updateVehicle(
        id,
        {
          name: values.name,
          plate_number: values.plateNumber,
          seats_count: values.seatsCount,
          status: values.status,
        },
        accessToken,
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: vehiclesQueryKey });
    },
  });
}
