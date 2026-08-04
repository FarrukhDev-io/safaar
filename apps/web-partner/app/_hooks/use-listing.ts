'use client';

import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { pageItems, toListing } from '../_lib/api/adapters';
import { partners } from '../_lib/api';
import { useDataStore } from '../_stores/data-store';
import { useAuthStore } from '../_stores/auth-store';
import type {
  ListingLocationDraft,
  ListingGeneralDraft,
  ListingRulesDraft,
  PhotoDraft,
} from '../_stores/data-store';
import { ListingStatus, type Listing } from '../_lib/domain/listing';
import { getPrimaryHotel, primaryHotelQueryKey } from './use-primary-hotel';

export const listingQueryKey = ['partner', 'listing'] as const;

export function useListing() {
  const listing = useDataStore((s) => s.listing);
  const setListing = useDataStore((s) => s.setListing);
  const accessToken = useAuthStore((s) => s.tokens?.accessToken);
  const query = useQuery({
    queryKey: listingQueryKey,
    queryFn: async () => {
      const [hotel] = pageItems(await partners.listHotels(accessToken));
      return hotel ? toListing(hotel) : listing;
    },
    enabled: Boolean(accessToken),
  });

  useEffect(() => {
    if (!query.data) return;
    setListing(query.data);
  }, [query.data, setListing]);

  return {
    data: query.data ?? listing,
    isLoading: query.isLoading && !query.data,
  };
}

/** E'lon to'ldirilganligini tekshirish. */
export function useListingCompleteness() {
  const { data: listing } = useListing();
  const missing: string[] = [];
  if (listing.name.trim().length < 3) missing.push('Nomi juda qisqa');
  if (listing.shortDescription.trim().length < 20)
    missing.push("Qisqa tavsif to'ldirilmagan (min 20 belgi)");
  if (listing.fullDescription.trim().length < 100)
    missing.push('Batafsil tavsif juda qisqa (min 100 belgi)');
  if (listing.photos.length < 3) missing.push('Kamida 3 ta rasm kerak');
  if (listing.amenities.length < 3)
    missing.push('Kamida 3 ta qulaylik belgilash');
  if (!listing.address.trim()) missing.push('Manzil kiritilmagan');
  if (
    typeof listing.latitude !== 'number' ||
    typeof listing.longitude !== 'number'
  ) {
    missing.push('Xaritadagi nuqta belgilanmagan');
  }
  return { complete: missing.length === 0, missing };
}

function useListingMutation<TVariables>(
  mutationFn: (
    hotelId: string,
    token: string | null | undefined,
    variables: TVariables,
  ) => Promise<Listing>,
) {
  const accessToken = useAuthStore((s) => s.tokens?.accessToken);
  const setListing = useDataStore((s) => s.setListing);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (variables: TVariables) => {
      const hotel = await getPrimaryHotel(accessToken);
      return mutationFn(hotel.id, accessToken, variables);
    },
    onSuccess: (listing) => {
      setListing(listing);
      queryClient.setQueryData(listingQueryKey, listing);
      void queryClient.invalidateQueries({ queryKey: primaryHotelQueryKey });
    },
  });
}

export function useUpdateListingGeneral() {
  return useListingMutation<ListingGeneralDraft>((hotelId, token, values) =>
    partners
      .updateListingGeneral(
        hotelId,
        {
          name: values.name,
          shortDescription: values.shortDescription,
          fullDescription: values.fullDescription,
          stars: values.stars,
        },
        token,
      )
      .then(toListing),
  );
}

export function useUpdateListingLocation() {
  return useListingMutation<ListingLocationDraft>((hotelId, token, values) =>
    partners.updateListingLocation(hotelId, values, token).then(toListing),
  );
}

export function useUpdateListingRules() {
  return useListingMutation<ListingRulesDraft>((hotelId, token, values) =>
    partners.updateListingRules(hotelId, values, token).then(toListing),
  );
}

export function useUpdateListingAmenities() {
  return useListingMutation<string[]>((hotelId, token, amenities) =>
    partners.updateListingAmenities(hotelId, amenities, token).then(toListing),
  );
}

/** E'lonni butunlay tozalab, qayta to'ldirish uchun (qaytarib bo'lmaydi). */
export function useResetListing() {
  return useListingMutation<void>((hotelId, token) =>
    partners.resetHotel(hotelId, token).then(toListing),
  );
}

export function useUpdateListingStatus() {
  return useListingMutation<ListingStatus>((hotelId, token, status) => {
    const backendStatus =
      status === ListingStatus.UNDER_REVIEW
        ? 'pending_review'
        : status.toLowerCase();
    return partners
      .updateListingStatus(hotelId, backendStatus, token)
      .then((hotel) => ({
        ...useDataStore.getState().listing,
        status: toListing(hotel).status,
      }));
  });
}

export function useAddListingPhoto() {
  const accessToken = useAuthStore((s) => s.tokens?.accessToken);
  const setListing = useDataStore((s) => s.setListing);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ file, draft }: { file: File; draft: PhotoDraft }) => {
      const hotel = await getPrimaryHotel(accessToken);
      const upload = await partners.uploadImage(file, accessToken);
      await partners.addHotelImage(
        hotel.id,
        {
          fileId: upload.id,
          caption: draft.caption,
          category: draft.category,
        },
        accessToken,
      );
      return toListing(await partners.getHotel(hotel.id, accessToken));
    },
    onSuccess: (listing) => {
      setListing(listing);
      queryClient.setQueryData(listingQueryKey, listing);
      void queryClient.invalidateQueries({ queryKey: listingQueryKey });
    },
  });
}

export function useDeleteListingPhoto() {
  const accessToken = useAuthStore((s) => s.tokens?.accessToken);
  const setListing = useDataStore((s) => s.setListing);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (imageId: string) => {
      const hotel = await getPrimaryHotel(accessToken);
      await partners.deleteHotelImage(hotel.id, imageId, accessToken);
      return toListing(await partners.getHotel(hotel.id, accessToken));
    },
    onSuccess: (listing) => {
      setListing(listing);
      queryClient.setQueryData(listingQueryKey, listing);
      void queryClient.invalidateQueries({ queryKey: listingQueryKey });
    },
  });
}

export function useUpdateListingPhoto() {
  const accessToken = useAuthStore((s) => s.tokens?.accessToken);
  const setListing = useDataStore((s) => s.setListing);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      imageId,
      values,
    }: {
      imageId: string;
      values: Record<string, unknown>;
    }) => {
      const hotel = await getPrimaryHotel(accessToken);
      await partners.updateHotelImage(hotel.id, imageId, values, accessToken);
      return toListing(await partners.getHotel(hotel.id, accessToken));
    },
    onSuccess: (listing) => {
      setListing(listing);
      queryClient.setQueryData(listingQueryKey, listing);
      void queryClient.invalidateQueries({ queryKey: listingQueryKey });
    },
  });
}
