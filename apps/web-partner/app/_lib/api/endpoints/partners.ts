import { request, requestFormData } from '../client';
import type {
  BackendBooking,
  BackendBed,
  BackendDashboard,
  BackendHotel,
  BackendPage,
  BackendRoom,
} from '../adapters';

// Transport (bus) hamkorlar uchun — mehmonxona `Room`/`Listing` domenidan
// mustaqil, chunki maydonlari butunlay boshqa (o'rindiqlar soni, davlat
// raqami va h.k.).
export interface BackendBusCompany {
  id: string;
  partner_organization_id?: string;
  name: string;
  status?: string;
  rating_average?: number;
  reviews_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface BackendVehicle {
  id: string;
  company_id?: string;
  name: string;
  plate_number?: string | null;
  seats_count: number;
  price_per_day?: number;
  seat_layout?: unknown;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PartnerDashboard {
  todayBookings: number;
  monthRevenue: number;
  totalCustomers: number;
  rating: number;
}

export interface PartnerProfile {
  id: string;
  brand_name?: string | null;
  legal_name?: string | null;
  tax_id?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  status?: string | null;
}

/** Hamkor bosh paneli ko'rsatkichlari (`GET /api/partners/dashboard`). */
export function getDashboard(token: string | null): Promise<PartnerDashboard> {
  return request<PartnerDashboard>('/partners/dashboard', { token });
}

export function getRawDashboard(token?: string | null) {
  return request<BackendDashboard>('/partners/dashboard', { token });
}

export function getProfile(token?: string | null) {
  return request<PartnerProfile>('/partners/profile', { token });
}

export function updateProfile(
  body: Record<string, unknown>,
  token?: string | null,
) {
  return request<PartnerProfile>('/partners/profile', {
    method: 'PATCH',
    body,
    token,
  });
}

export function listHotels(token?: string | null) {
  return request<BackendPage<BackendHotel> | BackendHotel[]>(
    '/partners/hotels',
    {
      token,
    },
  );
}

export function getHotel(id: string, token?: string | null) {
  return request<BackendHotel>(`/partners/hotels/${encodeURIComponent(id)}`, {
    token,
  });
}

export function createHotel(
  body: Record<string, unknown>,
  token?: string | null,
) {
  return request<BackendHotel>('/partners/hotels', {
    method: 'POST',
    body,
    token,
  });
}

export function updateHotel(
  id: string,
  body: Record<string, unknown>,
  token?: string | null,
) {
  return request<BackendHotel>(`/partners/hotels/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body,
    token,
  });
}

export function resetHotel(id: string, token?: string | null) {
  return request<BackendHotel>(
    `/partners/hotels/${encodeURIComponent(id)}/reset`,
    {
      method: 'POST',
      token,
    },
  );
}

export function submitHotelReview(id: string, token?: string | null) {
  return request<BackendHotel>(
    `/partners/hotels/${encodeURIComponent(id)}/submit-review`,
    {
      method: 'POST',
      token,
    },
  );
}

export function addHotelImage(
  hotelId: string,
  body: Record<string, unknown>,
  token?: string | null,
) {
  return request<{ hotel_id: string; image_id: string; image_url: string }>(
    `/partners/hotels/${encodeURIComponent(hotelId)}/images`,
    {
      method: 'POST',
      body,
      token,
    },
  );
}

export function deleteHotelImage(
  hotelId: string,
  imageId: string,
  token?: string | null,
) {
  return request<{ hotel_id: string; image_id: string; deleted: boolean }>(
    `/partners/hotels/${encodeURIComponent(hotelId)}/images/${encodeURIComponent(imageId)}`,
    {
      method: 'DELETE',
      token,
    },
  );
}

export function updateHotelImage(
  hotelId: string,
  imageId: string,
  body: Record<string, unknown>,
  token?: string | null,
) {
  return request<{
    id: string;
    url: string;
    caption?: string | null;
    category?: string | null;
    sort_order?: number;
    is_cover?: boolean;
  }>(
    `/partners/hotels/${encodeURIComponent(hotelId)}/images/${encodeURIComponent(imageId)}`,
    {
      method: 'PATCH',
      body,
      token,
    },
  );
}

export function uploadImage(file: File, token?: string | null) {
  const formData = new FormData();
  formData.set('file', file);
  return requestFormData<{ id: string; url: string }>(
    '/uploads/images',
    formData,
    {
      token,
    },
  );
}

export function listRooms(hotelId: string, token?: string | null) {
  return request<BackendRoom[]>(
    `/partners/hotels/${encodeURIComponent(hotelId)}/rooms`,
    { token },
  );
}

export function createRoom(
  hotelId: string,
  body: Record<string, unknown>,
  token?: string | null,
) {
  return request<BackendRoom>(
    `/partners/hotels/${encodeURIComponent(hotelId)}/rooms`,
    {
      method: 'POST',
      body,
      token,
    },
  );
}

export function updateRoom(
  hotelId: string,
  roomId: string,
  body: Record<string, unknown>,
  token?: string | null,
) {
  return request<BackendRoom>(
    `/partners/hotels/${encodeURIComponent(hotelId)}/rooms/${encodeURIComponent(roomId)}`,
    {
      method: 'PATCH',
      body,
      token,
    },
  );
}

export function deleteRoom(
  hotelId: string,
  roomId: string,
  token?: string | null,
) {
  return request<{ hotel_id: string; room_id: string; deleted: boolean }>(
    `/partners/hotels/${encodeURIComponent(hotelId)}/rooms/${encodeURIComponent(roomId)}`,
    {
      method: 'DELETE',
      token,
    },
  );
}

export function bulkCreateRooms(
  hotelId: string,
  body: Record<string, unknown>,
  token?: string | null,
) {
  return request<{
    ok: boolean;
    reason?: string;
    added: number;
    rooms: BackendRoom[];
  }>(`/partners/hotels/${encodeURIComponent(hotelId)}/rooms/bulk`, {
    method: 'POST',
    body,
    token,
  });
}

export function listBookings(token?: string | null) {
  return request<BackendPage<BackendBooking> | BackendBooking[]>(
    '/partners/bookings',
    { token },
  );
}

export function createBooking(
  body: Record<string, unknown>,
  token?: string | null,
) {
  return request<BackendBooking>('/partners/bookings', {
    method: 'POST',
    body,
    token,
  });
}

export function confirmBooking(id: string, token?: string | null) {
  return request<BackendBooking>(
    `/partners/bookings/${encodeURIComponent(id)}/confirm`,
    {
      method: 'POST',
      token,
    },
  );
}

export function rejectBooking(
  id: string,
  reason: string,
  token?: string | null,
) {
  return request<BackendBooking>(
    `/partners/bookings/${encodeURIComponent(id)}/reject`,
    {
      method: 'POST',
      body: { reason },
      token,
    },
  );
}

export function checkIn(id: string, token?: string | null) {
  return request<BackendBooking>(
    `/partners/bookings/${encodeURIComponent(id)}/check-in`,
    {
      method: 'POST',
      token,
    },
  );
}

export function assignRoom(
  id: string,
  roomNumber: string,
  token?: string | null,
  bedId?: string,
) {
  return request<BackendBooking>(
    `/partners/bookings/${encodeURIComponent(id)}/assign-room`,
    {
      method: 'POST',
      body: { roomNumber, bedId },
      token,
    },
  );
}

export function checkOut(id: string, token?: string | null) {
  return request<BackendBooking>(
    `/partners/bookings/${encodeURIComponent(id)}/complete`,
    {
      method: 'POST',
      token,
    },
  );
}

export function listRoomTypes(hotelId: string, token?: string | null) {
  return request<BackendRoom[]>(
    `/partners/hotels/${encodeURIComponent(hotelId)}/room-types`,
    { token },
  );
}

export function createRoomType(
  hotelId: string,
  body: Record<string, unknown>,
  token?: string | null,
) {
  return request<BackendRoom>(
    `/partners/hotels/${encodeURIComponent(hotelId)}/room-types`,
    {
      method: 'POST',
      body,
      token,
    },
  );
}

export function updateRoomType(
  hotelId: string,
  roomTypeId: string,
  body: Record<string, unknown>,
  token?: string | null,
) {
  return request<BackendRoom>(
    `/partners/hotels/${encodeURIComponent(hotelId)}/room-types/${encodeURIComponent(roomTypeId)}`,
    {
      method: 'PATCH',
      body,
      token,
    },
  );
}

export function deleteRoomType(
  hotelId: string,
  roomTypeId: string,
  token?: string | null,
) {
  return request<{ ok: boolean; reason?: string; deleted?: boolean }>(
    `/partners/hotels/${encodeURIComponent(hotelId)}/room-types/${encodeURIComponent(roomTypeId)}`,
    {
      method: 'DELETE',
      token,
    },
  );
}

export function listBeds(hotelId: string, token?: string | null) {
  return request<BackendBed[]>(
    `/partners/hotels/${encodeURIComponent(hotelId)}/beds`,
    {
      token,
    },
  );
}

export function createBed(
  hotelId: string,
  roomId: string,
  body: Record<string, unknown>,
  token?: string | null,
) {
  return request<BackendBed>(
    `/partners/hotels/${encodeURIComponent(hotelId)}/rooms/${encodeURIComponent(roomId)}/beds`,
    {
      method: 'POST',
      body,
      token,
    },
  );
}

export function generateBeds(
  hotelId: string,
  roomId: string,
  count: number,
  token?: string | null,
) {
  return request<{ ok: boolean; added: number; beds: BackendBed[] }>(
    `/partners/hotels/${encodeURIComponent(hotelId)}/rooms/${encodeURIComponent(roomId)}/beds/generate`,
    {
      method: 'POST',
      body: { count },
      token,
    },
  );
}

export function updateBed(
  hotelId: string,
  bedId: string,
  body: Record<string, unknown>,
  token?: string | null,
) {
  return request<BackendBed>(
    `/partners/hotels/${encodeURIComponent(hotelId)}/beds/${encodeURIComponent(bedId)}`,
    {
      method: 'PATCH',
      body,
      token,
    },
  );
}

export function deleteBed(
  hotelId: string,
  bedId: string,
  token?: string | null,
) {
  return request<{ hotel_id: string; bed_id: string; deleted: boolean }>(
    `/partners/hotels/${encodeURIComponent(hotelId)}/beds/${encodeURIComponent(bedId)}`,
    {
      method: 'DELETE',
      token,
    },
  );
}

export function updateListingGeneral(
  hotelId: string,
  body: object,
  token?: string | null,
) {
  return request<BackendHotel>(
    `/partners/hotels/${encodeURIComponent(hotelId)}/listing/general`,
    {
      method: 'PATCH',
      body,
      token,
    },
  );
}

export function updateListingLocation(
  hotelId: string,
  body: object,
  token?: string | null,
) {
  return request<BackendHotel>(
    `/partners/hotels/${encodeURIComponent(hotelId)}/listing/location`,
    {
      method: 'PATCH',
      body,
      token,
    },
  );
}

export function updateListingRules(
  hotelId: string,
  body: object,
  token?: string | null,
) {
  return request<BackendHotel>(
    `/partners/hotels/${encodeURIComponent(hotelId)}/listing/rules`,
    {
      method: 'PATCH',
      body,
      token,
    },
  );
}

export function updateListingAmenities(
  hotelId: string,
  amenities: string[],
  token?: string | null,
) {
  return request<BackendHotel>(
    `/partners/hotels/${encodeURIComponent(hotelId)}/listing/amenities`,
    {
      method: 'PATCH',
      body: { amenities },
      token,
    },
  );
}

export function updateListingStatus(
  hotelId: string,
  status: string,
  token?: string | null,
) {
  return request<BackendHotel>(
    `/partners/hotels/${encodeURIComponent(hotelId)}/listing/status`,
    {
      method: 'PATCH',
      body: { status },
      token,
    },
  );
}

// ---------------------------------------------------------------------------
// Transport (bus) — kompaniya e'loni + transport parki
// ---------------------------------------------------------------------------

/** `null` qaytadi (404 emas) — hali kompaniya yaratilmagan bo'lishi mumkin. */
export function getBusCompany(token?: string | null) {
  return request<BackendBusCompany | null>('/partners/bus-company', {
    token,
  });
}

export function createBusCompany(
  body: Record<string, unknown>,
  token?: string | null,
) {
  return request<BackendBusCompany>('/partners/bus-company', {
    method: 'POST',
    body,
    token,
  });
}

export function updateBusCompany(
  body: Record<string, unknown>,
  token?: string | null,
) {
  return request<BackendBusCompany>('/partners/bus-company', {
    method: 'PATCH',
    body,
    token,
  });
}

// TEAM MANAGEMENT
export interface PartnerTeamMember {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'staff';
  status: 'active' | 'invited' | 'blocked';
  last_login?: string;
  created_at: string;
}

export function listTeamMembers(token?: string | null) {
  return request<import('../adapters').BackendTeamMember[]>('/partner/team', { token });
}

export function inviteTeamMember(body: Record<string, unknown>, token?: string | null) {
  return request<import('../adapters').BackendTeamMember>('/partner/team', { method: 'POST', body, token });
}

export function updateTeamMember(id: string, body: Record<string, unknown>, token?: string | null) {
  return request<import('../adapters').BackendTeamMember>(`/partner/team/${id}`, { method: 'PATCH', body, token });
}

export function deleteTeamMember(id: string, token?: string | null) {
  return request<{ ok: boolean }>(`/partner/team/${id}`, { method: 'DELETE', token });
}

// DOCUMENTS
export interface PartnerDocument {
  id: string;
  name: string;
  type: string;
  status: 'pending' | 'approved' | 'rejected';
  url: string;
  uploaded_at: string;
}

export function listDocuments(token?: string | null) {
  return request<import('../adapters').BackendDocument[]>('/partner/documents', { token });
}

interface PresignResult {
  upload_url: string;
  method: string;
  headers?: Record<string, string>;
  url: string;
  mime_type: string;
}

/**
 * Hujjat yuklash 3 bosqichli: (1) presigned URL olish, (2) faylni
 * to'g'ridan-to'g'ri R2'ga PUT qilish, (3) natijani `media_files`ga
 * ro'yxatga olish. Backend `/partner/documents` esa faqat tayyor
 * `file_id`ni kutadi — shu sabab bu yerda zanjir sifatida qilingan.
 */
export async function uploadDocument(
  file: File,
  type: string,
  token?: string | null,
) {
  const presign = await request<PresignResult>('/uploads/presign', {
    method: 'POST',
    body: {
      type: 'document',
      mime_type: file.type,
      size: file.size,
      filename: file.name,
    },
    token,
  });

  const uploadResponse = await fetch(presign.upload_url, {
    method: presign.method,
    headers: presign.headers,
    body: file,
  });
  if (!uploadResponse.ok) {
    throw new Error("Fayl saqlash xizmatiga yuklab bo'lmadi");
  }

  const registered = await request<{ id: string }>('/uploads/documents', {
    method: 'POST',
    body: {
      url: presign.url,
      mime_type: presign.mime_type,
      size: file.size,
      caption: file.name,
    },
    token,
  });

  return request<import('../adapters').BackendDocument>('/partner/documents', {
    method: 'POST',
    body: { type, file_id: registered.id },
    token,
  });
}

// DEVELOPER API KEYS & WEBHOOKS
export interface PartnerApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  lastUsedAt?: string;
  createdAt: string;
}

export interface PartnerWebhook {
  id: string;
  url: string;
  events: string[];
  isActive: boolean;
  failedDeliveries: number;
  createdAt: string;
}

export function listApiKeys(token?: string | null) {
  return request<import('../adapters').BackendApiKey[]>('/partner/api-keys', { token });
}

export function createApiKey(body: Record<string, unknown>, token?: string | null) {
  return request<import('../adapters').BackendApiKey>('/partner/api-keys', { method: 'POST', body, token });
}

export function deleteApiKey(id: string, token?: string | null) {
  return request<{ ok: boolean }>(`/partner/api-keys/${id}`, { method: 'DELETE', token });
}

export function listWebhooks(token?: string | null) {
  return request<import('../adapters').BackendWebhook[]>('/partner/webhooks', { token });
}

export function createWebhook(body: Record<string, unknown>, token?: string | null) {
  return request<import('../adapters').BackendWebhook>('/partner/webhooks', { method: 'POST', body, token });
}

export function updateWebhook(id: string, body: Record<string, unknown>, token?: string | null) {
  return request<import('../adapters').BackendWebhook>(`/partner/webhooks/${id}`, { method: 'PATCH', body, token });
}

export function deleteWebhook(id: string, token?: string | null) {
  return request<{ ok: boolean }>(`/partner/webhooks/${id}`, { method: 'DELETE', token });
}

// FINANCE WITHDRAWALS
export interface WithdrawalRequest {
  id: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  requestDate: string;
  bankAccount: string;
}

export function getWithdrawals(token?: string | null) {
  return request<import('../adapters').BackendWithdrawal[]>('/partner/withdrawals', { token });
}

export function createWithdrawal(body: Record<string, unknown>, token?: string | null) {
  return request<import('../adapters').BackendWithdrawal>('/partner/withdrawals', { method: 'POST', body, token });
}

// VEHICLES (Rent-Car)

export function listVehicles(token?: string | null) {
  return request<BackendVehicle[]>('/partners/vehicles', { token });
}

export function createVehicle(
  body: Record<string, unknown>,
  token?: string | null,
) {
  return request<BackendVehicle>('/partners/vehicles', {
    method: 'POST',
    body,
    token,
  });
}

export function updateVehicle(
  id: string,
  body: Record<string, unknown>,
  token?: string | null,
) {
  return request<BackendVehicle>(
    `/partners/vehicles/${encodeURIComponent(id)}`,
    {
      method: 'PATCH',
      body,
      token,
    },
  );
}
