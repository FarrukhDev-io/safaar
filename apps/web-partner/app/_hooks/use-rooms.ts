"use client";

import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { pageItems, toRoom } from "../_lib/api/adapters";
import { partners } from "../_lib/api";
import { useAuthStore } from "../_stores/auth-store";
import { useDataStore, type BulkRoomsDraft, type RoomDraft } from "../_stores/data-store";
import { getPrimaryHotel } from "./use-primary-hotel";

export const roomsQueryKey = ["partner", "rooms"] as const;

const EMPTY_ROOMS: ReturnType<typeof toRoom>[] = [];

export function useRooms() {
  const accessToken = useAuthStore((s) => s.tokens?.accessToken);
  const setRooms = useDataStore((s) => s.setRooms);
  const query = useQuery({
    queryKey: roomsQueryKey,
    queryFn: async () => {
      const [hotel] = pageItems(await partners.listHotels(accessToken));
      if (!hotel) return [];
      const rawRooms = await partners.listRooms(hotel.id, accessToken);
      return rawRooms.map(toRoom);
    },
    enabled: Boolean(accessToken),
  });

  useEffect(() => {
    if (query.data) setRooms(query.data);
  }, [query.data, setRooms]);

  return { data: query.data ?? EMPTY_ROOMS, isLoading: query.isLoading && !query.data };
}

function roomBody(values: RoomDraft) {
  return {
    number: values.number,
    floor: values.floor,
    roomTypeId: values.roomTypeId,
    status: values.status,
    isListed: values.isListed,
    nightlyPrice: values.nightlyPrice,
  };
}

export function useCreateRoom() {
  const accessToken = useAuthStore((s) => s.tokens?.accessToken);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: RoomDraft) => {
      const hotel = await getPrimaryHotel(queryClient, accessToken);
      return toRoom(await partners.createRoom(hotel.id, roomBody(values), accessToken));
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: roomsQueryKey });
    },
  });
}

export function useUpdateRoom() {
  const accessToken = useAuthStore((s) => s.tokens?.accessToken);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: RoomDraft }) => {
      const hotel = await getPrimaryHotel(queryClient, accessToken);
      return toRoom(
        await partners.updateRoom(hotel.id, id, roomBody(values), accessToken),
      );
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: roomsQueryKey });
    },
  });
}

export function useDeleteRoom() {
  const accessToken = useAuthStore((s) => s.tokens?.accessToken);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const hotel = await getPrimaryHotel(queryClient, accessToken);
      return partners.deleteRoom(hotel.id, id, accessToken);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: roomsQueryKey });
    },
  });
}

export function useBulkCreateRooms() {
  const accessToken = useAuthStore((s) => s.tokens?.accessToken);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: BulkRoomsDraft & { basePrice?: number; capacity?: number }) => {
      const hotel = await getPrimaryHotel(queryClient, accessToken);
      return partners.bulkCreateRooms(
        hotel.id,
        {
          floor: values.floor,
          startNumber: values.startNumber,
          count: values.count,
          roomTypeId: values.roomTypeId,
          basePrice: values.basePrice,
          capacity: values.capacity,
        },
        accessToken,
      );
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: roomsQueryKey });
    },
  });
}
