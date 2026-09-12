"use client";

import { create } from "zustand";
import type { BookingStatus } from "@safaar/types";
import type {
  Partner,
  PartnerRequest,
  AdminManagedUser,
  AdminHotelBooking,
  AdminBusBooking,
  AdminRestaurantBooking,
  CmsBanner,
  AdminListing,
} from "@/types/admin";

interface AdminState {
  partners: Partner[];
  partnerRequests: PartnerRequest[];
  users: AdminManagedUser[];
  hotelBookings: AdminHotelBooking[];
  busBookings: AdminBusBooking[];
  restaurantBookings: AdminRestaurantBooking[];
  cmsBanners: CmsBanner[];
  listings: AdminListing[];
  /** Hamkor va bron sahifalaridagi "Ichki izoh" maydonlari — id bo'yicha. */
  partnerNotes: Record<string, string>;
  bookingNotes: Record<string, string>;

  // Partner Mutations
  setPartners: (partners: Partner[]) => void;
  setPartnerRequests: (requests: PartnerRequest[]) => void;
  setPartnerRequestNote: (id: string, note: string) => void;
  setPartnerNote: (id: string, note: string) => void;
  setBookingNote: (id: string, note: string) => void;

  // User Mutations
  setUsers: (users: AdminManagedUser[]) => void;

  // Booking Mutations
  setHotelBookings: (bookings: AdminHotelBooking[]) => void;
  setBusBookings: (bookings: AdminBusBooking[]) => void;
  updateBusBookingStatus: (id: string, status: BookingStatus) => void;
  setRestaurantBookings: (bookings: AdminRestaurantBooking[]) => void;
  updateRestaurantBookingStatus: (id: string, status: BookingStatus) => void;

  // CMS Banners Mutations
  setCmsBanners: (banners: CmsBanner[]) => void;

  // Listing Mutations
  setListings: (listings: AdminListing[]) => void;
}

export const useAdminStore = create<AdminState>((set) => ({
  partners: [],
  partnerRequests: [],
  users: [],
  hotelBookings: [],
  busBookings: [],
  restaurantBookings: [],
  cmsBanners: [],
  listings: [],
  partnerNotes: {},
  bookingNotes: {},

  setPartners: (partners) => set({ partners }),
  setPartnerRequests: (partnerRequests) => set({ partnerRequests }),

  setPartnerRequestNote: (id, adminNote) =>
    set((state) => ({
      partnerRequests: state.partnerRequests.map((r) =>
        r.id === id ? { ...r, adminNote } : r
      ),
    })),

  setPartnerNote: (id, note) =>
    set((state) => ({
      partnerNotes: { ...state.partnerNotes, [id]: note },
    })),

  setBookingNote: (id, note) =>
    set((state) => ({
      bookingNotes: { ...state.bookingNotes, [id]: note },
    })),

  // Listings
  setListings: (listings) => set({ listings }),

  // Users
  setUsers: (users) => set({ users }),

  // Bookings
  setHotelBookings: (hotelBookings) => set({ hotelBookings }),
  setBusBookings: (busBookings) => set({ busBookings }),
  updateBusBookingStatus: (id, status) =>
    set((state) => ({
      busBookings: state.busBookings.map((b) =>
        b.id === id ? { ...b, status } : b
      ),
    })),

  setRestaurantBookings: (restaurantBookings) => set({ restaurantBookings }),
  updateRestaurantBookingStatus: (id, status) =>
    set((state) => ({
      restaurantBookings: state.restaurantBookings.map((b) =>
        b.id === id ? { ...b, status } : b
      ),
    })),

  // CMS Banners
  setCmsBanners: (cmsBanners) => set({ cmsBanners }),
}));
