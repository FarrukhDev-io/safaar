"use client";

import { create } from "zustand";
import {
  mockPartners,
  mockPartnerRequests,
  mockUsers,
  mockHotelBookings,
  mockBusBookings,
  mockCmsBanners,
  mockListings,
  mockRegions,
  mockAmenities,
  mockPromos,
} from "./mock-data";
import type {
  Partner,
  PartnerRequest,
  AdminManagedUser,
  AdminHotelBooking,
  AdminBusBooking,
  CmsBanner,
  AdminListing,
  CatalogRegion,
  CatalogAmenity,
  PromoCode,
} from "@/types/admin";
import type { BookingStatus } from "@safaar/types";

interface AdminState {
  partners: Partner[];
  partnerRequests: PartnerRequest[];
  users: AdminManagedUser[];
  hotelBookings: AdminHotelBooking[];
  busBookings: AdminBusBooking[];
  cmsBanners: CmsBanner[];
  listings: AdminListing[];
  regions: CatalogRegion[];
  amenities: CatalogAmenity[];
  promoCodes: PromoCode[];
  /** Hamkor va bron sahifalaridagi "Ichki izoh" maydonlari — id bo'yicha. */
  partnerNotes: Record<string, string>;
  bookingNotes: Record<string, string>;

  // Partner Mutations
  setPartners: (partners: Partner[]) => void;
  setPartnerRequests: (requests: PartnerRequest[]) => void;
  updatePartnerStatus: (id: string, status: Partner["status"]) => void;
  updatePartnerCommission: (id: string, commissionPercent: number) => void;
  approvePartnerRequest: (id: string) => void;
  rejectPartnerRequest: (id: string, reason?: string) => void;
  setPartnerRequestNote: (id: string, note: string) => void;
  setPartnerNote: (id: string, note: string) => void;
  setBookingNote: (id: string, note: string) => void;

  // User Mutations
  setUsers: (users: AdminManagedUser[]) => void;
  updateUserStatus: (id: string, status: AdminManagedUser["status"]) => void;
  addUserBonus: (id: string, amount: number) => void;

  // Booking Mutations
  setHotelBookings: (bookings: AdminHotelBooking[]) => void;
  updateHotelBookingStatus: (id: string, status: BookingStatus) => void;
  setBusBookings: (bookings: AdminBusBooking[]) => void;
  updateBusBookingStatus: (id: string, status: BookingStatus) => void;

  // CMS Banners Mutations
  addBanner: (banner: Omit<CmsBanner, "id">) => void;
  updateBanner: (id: string, banner: Partial<CmsBanner>) => void;
  deleteBanner: (id: string) => void;
  toggleBannerStatus: (id: string) => void;

  // Listing Mutations
  approveListing: (id: string) => void;
  rejectListing: (id: string) => void;

  // Catalog Mutations
  addRegion: (region: Omit<CatalogRegion, "id">) => void;
  updateRegion: (id: string, region: Partial<CatalogRegion>) => void;
  deleteRegion: (id: string) => void;
  addAmenity: (amenity: Omit<CatalogAmenity, "id">) => void;
  updateAmenity: (id: string, amenity: Partial<CatalogAmenity>) => void;
  deleteAmenity: (id: string) => void;

  // Promo Mutations
  addPromo: (promo: Omit<PromoCode, "id" | "usedCount">) => void;
  updatePromo: (id: string, promo: Partial<PromoCode>) => void;
  deletePromo: (id: string) => void;
  togglePromoStatus: (id: string) => void;
}

