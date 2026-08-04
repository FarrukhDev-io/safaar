import { request, requestFormData } from '../client';
import type {
  BackendBooking,
  BackendBed,
  BackendDashboard,
  BackendHotel,
  BackendPage,
  BackendRoom,
} from '../adapters';

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
