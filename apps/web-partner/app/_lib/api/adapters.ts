import { BookingStatus } from '@safaar/types';
import { ReservationSource, RoomStatus } from '../domain/types';
import type {
  Room,
  FrontDeskStats,
  ReservationView,
  RoomType,
} from '../domain/types';
import {
  CancellationPolicy,
  ListingStatus,
  PhotoCategory,
  type Listing,
} from '../domain/listing';
import type {
  PartnerTeamMember,
  PartnerDocument,
  PartnerApiKey,
  PartnerWebhook,
  WithdrawalRequest,
} from './endpoints/partners';

type Localized =
  | string
  | { uz?: string; ru?: string; en?: string }
  | null
  | undefined;

export interface BackendPage<T> {
  items?: T[];
  data?: T[];
  total?: number;
}

export interface BackendHotel {
  id: string;
  slug?: string;
  name?: Localized;
  short_description?: Localized;
  description?: Localized;
  address?: string;
  city?: Localized;
  city_id?: string;
  latitude?: number;
  longitude?: number;
  nearby_places?: unknown;
  stars?: number;
  status?: string;
  amenities?: string[];
  images?: string[];
  image_ids?: string[];
  check_in_time?: string;
  check_out_time?: string;
  cancellation_policy_code?: string;
  smoking_allowed?: boolean;
  pets_allowed?: boolean;
  children_allowed?: boolean;
  extra_fees?: unknown;
}

export interface BackendRoom {
  id: string;
  room_type_id?: string;
  code?: string;
  floor?: number;
  name?: Localized;
  description?: string | null;
  image_url?: string | null;
  bed_type?: string | null;
  size_sqm?: number | null;
  amenities?: string[] | null;
  capacity?: number | null;
  base_occupancy?: number;
  max_adults?: number;
  max_children?: number;
  total_inventory?: number;
  base_price?: number;
  status?: string;
  housekeeping_status?: string;
  is_listed?: boolean;
}

export interface BackendBed {
  id: string;
  room_id: string;
  label: string;
  status?: string;
  is_listed?: boolean;
  nightly_price?: number | null;
}

export interface BackendBooking {
  id: string;
  user_id?: string;
  status?: string;
  check_in?: string;
  check_out?: string;
  slot_time?: string;
  total_amount?: number;
  paid_amount?: number;
  currency?: string;
  payment_method?: string;
  guest_name?: string;
  guest_phone?: string;
  guest_email?: string;
  customer_name?: string;
  customer_phone?: string;
  user_first_name?: string;
  user_last_name?: string;
  user_email?: string;
  user_phone?: string;
  room_type_name?: string;
  room_type_id?: string;
  room_number?: string;
  vehicle_id?: string;
  vehicle_name?: string;
  vehicle_plate_number?: string;
  price_snapshot?: {
    room_id?: string;
    room_type_id?: string;
    room_number?: string | null;
    bed_id?: string;
    slot_time?: string;
  };
  policy_snapshot?: {
    source?: string;
    slot_time?: string;
  };
  item?: {
    check_in?: string;
    check_out?: string;
    adults?: number;
    children?: number;
    rooms?: number;
    nights?: number;
  };
  created_at?: string;
}

export interface BackendTeamMember {
  id: string;
  organization_id?: string;
  email: string;
  full_name?: string | null;
  role: string;
  status: string;
  created_at: string;
  updated_at?: string;
}

