"use client";

import { create } from "zustand";
import { BookingStatus } from "@safaar/types";
import {
  mockGuests,
  mockReservations,
  mockRoomTypes,
  mockRooms,
  TODAY_ISO,
} from "../_lib/mocks/data";
import {
  ReservationSource,
  RoomStatus,
  type Bed,
  type FrontDeskStats,
  type GuestProfile,
  type ReservationView,
  type Room,
  type RoomType,
} from "../_lib/domain/types";
import {
  ListingStatus,
  PhotoCategory,
  type Listing,
  type ListingPhoto,
  type ExtraFee,
  type NearbyPlace,
  type CancellationPolicy,
} from "../_lib/domain/listing";
import { mockListing } from "../_lib/mocks/listing-mock";

/** Dacha uchun yagona birlik — umumiy mock ma'lumotlardan mustaqil, doimiy id. */
export const DACHA_UNIT_ROOM_ID = "room-unit-1";
export const DACHA_UNIT_ROOM_TYPE_ID = "rt-dacha-unit";

let reservationSeq = mockReservations.length;

/** Restoran-ga xos ekanligini bildiruvchi belgi — mavjud bo'lsa reseed qayta ishlamaydi. */
const RESTAURANT_SEED_MARKER = "halal";
const RESTAURANT_DEFAULT_AMENITIES = [
  "wifi",
  RESTAURANT_SEED_MARKER,
  "kids_menu",
  "bar",
  "outdoor_seating",
  "live_music",
  "parking",
  "family_friendly",
  "reservation_required",
  "ac",
];
const RESTAURANT_SHORT_DESCRIPTION =
  "Registon markazidan 200 metr uzoqlikda joylashgan, milliy va Yevropa taomlarini taklif etuvchi zamonaviy restoran.";
const RESTAURANT_FULL_DESCRIPTION =
  "Bizning restoranimiz tarixiy Registon ansambli yaqinida joylashgan. Mehmonlarga qulay stollar, ochiq terrasa, bepul Wi-Fi va bolalar menyusi taklif etiladi. Milliy va Yevropa taomlari professional oshpazlar tomonidan tayyorlanadi, kechqurun jonli musiqa dasturi bor.\n\nBiznes tushliklari, oilaviy kechki ovqatlar yoki katta tadbirlar uchun ideal joy.";

export interface WalkInDraft {
  fullName: string;
  phone: string;
  roomTypeId: string;
  roomNumber?: string;
  /** Faqat hostel: oldindan tanlangan yotoq. */
  bedId?: string;
  /** Faqat restoran: bron vaqt-sloti ("HH:MM"). */
  slotTime?: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  nights: number;
  totalPrice: number;
}

export interface RoomTypeDraft {
  name: string;
  description?: string;
  imageUrl?: string;
  bedType?: string;
  sizeSqm?: number;
  basePrice: number;
  capacity: number;
  amenities: string[];
}

export interface RoomDraft {
  number: string;
  floor: number;
  roomTypeId: string;
  status?: RoomStatus;
  isListed?: boolean;
  nightlyPrice?: number;
}

export interface BedDraft {
  roomId: string;
  label: string;
  status?: RoomStatus;
  isListed?: boolean;
  nightlyPrice?: number;
}

export interface BulkRoomsDraft {
  floor: number;
  /** Boshlanish raqami, masalan 101 */
  startNumber: number;
  count: number;
  roomTypeId: string;
}

export interface ListingGeneralDraft {
  name: string;
  shortDescription: string;
  fullDescription: string;
  stars: number;
}

export interface ListingRulesDraft {
  checkInTime: string;
  checkOutTime: string;
  cancellationPolicy: CancellationPolicy;
  smokingAllowed: boolean;
  petsAllowed: boolean;
  childrenAllowed: boolean;
}

export interface PhotoDraft {
  url: string;
  caption?: string;
  category: PhotoCategory;
}

export interface ListingLocationDraft {
  latitude: number;
  longitude: number;
}

interface DataState {
  reservations: ReservationView[];
  rooms: Room[];
  roomTypes: RoomType[];
  beds: Bed[];
  guests: GuestProfile[];
  listing: Listing;

  // Reservation mutations
  setReservations: (reservations: ReservationView[]) => void;
  confirmReservation: (id: string) => void;
  rejectReservation: (id: string) => void;
  checkIn: (id: string) => void;
  checkOut: (id: string) => void;
  addReservation: (draft: WalkInDraft) => ReservationView;

