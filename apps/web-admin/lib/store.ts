"use client";

import { create } from "zustand";
import type { 
  Partner, 
  PartnerRequest, 
  AdminManagedUser, 
  AdminHotelBooking, 
  AdminBusBooking,
  CmsBanner,
  AdminListing,
} from "@/types/admin";

interface AdminState {
  partners: Partner[];
  partnerRequests: PartnerRequest[];
  users: AdminManagedUser[];
  hotelBookings: AdminHotelBooking[];
  busBookings: AdminBusBooking[];
  cmsBanners: CmsBanner[];
  listings: AdminListing[];

  // Partner Mutations
  setPartners: (partners: Partner[]) => void;
  setPartnerRequests: (requests: PartnerRequest[]) => void;

  // User Mutations
  setUsers: (users: AdminManagedUser[]) => void;

  // Booking Mutations
  setHotelBookings: (bookings: AdminHotelBooking[]) => void;
  setBusBookings: (bookings: AdminBusBooking[]) => void;

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
  cmsBanners: [],
  listings: [],

  setPartners: (partners) => set({ partners }),
  setPartnerRequests: (partnerRequests) => set({ partnerRequests }),

  // Listings
  setListings: (listings) => set({ listings }),

  // Users
  setUsers: (users) => set({ users }),

  // Bookings
  setHotelBookings: (hotelBookings) => set({ hotelBookings }),
  setBusBookings: (busBookings) => set({ busBookings }),

  // CMS Banners
  setCmsBanners: (cmsBanners) => set({ cmsBanners }),
}));
