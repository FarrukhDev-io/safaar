"use client";

import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toBed } from "../_lib/api/adapters";
import { partners } from "../_lib/api";
import { useAuthStore } from "../_stores/auth-store";
import { useDataStore, type BedDraft } from "../_stores/data-store";
import { getPrimaryHotel } from "./use-primary-hotel";
import type { Bed } from "../_lib/domain/types";
import { hasBeds } from "../_lib/utils/partner-labels";

export const bedsQueryKey = ["partner", "beds"] as const;

const EMPTY_BEDS: ReturnType<typeof toBed>[] = [];

export function useBeds() {
  const accessToken = useAuthStore((s) => s.tokens?.accessToken);
  const partnerType = useAuthStore((s) => s.user?.partnerType);
  const setBeds = useDataStore((s) => s.setBeds);
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: bedsQueryKey,
    queryFn: async () => {
      const hotel = await getPrimaryHotel(queryClient, accessToken);
      return (await partners.listBeds(hotel.id, accessToken)).map(toBed);
    },
    enabled: Boolean(accessToken) && hasBeds(partnerType),
  });

  useEffect(() => {
    if (query.data) setBeds(query.data);
  }, [query.data, setBeds]);

  return { data: query.data ?? EMPTY_BEDS, isLoading: query.isLoading && !query.data };
}

export function useCreateBed() {
  const accessToken = useAuthStore((s) => s.tokens?.accessToken);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: BedDraft) => {
      const hotel = await getPrimaryHotel(queryClient, accessToken);
      return toBed(
        await partners.createBed(
          hotel.id,
          values.roomId,
          {
            label: values.label,
            status: values.status,
            isListed: values.isListed,
            nightlyPrice: values.nightlyPrice,
          },
          accessToken,
        ),
      );
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: bedsQueryKey });
    },
  });
}

export function useUpdateBed() {
  const accessToken = useAuthStore((s) => s.tokens?.accessToken);
  const queryClient = useQueryClient();
  const setBeds = useDataStore((s) => s.setBeds);

  const applyPatch = (
    beds: Bed[],
    id: string,
    values: Partial<Omit<BedDraft, "roomId">>,
  ) => beds.map((bed) => (bed.id === id ? { ...bed, ...values } : bed));

  return useMutation({
    mutationFn: async ({
      id,
      values,
    }: {
      id: string;
      values: Partial<Omit<BedDraft, "roomId">>;
    }) => {
      const hotel = await getPrimaryHotel(queryClient, accessToken);
      return toBed(await partners.updateBed(hotel.id, id, values, accessToken));
    },
    onMutate: async ({ id, values }) => {
      await queryClient.cancelQueries({ queryKey: bedsQueryKey });
      const previousQuery = queryClient.getQueryData<Bed[]>(bedsQueryKey);
      const previousStore = useDataStore.getState().beds;

      queryClient.setQueryData<Bed[]>(bedsQueryKey, (current) =>
        current ? applyPatch(current, id, values) : current,
      );
      setBeds(applyPatch(previousStore, id, values));

      return { previousQuery, previousStore };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousQuery) {
        queryClient.setQueryData(bedsQueryKey, context.previousQuery);
      }
      if (context?.previousStore) {
        setBeds(context.previousStore);
      }
    },
    onSuccess: (updatedBed) => {
      queryClient.setQueryData<Bed[]>(bedsQueryKey, (current) =>
        current
          ? current.map((bed) => (bed.id === updatedBed.id ? updatedBed : bed))
          : current,
      );
      setBeds(
        useDataStore
          .getState()
          .beds.map((bed) => (bed.id === updatedBed.id ? updatedBed : bed)),
      );
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: bedsQueryKey });
    },
  });
}

export function useDeleteBed() {
  const accessToken = useAuthStore((s) => s.tokens?.accessToken);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const hotel = await getPrimaryHotel(queryClient, accessToken);
      return partners.deleteBed(hotel.id, id, accessToken);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: bedsQueryKey });
    },
  });
}

export function useGenerateBeds() {
  const accessToken = useAuthStore((s) => s.tokens?.accessToken);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ roomId, count }: { roomId: string; count: number }) => {
      const hotel = await getPrimaryHotel(queryClient, accessToken);
      return partners.generateBeds(hotel.id, roomId, count, accessToken);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: bedsQueryKey });
    },
  });
}