  assignRoom: (reservationId: string, roomNumber: string) => void;
  assignBed: (reservationId: string, bedId: string) => void;

  // Room status (housekeeping)
  setRoomStatus: (roomId: string, status: RoomStatus) => void;

  // Room type CRUD
  addRoomType: (draft: RoomTypeDraft) => RoomType;
  updateRoomType: (id: string, draft: RoomTypeDraft) => void;
  deleteRoomType: (id: string) => { ok: boolean; reason?: string };

  // Room CRUD
  addRoom: (draft: RoomDraft) => { ok: boolean; reason?: string; room?: Room };
  updateRoom: (id: string, draft: RoomDraft) => { ok: boolean; reason?: string };
  deleteRoom: (id: string) => { ok: boolean; reason?: string };
  bulkAddRooms: (draft: BulkRoomsDraft) => {
    ok: boolean;
    reason?: string;
    added: number;
    rooms?: Room[];
  };
  /** Dacha uchun: yagona xona turi + xona bo'lishini kafolatlaydi (idempotent). */
  ensureSingleUnitRoom: (defaultName: string) => Room;

  // Bed CRUD (faqat hostel dormitory xonalari uchun)
  addBed: (draft: BedDraft) => { ok: boolean; reason?: string; bed?: Bed };
  updateBed: (
    id: string,
    draft: Partial<Omit<BedDraft, "roomId">>,
  ) => { ok: boolean; reason?: string };
  deleteBed: (id: string) => { ok: boolean; reason?: string };
  /** Dormitory xonasi uchun N ta yotoq avtomatik yaratadi. */
  generateBedsForRoom: (roomId: string, count: number) => Bed[];

  // Listing (e'lon) mutations
  /** Restoran uchun: hotel-shaped demo tavsif/qulaylik/rasm ma'lumotlarini almashtiradi (idempotent). */
  ensureRestaurantListingSeed: () => void;
  updateListingGeneral: (draft: ListingGeneralDraft) => void;
  updateListingRules: (draft: ListingRulesDraft) => void;
  updateListingLocation: (draft: ListingLocationDraft) => void;
  setListingStatus: (status: ListingStatus) => void;
  toggleAmenity: (amenityId: string) => void;
  addPhoto: (draft: PhotoDraft) => ListingPhoto;
  removePhoto: (photoId: string) => void;
  setCoverPhoto: (photoId: string) => void;
  reorderPhoto: (photoId: string, direction: "up" | "down") => void;
  addNearby: (name: string, distance: string) => void;
  removeNearby: (id: string) => void;
  addExtraFee: (fee: Omit<ExtraFee, "id">) => void;
  removeExtraFee: (id: string) => void;

  // Computed
  getStats: () => FrontDeskStats;
  isListingComplete: () => {
    complete: boolean;
    missing: string[];
  };
}

/**
 * Mehmonxona staff demo ma'lumot ombori.
 *
 * Barcha tugmalar shu omborga yozadi va UI bir zumda yangilanadi.
 * Backend tayyor bo'lsa, har bir mutation real `request()` chaqirig'iga
 * almashtiriladi (TanStack Query mutations bilan).
 */