export interface BackendDocument {
  id: string;
  organization_id?: string;
  type: string;
  file_id?: string;
  status: string;
  file_url?: string | null;
  file_name?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface BackendApiKey {
  id: string;
  organization_id?: string;
  name: string;
  key_prefix: string;
  scopes?: string[];
  status: string;
  created_at: string;
  updated_at?: string;
  api_key?: string;
}

export interface BackendWebhook {
  id: string;
  organization_id?: string;
  url: string;
  events: string[];
  status: string;
  secret_hash?: string | null;
  failed_deliveries?: number;
  created_at: string;
  updated_at?: string;
}

export interface BackendWithdrawal {
  id: string;
  organization_id?: string;
  amount: number | string;
  currency?: string;
  status: string;
  bank_account?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface BackendFinanceOverview {
  pending_balance: number | string;
  available_balance: number | string;
  currency: string;
}

export interface FinanceOverview {
  pendingBalance: number;
  availableBalance: number;
  currency: string;
}

export interface BackendLedgerEntry {
  id: string;
  partner_id: string;
  booking_id: string | null;
  type: string;
  amount: number | string;
  currency: string;
  created_at: string;
}

export interface LedgerEntry {
  id: string;
  bookingId: string | null;
  type: string;
  amount: number;
  currency: string;
  createdAt: string;
}

export interface BackendDashboard {
  today_bookings?: number;
  todayBookings?: number;
  month_revenue?: number;
  monthRevenue?: number;
  total_customers?: number;
  totalCustomers?: number;
  rating?: number;
  occupied_rooms?: number;
  total_rooms?: number;
}

function localized(value: Localized, fallback = ''): string {
  if (!value) return fallback;
  if (typeof value === 'string') return value;
  return value.uz ?? value.en ?? value.ru ?? fallback;
}

export function pageItems<T>(value: T[] | BackendPage<T>): T[] {
  if (Array.isArray(value)) return value;
  return value.items ?? value.data ?? [];
}

export function toListing(hotel: BackendHotel): Listing {
  const imageIds = hotel.image_ids ?? [];
  return {
    name: localized(hotel.name),
    shortDescription:
      localized(hotel.short_description) || localized(hotel.description),
    fullDescription: localized(hotel.description),
    status:
      hotel.status === 'published'
        ? ListingStatus.PUBLISHED
        : hotel.status === 'pending_review'
          ? ListingStatus.UNDER_REVIEW
          : hotel.status === 'hidden'
            ? ListingStatus.HIDDEN
            : ListingStatus.DRAFT,
    address: hotel.address ?? '',
    city: localized(hotel.city),
    latitude: hotel.latitude,
    longitude: hotel.longitude,
    stars: hotel.stars ?? 0,
    checkInTime: hotel.check_in_time ?? '',
    checkOutTime: hotel.check_out_time ?? '',
    amenities: hotel.amenities ?? [],
    photos:
      hotel.images?.map((url, index) => ({
        id: imageIds[index] ?? url,
        url,
        caption: '',
        category: PhotoCategory.OTHER,
        isCover: index === 0,
        order: index,
      })) ?? [],
    nearby: parseNearbyPlaces(hotel.nearby_places),
    cancellationPolicy: normalizeCancellationPolicy(
      hotel.cancellation_policy_code,
    ),
    smokingAllowed: Boolean(hotel.smoking_allowed),
    petsAllowed: Boolean(hotel.pets_allowed),
    childrenAllowed: hotel.children_allowed !== false,
    extraFees: parseExtraFees(hotel.extra_fees),
  };
}

export function toRoom(room: BackendRoom): Room {
  const roomTypeId = room.room_type_id ?? room.id;
  const status = normalizeRoomStatus(room.housekeeping_status);
  return {
    id: room.id,
    roomTypeId,
    number: room.code ?? '',
    floor: room.floor ?? 1,
    status,
    roomTypeName: localized(room.name),
    isListed: room.is_listed ?? room.status === 'active',
    nightlyPrice: room.base_price ?? undefined,
    _rawStatus: room.status,
  } as Room & { _rawStatus?: string };
}

export function toRoomType(room: BackendRoom): RoomType {
  return {
    id: room.id,
    name: localized(room.name, room.code ?? ''),
    description: room.description ?? undefined,
    capacity: room.capacity ?? room.max_adults ?? room.base_occupancy ?? 1,
    bedType: room.bed_type ?? undefined,
    sizeSqm: room.size_sqm ?? undefined,
    basePrice: room.base_price ?? 0,
    amenities: room.amenities ?? [],
    imageUrl: room.image_url ?? undefined,
  };
}

export function toBed(bed: BackendBed): import('../domain/types').Bed {
  return {
    id: bed.id,
    roomId: bed.room_id,
    label: bed.label,
    status: normalizeRoomStatus(bed.status),
    isListed: bed.is_listed ?? true,
    nightlyPrice: bed.nightly_price ?? undefined,
  };
}

export function toReservation(booking: BackendBooking): ReservationView {
  const checkIn = booking.check_in ?? booking.item?.check_in ?? '';
  const checkOut = booking.check_out ?? booking.item?.check_out ?? '';
  const roomTypeId =
    booking.room_type_id ?? booking.price_snapshot?.room_type_id ?? '';
  const fullName =
    booking.guest_name ||
    booking.customer_name ||
    [booking.user_first_name, booking.user_last_name].filter(Boolean).join(' ') ||
    "Noma'lum mehmon";
  const phone =
    booking.guest_phone || booking.customer_phone || booking.user_phone || "Kiritilmagan";
  return {
    id: booking.id,
    status: normalizeBookingStatus(booking.status),
    guest: {
      id: booking.user_id ?? booking.id,
      fullName,
      phone,
      email: booking.guest_email ?? booking.user_email ?? '',
    },
    roomTypeId,
    roomTypeName: booking.room_type_name ?? '',
    roomNumber:
      booking.room_number ?? booking.price_snapshot?.room_number ?? undefined,
    bedId: booking.price_snapshot?.bed_id,
    vehicleId: booking.vehicle_id,
    vehicleName: booking.vehicle_name,
    vehiclePlateNumber: booking.vehicle_plate_number,
    slotTime: normalizeSlotTime(
      booking.slot_time ??
        booking.policy_snapshot?.slot_time ??
        booking.price_snapshot?.slot_time,
    ),
    checkIn,
    checkOut,
    nights: booking.item?.nights ?? calculateNights(checkIn, checkOut),
    adults: booking.item?.adults ?? 0,
    children: booking.item?.children ?? 0,
    totalPrice: booking.total_amount ?? 0,
    paidAmount: booking.paid_amount ?? 0,
    paymentMethod: booking.payment_method,
    source: normalizeReservationSource(booking.policy_snapshot?.source),
    createdAt: booking.created_at ?? '',
  };
}

const TEAM_ROLES = ['admin', 'manager', 'staff'] as const;
const TEAM_STATUSES = ['active', 'invited', 'blocked'] as const;
const DOCUMENT_STATUSES = ['pending', 'approved', 'rejected'] as const;
const WITHDRAWAL_STATUSES = ['pending', 'approved', 'rejected', 'paid'] as const;

export function toTeamMember(raw: BackendTeamMember): PartnerTeamMember {
  const role = TEAM_ROLES.includes(raw.role as (typeof TEAM_ROLES)[number])
    ? (raw.role as PartnerTeamMember['role'])
    : 'staff';
  const status = TEAM_STATUSES.includes(
    raw.status as (typeof TEAM_STATUSES)[number],
  )
    ? (raw.status as PartnerTeamMember['status'])
    : 'invited';
  return {
    id: raw.id,
    name: raw.full_name || raw.email,
    email: raw.email,
    role,
    status,
    created_at: raw.created_at,
  };
}

export function toDocument(raw: BackendDocument): PartnerDocument {
  // Backend 'uploaded' — hujjat qabul qilingan, tekshiruv navbatida
  // ('pending' bilan bir xil ma'no, frontend uchun mos qiymatga o'giramiz).
  const status =
    raw.status === 'approved' || raw.status === 'rejected'
      ? raw.status
      : 'pending';
  return {
    id: raw.id,
    name: raw.file_name || `${raw.type}.pdf`,
    type: raw.type,
    status,
    url: raw.file_url ?? '',
    uploaded_at: raw.created_at,
  };
}

export function toApiKey(
  raw: BackendApiKey,
): PartnerApiKey & { key?: string } {
  return {
    id: raw.id,
    name: raw.name,
    keyPrefix: raw.key_prefix,
    createdAt: raw.created_at,
    key: raw.api_key,
  };
}

export function toWebhook(raw: BackendWebhook): PartnerWebhook {
  return {
    id: raw.id,
    url: raw.url,
    events: raw.events ?? [],
    isActive: raw.status === 'active',
    failedDeliveries: raw.failed_deliveries ?? 0,
    createdAt: raw.created_at,
  };
}

export interface BackendWebhookDelivery {
  id: string;
  webhook_id: string;
  event_type: string;
  status: string;
  payload?: unknown;
  response_status?: number | null;
  response_body?: string | null;
  attempted_at?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface WebhookDelivery {
  id: string;
  webhookId: string;
  eventType: string;
  status: string;
  responseStatus: number | null;
  responseBody: string | null;
  attemptedAt: string | null;
  createdAt: string;
}

export function toWebhookDelivery(raw: BackendWebhookDelivery): WebhookDelivery {
  return {
    id: raw.id,
    webhookId: raw.webhook_id,
    eventType: raw.event_type,
    status: raw.status,
    responseStatus: raw.response_status ?? null,
    responseBody: raw.response_body ?? null,
    attemptedAt: raw.attempted_at ?? null,
    createdAt: raw.created_at,
  };
}

export function toWithdrawal(raw: BackendWithdrawal): WithdrawalRequest {
  const status = WITHDRAWAL_STATUSES.includes(
    raw.status as (typeof WITHDRAWAL_STATUSES)[number],
  )
    ? (raw.status as WithdrawalRequest['status'])
    // Backend'da boshlang'ich holat "requested" deb ataladi.
    : raw.status === 'requested'
      ? 'pending'
      : 'pending';
  return {
    id: raw.id,
    amount: Number(raw.amount),
    status,
    requestDate: raw.created_at,
    bankAccount: raw.bank_account ?? '',
  };
}

export function toFinanceOverview(raw: BackendFinanceOverview): FinanceOverview {
  return {
    pendingBalance: Number(raw.pending_balance),
    availableBalance: Number(raw.available_balance),
    currency: raw.currency,
  };
}

export function toLedgerEntry(raw: BackendLedgerEntry): LedgerEntry {
  return {
    id: raw.id,
    bookingId: raw.booking_id,
    type: raw.type,
    amount: Number(raw.amount),
    currency: raw.currency,
    createdAt: raw.created_at,
  };
}

export function toFrontDeskStats(dashboard: BackendDashboard): FrontDeskStats {
  const totalRooms = dashboard.total_rooms ?? 0;
  const occupiedRooms = dashboard.occupied_rooms ?? 0;
  return {
    occupancyPercent:
      totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0,
    occupiedRooms,
    totalRooms,
    arrivalsToday: dashboard.today_bookings ?? dashboard.todayBookings ?? 0,
    departuresToday: 0,
    pendingReservations: 0,
    monthRevenue: dashboard.month_revenue ?? dashboard.monthRevenue ?? 0,
  };
}

function normalizeBookingStatus(status?: string): BookingStatus {
  const value = status?.toUpperCase();
  if (value && value in BookingStatus) {
    return BookingStatus[value as keyof typeof BookingStatus];
  }
  return BookingStatus.PENDING;
}

function normalizeRoomStatus(status?: string): RoomStatus {
  const value = status?.toUpperCase();
  if (value && value in RoomStatus) {
    return RoomStatus[value as keyof typeof RoomStatus];
  }
  return RoomStatus.VACANT_CLEAN;
}

/** Postgres `TIME` ustuni "19:00:00" qaytaradi — slotlar bilan solishtirish
 * uchun "HH:MM" formatiga qisqartiramiz. */
function normalizeSlotTime(value?: string): string | undefined {
  if (!value) return undefined;
  return value.slice(0, 5);
}

function normalizeReservationSource(source?: string): ReservationSource {
  const value = source?.toUpperCase();
  if (value && value in ReservationSource) {
    return ReservationSource[value as keyof typeof ReservationSource];
  }
  return 'safaar' as ReservationSource;
}

function calculateNights(checkIn: string, checkOut: string): number {
  if (!checkIn || !checkOut) return 0;
  const start = new Date(checkIn).getTime();
  const end = new Date(checkOut).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end)) return 0;
  return Math.max(1, Math.round((end - start) / (24 * 60 * 60 * 1000)));
}

function normalizeCancellationPolicy(value?: string): CancellationPolicy {
  const policy = value?.toUpperCase();
  if (policy && policy in CancellationPolicy) {
    return CancellationPolicy[policy as keyof typeof CancellationPolicy];
  }
  return CancellationPolicy.MODERATE;
}

function parseExtraFees(value: unknown): Listing['extraFees'] {
  if (!Array.isArray(value)) return [];
  return value
    .map((fee): Listing['extraFees'][number] | null => {
      if (!fee || typeof fee !== 'object') return null;
      const item = fee as Record<string, unknown>;
      const id = String(item.id ?? '').trim();
      const name = String(item.name ?? '').trim();
      const amount = Number(item.amount);
      const charge = String(item.charge ?? '');
      if (
        !id ||
        !name ||
        !Number.isFinite(amount) ||
        !['per_stay', 'per_night', 'per_person'].includes(charge)
      ) {
        return null;
      }
      return {
        id,
        name,
        amount,
        charge: charge as 'per_stay' | 'per_night' | 'per_person',
        required: item.required !== false,
      };
    })
    .filter((fee): fee is Listing['extraFees'][number] => Boolean(fee));
}

function parseNearbyPlaces(value: unknown): Listing['nearby'] {
  if (!Array.isArray(value)) return [];
  return value
    .map((place): Listing['nearby'][number] | null => {
      if (!place || typeof place !== 'object') return null;
      const item = place as Record<string, unknown>;
      const id = String(item.id ?? '').trim();
      const name = String(item.name ?? '').trim();
      const distance = String(item.distance ?? '').trim();
      if (!id || !name || !distance) return null;
      return { id, name, distance };
    })
    .filter((place): place is Listing['nearby'][number] => Boolean(place));
}
