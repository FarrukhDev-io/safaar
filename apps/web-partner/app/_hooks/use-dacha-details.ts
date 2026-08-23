"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { partners } from "../_lib/api";
import { useAuthStore } from "../_stores/auth-store";
import { getPrimaryHotel, primaryHotelQueryKey, usePrimaryHotel } from "./use-primary-hotel";

export interface DachaDetails {
  landAreaSotix: number | null;
  hasOutdoorPool: boolean;
  hasIndoorPool: boolean;
  hasSauna: boolean;
  hasPlaystation: boolean;
  hasBilliards: boolean;
  capacityPeople: number | null;
}

const EMPTY_DETAILS: DachaDetails = {
  landAreaSotix: null,
  hasOutdoorPool: false,
  hasIndoorPool: false,
  hasSauna: false,
  hasPlaystation: false,
  hasBilliards: false,
  capacityPeople: null,
};

/** Dachaning basseyn/sauna/sotix kabi maxsus xususiyatlari — `hotels` jadvalidagi qo'shimcha ustunlar. */
export function useDachaDetails() {
  const { data: hotel, isLoading } = usePrimaryHotel();

  const data: DachaDetails = hotel
    ? {
        landAreaSotix: hotel.land_area_sotix ?? null,
        hasOutdoorPool: hotel.has_outdoor_pool ?? false,
        hasIndoorPool: hotel.has_indoor_pool ?? false,
        hasSauna: hotel.has_sauna ?? false,
        hasPlaystation: hotel.has_playstation ?? false,
        hasBilliards: hotel.has_billiards ?? false,
        capacityPeople: hotel.capacity_people ?? null,
      }
    : EMPTY_DETAILS;

  return { data, isLoading: isLoading && !hotel };
}

export function useUpdateDachaDetails() {
  const accessToken = useAuthStore((s) => s.tokens?.accessToken);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: DachaDetails) => {
      const hotel = await getPrimaryHotel(queryClient, accessToken);
      return partners.updateHotel(
        hotel.id,
        {
          land_area_sotix: values.landAreaSotix,
          has_outdoor_pool: values.hasOutdoorPool,
          has_indoor_pool: values.hasIndoorPool,
          has_sauna: values.hasSauna,
          has_playstation: values.hasPlaystation,
          has_billiards: values.hasBilliards,
          capacity_people: values.capacityPeople,
        },
        accessToken,
      );
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: primaryHotelQueryKey });
    },
  });
}