export const useDataStore = create<DataState>((set, get) => ({
  reservations: mockReservations,
  rooms: mockRooms,
  roomTypes: mockRoomTypes,
  beds: [],
  guests: mockGuests,
  listing: mockListing,

  setReservations: (reservations) => set({ reservations }),

  confirmReservation: (id) =>
    set((state) => ({
      reservations: state.reservations.map((r) =>
        r.id === id ? { ...r, status: BookingStatus.CONFIRMED } : r,
      ),
    })),

  rejectReservation: (id) =>
    set((state) => ({
      reservations: state.reservations.map((r) =>
        r.id === id ? { ...r, status: BookingStatus.CANCELLED } : r,
      ),
    })),

  checkIn: (id) =>
    set((state) => {
      const reservation = state.reservations.find((r) => r.id === id);
      const reservations = state.reservations.map((r) =>
        r.id === id ? { ...r, status: "IN_HOUSE" as const } : r,
      );
      if (!reservation) return { reservations };

      if (reservation.bedId) {
        const beds = state.beds.map((b) =>
          b.id === reservation.bedId
            ? {
                ...b,
                status: RoomStatus.OCCUPIED,
                occupant: {
                  guestName: reservation.guest.fullName,
                  reservationId: reservation.id,
                  checkOut: reservation.checkOut,
                },
              }
            : b,
        );
        return { reservations, beds };
      }

      const rooms = reservation.roomNumber
        ? state.rooms.map((rm) =>
            rm.number === reservation.roomNumber
              ? {
                  ...rm,
                  status: RoomStatus.OCCUPIED,
                  occupant: {
                    guestName: reservation.guest.fullName,
                    reservationId: reservation.id,
                    checkOut: reservation.checkOut,
                  },
                }
              : rm,
          )
        : state.rooms;
      return { reservations, rooms };
    }),

  assignRoom: (reservationId: string, roomNumber: string) =>
    set((state) => ({
      reservations: state.reservations.map((r) =>
        r.id === reservationId ? { ...r, roomNumber } : r,
      ),
    })),

  assignBed: (reservationId: string, bedId: string) =>
    set((state) => ({
      reservations: state.reservations.map((r) =>
        r.id === reservationId ? { ...r, bedId } : r,
      ),
    })),

  checkOut: (id) =>
    set((state) => {
      const reservation = state.reservations.find((r) => r.id === id);
      const reservations = state.reservations.map((r) =>
        r.id === id ? { ...r, status: BookingStatus.COMPLETED } : r,
      );
      if (!reservation) return { reservations };

      if (reservation.bedId) {
        const beds = state.beds.map((b) =>
          b.id === reservation.bedId
            ? { ...b, status: RoomStatus.VACANT_DIRTY, occupant: undefined }
            : b,
        );
        return { reservations, beds };
      }

      const rooms = reservation.roomNumber
        ? state.rooms.map((rm) =>
            rm.number === reservation.roomNumber
              ? {
                  ...rm,
                  status: RoomStatus.VACANT_DIRTY,
                  occupant: undefined,
                }
              : rm,
          )
        : state.rooms;
      return { reservations, rooms };
    }),

  addReservation: (draft) => {
    reservationSeq += 1;
    const id = `RES-${1000 + reservationSeq}`;
    const roomType = get().roomTypes.find((rt) => rt.id === draft.roomTypeId);
    const reservation: ReservationView = {
      id,
      status: BookingStatus.CONFIRMED,
      source: ReservationSource.WALK_IN,
      guest: {
        id: `g-walkin-${id}`,
        fullName: draft.fullName,
        phone: draft.phone,
      },
      roomTypeId: draft.roomTypeId,
      roomTypeName: roomType?.name ?? "—",
      roomNumber: draft.roomNumber,
      bedId: draft.bedId,
      slotTime: draft.slotTime,
      checkIn: draft.checkIn,
      checkOut: draft.checkOut,
      nights: draft.nights,
      adults: draft.adults,
      children: draft.children,
      totalPrice: draft.totalPrice,
      paidAmount: 0,
      createdAt: new Date().toISOString(),
    };
    set((state) => ({ reservations: [reservation, ...state.reservations] }));
    return reservation;
  },

  setRoomStatus: (roomId, status) =>
    set((state) => ({
      rooms: state.rooms.map((r) =>
        r.id === roomId
          ? {
              ...r,
              status,
              occupant: status === RoomStatus.OCCUPIED ? r.occupant : undefined,
            }
          : r,
      ),
    })),

  addRoomType: (draft) => {
    const id = `rt-${Date.now().toString(36)}`;
    const roomType: RoomType = { id, ...draft };
    set((state) => ({ roomTypes: [...state.roomTypes, roomType] }));
    return roomType;
  },

  updateRoomType: (id, draft) =>
    set((state) => ({
      roomTypes: state.roomTypes.map((rt) =>
        rt.id === id ? { ...rt, ...draft } : rt,
      ),
      // Bog'liq xonalarda turi nomini yangilash
      rooms: state.rooms.map((r) =>
        r.roomTypeId === id ? { ...r, roomTypeName: draft.name } : r,
      ),
    })),

  deleteRoomType: (id) => {
    const state = get();
    const inUse = state.rooms.some((r) => r.roomTypeId === id);
    if (inUse) {
      return {
        ok: false,
        reason: "Bu turdan foydalanayotgan xonalar bor. Avval ularni o'chiring yoki boshqa turga ko'chiring.",
      };
    }
    set({ roomTypes: state.roomTypes.filter((rt) => rt.id !== id) });
    return { ok: true };
  },

  addRoom: (draft) => {
    const state = get();
    if (state.rooms.some((r) => r.number === draft.number)) {
      return { ok: false, reason: `Xona ${draft.number} allaqachon mavjud.` };
    }
    const roomType = state.roomTypes.find((rt) => rt.id === draft.roomTypeId);
    if (!roomType) {
      return { ok: false, reason: "Xona turi topilmadi." };
    }
    const room: Room = {
      id: `room-${draft.number}`,
      number: draft.number,
      floor: draft.floor,
      roomTypeId: draft.roomTypeId,
      roomTypeName: roomType.name,
      isListed: true,
      nightlyPrice: roomType.basePrice,
      status: RoomStatus.VACANT_CLEAN,
    };
    set({ rooms: [...state.rooms, room] });
    return { ok: true, room };
  },

  updateRoom: (id, draft) => {
    const state = get();
    const existing = state.rooms.find((r) => r.id === id);
    if (!existing) return { ok: false, reason: "Xona topilmadi." };
    if (
      draft.number !== existing.number &&
      state.rooms.some((r) => r.number === draft.number)
    ) {
      return { ok: false, reason: `Xona ${draft.number} allaqachon mavjud.` };
    }
    const hasOccupiedBed = state.beds.some(
      (b) => b.roomId === existing.id && b.status === RoomStatus.OCCUPIED,
    );
    if (existing.status === RoomStatus.OCCUPIED || hasOccupiedBed) {
      return {
        ok: false,
        reason: "Bu xonada mehmon bor. Avval check-out qiling.",
      };
    }
    const roomType = state.roomTypes.find((rt) => rt.id === draft.roomTypeId);
    if (!roomType) {
      return { ok: false, reason: "Xona turi topilmadi." };
    }
    const nextStatus = draft.status ?? existing.status;
    set({
      rooms: state.rooms.map((r) =>
        r.id === id
          ? {
              ...r,
              number: draft.number,
              floor: draft.floor,
              roomTypeId: draft.roomTypeId,
              roomTypeName: roomType.name,
              status: nextStatus,
              isListed: draft.isListed ?? r.isListed,
              nightlyPrice: draft.nightlyPrice,
              occupant: nextStatus === RoomStatus.OCCUPIED ? r.occupant : undefined,
            }
          : r,
      ),
    });
    return { ok: true };
  },

  deleteRoom: (id) => {
    const state = get();
    const room = state.rooms.find((r) => r.id === id);
    if (!room) return { ok: false, reason: "Xona topilmadi." };
    const hasOccupiedBed = state.beds.some(
      (b) => b.roomId === id && b.status === RoomStatus.OCCUPIED,
    );
    if (room.status === RoomStatus.OCCUPIED || hasOccupiedBed) {
      return {
        ok: false,
        reason: "Bu xonada mehmon bor. Avval check-out qiling.",
      };
    }
    set({
      rooms: state.rooms.filter((r) => r.id !== id),
      beds: state.beds.filter((b) => b.roomId !== id),
    });
    return { ok: true };
  },

  bulkAddRooms: (draft) => {
    const state = get();
    const roomType = state.roomTypes.find((rt) => rt.id === draft.roomTypeId);
    if (!roomType) return { ok: false, reason: "Xona turi topilmadi.", added: 0 };
    if (draft.count <= 0 || draft.count > 200) {
      return { ok: false, reason: "Soni 1–200 oralig'ida bo'lishi kerak.", added: 0 };
    }

    const newRooms: Room[] = [];
    const conflicts: string[] = [];

    for (let i = 0; i < draft.count; i++) {
      const number = String(draft.startNumber + i);
      if (
        state.rooms.some((r) => r.number === number) ||
        newRooms.some((r) => r.number === number)
      ) {
        conflicts.push(number);
        continue;
      }
      newRooms.push({
        id: `room-${number}`,
        number,
        floor: draft.floor,
        roomTypeId: draft.roomTypeId,
        roomTypeName: roomType.name,
        status: RoomStatus.VACANT_CLEAN,
        isListed: true,
        nightlyPrice: roomType.basePrice,
      });
    }

    if (newRooms.length === 0) {
      return {
        ok: false,
        reason: `Barcha raqamlar allaqachon mavjud: ${conflicts.join(", ")}`,
        added: 0,
      };
    }

    set({ rooms: [...state.rooms, ...newRooms] });
    return {
      ok: true,
      added: newRooms.length,
      rooms: newRooms,
      ...(conflicts.length > 0
        ? { reason: `O'tkazib yuborilgan (mavjud): ${conflicts.join(", ")}` }
        : {}),
    };
  },

  ensureSingleUnitRoom: (defaultName) => {
    const state = get();
    const existing = state.rooms.find((r) => r.id === DACHA_UNIT_ROOM_ID);
    if (existing) return existing;

    const roomType: RoomType = {
      id: DACHA_UNIT_ROOM_TYPE_ID,
      name: defaultName,
      basePrice: 0,
      capacity: 2,
      amenities: [],
    };
    const room: Room = {
      id: DACHA_UNIT_ROOM_ID,
      number: "1",
      floor: 1,
      roomTypeId: roomType.id,
      roomTypeName: roomType.name,
      isListed: true,
      nightlyPrice: roomType.basePrice,
      status: RoomStatus.VACANT_CLEAN,
    };
    set({
      roomTypes: [...state.roomTypes, roomType],
      rooms: [...state.rooms, room],
    });
    return room;
  },

  addBed: (draft) => {
    const state = get();
    const room = state.rooms.find((r) => r.id === draft.roomId);
    if (!room) return { ok: false, reason: "Xona topilmadi." };
    const bed: Bed = {
      id: `bed-${Date.now().toString(36)}-${Math.round(Math.random() * 1000)}`,
      roomId: draft.roomId,
      label: draft.label,
      status: draft.status ?? RoomStatus.VACANT_CLEAN,
      isListed: draft.isListed ?? true,
      nightlyPrice: draft.nightlyPrice,
    };
    set({ beds: [...state.beds, bed] });
    return { ok: true, bed };
  },

  updateBed: (id, draft) => {
    const state = get();
    const existing = state.beds.find((b) => b.id === id);
    if (!existing) return { ok: false, reason: "Yotoq topilmadi." };
    if (draft.status !== undefined && existing.status === RoomStatus.OCCUPIED) {
      return {
        ok: false,
        reason: "Bu yotoqda mehmon bor. Avval check-out qiling.",
      };
    }
    set({
      beds: state.beds.map((b) =>
        b.id === id
          ? {
              ...b,
              label: draft.label ?? b.label,
              status: draft.status ?? b.status,
              isListed: draft.isListed ?? b.isListed,
              nightlyPrice: draft.nightlyPrice,
            }
          : b,
      ),
    });
    return { ok: true };
  },

  deleteBed: (id) => {
    const state = get();
    const bed = state.beds.find((b) => b.id === id);
    if (!bed) return { ok: false, reason: "Yotoq topilmadi." };
    if (bed.status === RoomStatus.OCCUPIED) {
      return {
        ok: false,
        reason: "Bu yotoqda mehmon bor. Avval check-out qiling.",
      };
    }
    set({ beds: state.beds.filter((b) => b.id !== id) });
    return { ok: true };
  },

  generateBedsForRoom: (roomId, count) => {
    const state = get();
    const newBeds: Bed[] = Array.from({ length: count }, (_, i) => ({
      id: `bed-${roomId}-${i + 1}`,
      roomId,
      label: `${i + 1}-o'rin`,
      status: RoomStatus.VACANT_CLEAN,
      isListed: true,
    }));
    set({ beds: [...state.beds, ...newBeds] });
    return newBeds;
  },

  // ─── Listing (e'lon) mutations ───────────────────────────────────

  ensureRestaurantListingSeed: () => {
    const state = get();
    if (state.listing.amenities.includes(RESTAURANT_SEED_MARKER)) return;
    set({
      listing: {
        ...state.listing,
        shortDescription: RESTAURANT_SHORT_DESCRIPTION,
        fullDescription: RESTAURANT_FULL_DESCRIPTION,
        amenities: RESTAURANT_DEFAULT_AMENITIES,
        photos: [],
      },
    });
  },

  updateListingGeneral: (draft) =>
    set((state) => ({
      listing: { ...state.listing, ...draft },
    })),

  updateListingRules: (draft) =>
    set((state) => ({
      listing: { ...state.listing, ...draft },
    })),

  updateListingLocation: (draft) =>
    set((state) => ({
      listing: { ...state.listing, ...draft },
    })),

  setListingStatus: (status) =>
    set((state) => ({
      listing: { ...state.listing, status },
    })),

  toggleAmenity: (amenityId) =>
    set((state) => {
      const has = state.listing.amenities.includes(amenityId);
      return {
        listing: {
          ...state.listing,
          amenities: has
            ? state.listing.amenities.filter((a) => a !== amenityId)
            : [...state.listing.amenities, amenityId],
        },
      };
    }),

  addPhoto: (draft) => {
    const id = `ph-${Date.now().toString(36)}`;
    const state = get();
    const isFirstPhoto = state.listing.photos.length === 0;
    const photo: ListingPhoto = {
      id,
      url: draft.url,
      caption: draft.caption,
      category: draft.category,
      isCover: isFirstPhoto,
      order: state.listing.photos.length,
    };
    set({
      listing: {
        ...state.listing,
        photos: [...state.listing.photos, photo],
      },
    });
    return photo;
  },

  removePhoto: (photoId) =>
    set((state) => {
      const photos = state.listing.photos.filter((p) => p.id !== photoId);
      const wasCover = state.listing.photos.find((p) => p.id === photoId)?.isCover;
      // Agar cover o'chirilsa, birinchini yangi cover qilamiz
      if (wasCover && photos.length > 0) {
        photos[0] = { ...photos[0], isCover: true };
      }
      // order'ni qayta hisoblash
      const reordered = photos.map((p, i) => ({ ...p, order: i }));
      return { listing: { ...state.listing, photos: reordered } };
    }),

  setCoverPhoto: (photoId) =>
    set((state) => ({
      listing: {
        ...state.listing,
        photos: state.listing.photos.map((p) => ({
          ...p,
          isCover: p.id === photoId,
        })),
      },
    })),

  reorderPhoto: (photoId, direction) =>
    set((state) => {
      const photos = [...state.listing.photos].sort(
        (a, b) => a.order - b.order,
      );
      const idx = photos.findIndex((p) => p.id === photoId);
      if (idx === -1) return state;
      const swapIdx = direction === "up" ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= photos.length) return state;
      [photos[idx], photos[swapIdx]] = [photos[swapIdx], photos[idx]];
      const reordered = photos.map((p, i) => ({ ...p, order: i }));
      return { listing: { ...state.listing, photos: reordered } };
    }),

  addNearby: (name, distance) =>
    set((state) => {
      const place: NearbyPlace = {
        id: `n-${Date.now().toString(36)}`,
        name,
        distance,
      };
      return {
        listing: {
          ...state.listing,
          nearby: [...state.listing.nearby, place],
        },
      };
    }),

  removeNearby: (id) =>
    set((state) => ({
      listing: {
        ...state.listing,
        nearby: state.listing.nearby.filter((n) => n.id !== id),
      },
    })),

  addExtraFee: (fee) =>
    set((state) => {
      const newFee: ExtraFee = { ...fee, id: `fee-${Date.now().toString(36)}` };
      return {
        listing: {
          ...state.listing,
          extraFees: [...state.listing.extraFees, newFee],
        },
      };
    }),

  removeExtraFee: (id) =>
    set((state) => ({
      listing: {
        ...state.listing,
        extraFees: state.listing.extraFees.filter((f) => f.id !== id),
      },
    })),

  isListingComplete: () => {
    const l = get().listing;
    const missing: string[] = [];
    if (l.name.trim().length < 3) missing.push("Nomi juda qisqa");
    if (l.shortDescription.trim().length < 20)
      missing.push("Qisqa tavsif to'ldirilmagan (min 20 belgi)");
    if (l.fullDescription.trim().length < 100)
      missing.push("Batafsil tavsif juda qisqa (min 100 belgi)");
    if (l.photos.length < 3) missing.push("Kamida 3 ta rasm kerak");
    if (l.amenities.length < 3) missing.push("Kamida 3 ta qulaylik belgilash");
    if (!l.address.trim()) missing.push("Manzil kiritilmagan");
    return { complete: missing.length === 0, missing };
  },

  getStats: () => {
    const { reservations, rooms, beds } = get();
    const today = TODAY_ISO;
    const occupied =
      beds.length > 0
        ? beds.filter((b) => b.status === RoomStatus.OCCUPIED).length
        : rooms.filter((r) => r.status === RoomStatus.OCCUPIED).length;
    const total = beds.length > 0 ? beds.length : rooms.length;
    const arrivals = reservations.filter(
      (r) => r.checkIn === today && r.status === BookingStatus.CONFIRMED,
    ).length;
    const departures = reservations.filter(
      (r) => r.checkOut === today && r.status === "IN_HOUSE",
    ).length;
    const pending = reservations.filter(
      (r) => r.status === BookingStatus.PENDING,
    ).length;
    return {
      occupancyPercent: total ? Math.round((occupied / total) * 100) : 0,
      totalRooms: total,
      occupiedRooms: occupied,
      arrivalsToday: arrivals,
      departuresToday: departures,
      pendingReservations: pending,
      monthRevenue: 18_450_000,
    };
  },
}));