export const useAdminStore = create<AdminState>((set) => ({
  partners: mockPartners,
  partnerRequests: mockPartnerRequests,
  users: mockUsers,
  hotelBookings: mockHotelBookings,
  busBookings: mockBusBookings,
  cmsBanners: mockCmsBanners,
  listings: mockListings,
  regions: mockRegions,
  amenities: mockAmenities,
  promoCodes: mockPromos,
  partnerNotes: {},
  bookingNotes: {},

  setPartners: (partners) => set({ partners }),
  setPartnerRequests: (partnerRequests) => set({ partnerRequests }),

  updatePartnerStatus: (id, status) =>
    set((state) => ({
      partners: state.partners.map((p) =>
        p.id === id ? { ...p, status } : p
      ),
    })),

  updatePartnerCommission: (id, commissionPercent) =>
    set((state) => ({
      partners: state.partners.map((p) =>
        p.id === id ? { ...p, commissionPercent } : p
      ),
    })),

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

  approvePartnerRequest: (id) =>
    set((state) => {
      const request = state.partnerRequests.find((r) => r.id === id);
      if (!request) return state;

      const newPartner: Partner = {
        id: `P-${Date.now()}`,
        companyName: request.companyName,
        type: request.type,
        contactPerson: request.contactPerson,
        phone: request.phone,
        email: request.email,
        city: request.city,
        address: request.address,
        commissionPercent: request.type === "hotel" ? 15 : 10,
        rating: 0,
        totalBookings: 0,
        totalRevenue: 0,
        status: "active",
        createdAt: new Date().toISOString(),
      };

      return {
        partnerRequests: state.partnerRequests.map((r) =>
          r.id === id ? { ...r, status: "approved" } : r
        ),
        partners: [newPartner, ...state.partners],
      };
    }),

  rejectPartnerRequest: (id, reason) =>
    set((state) => ({
      partnerRequests: state.partnerRequests.map((r) =>
        r.id === id ? { ...r, status: "rejected", reason } : r
      ),
    })),

  // Listings
  approveListing: (id) => 
    set((state) => ({
      listings: state.listings.map((l) => 
        l.id === id ? { ...l, status: "published" } : l
      ),
    })),
  rejectListing: (id) => 
    set((state) => ({
      listings: state.listings.map((l) => 
        l.id === id ? { ...l, status: "rejected" } : l
      ),
    })),

  // Users
  setUsers: (users) => set({ users }),
  updateUserStatus: (id, status) =>
    set((state) => ({
      users: state.users.map((u) =>
        u.id === id ? { ...u, status } : u
      ),
    })),
  addUserBonus: (id, amount) =>
    set((state) => ({
      users: state.users.map((u) =>
        u.id === id ? { ...u, bonusBalance: u.bonusBalance + amount } : u
      ),
    })),

  // Bookings
  setHotelBookings: (hotelBookings) => set({ hotelBookings }),
  updateHotelBookingStatus: (id, status) =>
    set((state) => ({
      hotelBookings: state.hotelBookings.map((b) =>
        b.id === id ? { ...b, status } : b
      ),
    })),
    
  setBusBookings: (busBookings) => set({ busBookings }),
  updateBusBookingStatus: (id, status) =>
    set((state) => ({
      busBookings: state.busBookings.map((b) =>
        b.id === id ? { ...b, status } : b
      ),
    })),
    
  // CMS Banners
  addBanner: (banner) =>
    set((state) => {
      const newBanner = { ...banner, id: `BN-${Date.now()}` };
      return { cmsBanners: [...state.cmsBanners, newBanner].sort((a, b) => a.order - b.order) };
    }),
  updateBanner: (id, banner) =>
    set((state) => ({
      cmsBanners: state.cmsBanners.map((b) =>
        b.id === id ? { ...b, ...banner } : b
      ).sort((a, b) => a.order - b.order),
    })),
  deleteBanner: (id) =>
    set((state) => ({
      cmsBanners: state.cmsBanners.filter((b) => b.id !== id),
    })),
  toggleBannerStatus: (id) =>
    set((state) => ({
      cmsBanners: state.cmsBanners.map((b) =>
        b.id === id ? { ...b, isActive: !b.isActive } : b
      ),
    })),

  // Catalog — Regions
  addRegion: (region) =>
    set((state) => ({
      regions: [...state.regions, { ...region, id: `R-${Date.now()}` }],
    })),
  updateRegion: (id, region) =>
    set((state) => ({
      regions: state.regions.map((r) => (r.id === id ? { ...r, ...region } : r)),
    })),
  deleteRegion: (id) =>
    set((state) => ({
      regions: state.regions.filter((r) => r.id !== id),
    })),

  // Catalog — Amenities
  addAmenity: (amenity) =>
    set((state) => ({
      amenities: [...state.amenities, { ...amenity, id: `A-${Date.now()}` }],
    })),
  updateAmenity: (id, amenity) =>
    set((state) => ({
      amenities: state.amenities.map((a) => (a.id === id ? { ...a, ...amenity } : a)),
    })),
  deleteAmenity: (id) =>
    set((state) => ({
      amenities: state.amenities.filter((a) => a.id !== id),
    })),

  // Promos
  addPromo: (promo) =>
    set((state) => ({
      promoCodes: [...state.promoCodes, { ...promo, id: `PR-${Date.now()}`, usedCount: 0 }],
    })),
  updatePromo: (id, promo) =>
    set((state) => ({
      promoCodes: state.promoCodes.map((p) => (p.id === id ? { ...p, ...promo } : p)),
    })),
  deletePromo: (id) =>
    set((state) => ({
      promoCodes: state.promoCodes.filter((p) => p.id !== id),
    })),
  togglePromoStatus: (id) =>
    set((state) => ({
      promoCodes: state.promoCodes.map((p) =>
        p.id === id ? { ...p, isActive: !p.isActive } : p
      ),
    })),
}));
