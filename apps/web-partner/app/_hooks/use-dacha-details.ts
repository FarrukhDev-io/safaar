"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { partners } from "../_lib/api";
import { useAuthStore } from "../_stores/auth-store";
import { getPrimaryHotel, primaryHotelQueryKey, usePrimaryHotel } from "./use-primary-hotel";
import { roomsQueryKey } from "./use-rooms";
import { roomTypesQueryKey } from "./use-room-types";

// `roomsQueryKey` ("partner","rooms") allaqachon `use-rooms.ts`'da BOSHQA
// shakl (`{allRooms, activeRooms}`, `listRooms()` orqali "birinchi" hotelga
// bog'liq) bilan band — shu kalitni shu yerda ham ishlatish keshni
// to'qnashtirib qo'yardi (masalan Dacha calendar/availability view ham
// `useRooms()` chaqiradi). Shu sabab Dacha narxi uchun alohida, mustaqil
// query key ishlatamiz.
const dachaRoomsQueryKey = ['partner', 'dacha-rooms'] as const;

export interface DachaDetails {
  landAreaSotix: number | null;
  hasOutdoorPool: boolean;
  hasIndoorPool: boolean;
  hasSauna: boolean;
  hasPlaystation: boolean;
  hasBilliards: boolean;
  capacityPeople: number | null;
  price: number | null;
}

const EMPTY_DETAILS: DachaDetails = {
  landAreaSotix: null,
  hasOutdoorPool: false,
  hasIndoorPool: false,
  hasSauna: false,
  hasPlaystation: false,
  hasBilliards: false,
  capacityPeople: null,
  price: null,
};

export function useDachaDetails() {
  const { data: hotel, isLoading: isHotelLoading } = usePrimaryHotel();
  const accessToken = useAuthStore((s) => s.tokens?.accessToken);

  const { data: rooms, isLoading: isRoomsLoading } = useQuery({
    queryKey: dachaRoomsQueryKey,
    queryFn: async () => {
      if (!hotel) return [];
      return partners.listRooms(hotel.id, accessToken);
    },
    enabled: Boolean(accessToken && hotel),
  });

  const activeRoom = rooms?.find((r) => r.status === 'active');

  const data: DachaDetails = hotel
    ? {
        landAreaSotix: hotel.land_area_sotix ?? null,
        hasOutdoorPool: hotel.has_outdoor_pool ?? false,
        hasIndoorPool: hotel.has_indoor_pool ?? false,
        hasSauna: hotel.has_sauna ?? false,
        hasPlaystation: hotel.has_playstation ?? false,
        hasBilliards: hotel.has_billiards ?? false,
        capacityPeople: hotel.capacity_people ?? null,
        price: activeRoom?.base_price ?? null,
      }
    : EMPTY_DETAILS;

  return { data, isLoading: (isHotelLoading && !hotel) || isRoomsLoading };
}

export function useUpdateDachaDetails() {
  const accessToken = useAuthStore((s) => s.tokens?.accessToken);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: DachaDetails) => {
      const hotel = await getPrimaryHotel(queryClient, accessToken);
      
      await partners.updateHotel(
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

      // Manage the single room_type / room for Dacha pricing
      const existingRooms = await partners.listRooms(hotel.id, accessToken);
      const existingRoomTypes = await partners.listRoomTypes(hotel.id, accessToken);
      
      let roomTypeId = existingRoomTypes[0]?.id;
      
      if (values.price !== null) {
        if (!roomTypeId) {
          const typeRes = await partners.createRoomType(hotel.id, {
            name: { uz: "Butun dacha" },
            code: "dacha-" + hotel.id.slice(0, 8),
            base_occupancy: values.capacityPeople ?? 6,
            max_adults: values.capacityPeople ?? 6,
            base_price: values.price,
            amenities: [],
          }, accessToken);
          roomTypeId = typeRes.id;
        } else {
          await partners.updateRoomType(hotel.id, roomTypeId, {
            name: { uz: "Butun dacha" },
            base_occupancy: values.capacityPeople ?? 6,
            max_adults: values.capacityPeople ?? 6,
            base_price: values.price,
          }, accessToken);
        }

        if (existingRooms.length === 0) {
          await partners.createRoom(hotel.id, {
            room_type_id: roomTypeId,
            code: "Dacha",
            base_price: values.price,
            status: 'active',
          }, accessToken);
        } else {
          await partners.updateRoom(hotel.id, existingRooms[0].id, {
            base_price: values.price,
            status: 'active',
          }, accessToken);
        }
      } else {
        if (existingRooms.length > 0) {
          await partners.updateRoom(hotel.id, existingRooms[0].id, {
            status: 'out_of_service',
          }, accessToken);
        }
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: primaryHotelQueryKey });
      void queryClient.invalidateQueries({ queryKey: dachaRoomsQueryKey });
      void queryClient.invalidateQueries({ queryKey: roomsQueryKey });
      void queryClient.invalidateQueries({ queryKey: roomTypesQueryKey });
    },
  });
}
