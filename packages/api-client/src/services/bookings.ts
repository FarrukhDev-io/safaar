import { rawApi } from '../client';
import { camelizeKeys } from '../case';
import { toBookingView } from '../adapters';
import type { BookingView } from '../types';

export interface CreateHotelBookingInput {
  hotelId: string;
  roomId: string;
  checkIn: string;
  checkOut: string;
  guests?: number;
  paymentMethod?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
}

export interface CreateBusBookingInput {
  tripId: string;
  seats: string[];
  paymentMethod?: string;
}

export const bookingsService = {
  /** `POST /bookings/hotel` — mehmonxona broni yaratish. */
  async createHotelBooking(
    input: CreateHotelBookingInput,
    options?: { token?: string },
  ): Promise<BookingView> {
    const fullName =
      input.fullName ??
      [input.firstName, input.lastName]
        .map((part) => part?.trim())
        .filter(Boolean)
        .join(' ');
    const guestName = input.guestName ?? fullName;
    const guestEmail = input.guestEmail ?? input.email;
    const guestPhone = input.guestPhone ?? input.phone;

    const raw = await rawApi.post<unknown>(
      '/bookings/hotel',
      {
        hotel_id: input.hotelId,
        room_id: input.roomId,
        check_in: input.checkIn,
        check_out: input.checkOut,
        rooms: 1,
        adults: input.guests ?? 1,
        payment_method: input.paymentMethod ?? 'click',
        firstName: input.firstName,
        lastName: input.lastName,
        fullName,
        email: input.email,
        phone: input.phone,
        guest_name: guestName,
        guest_email: guestEmail,
        guest_phone: guestPhone,
      },
      options,
    );
    return toBookingView(camelizeKeys(raw));
  },

  /** `GET /bookings/:id` — bron tafsiloti. */
  async getBooking(
    id: string,
    options?: { token?: string },
  ): Promise<BookingView> {
    const raw = await rawApi.get<unknown>(
      `/bookings/${encodeURIComponent(id)}`,
      options,
    );
    return toBookingView(camelizeKeys(raw));
  },

  /** `POST /bookings/bus` — avtobus broni yaratish. */
  async createBusBooking(
    input: CreateBusBookingInput,
    options?: { token?: string },
  ): Promise<BookingView> {
    const raw = await rawApi.post<unknown>(
      '/bookings/bus',
      {
        trip_id: input.tripId,
        seats: input.seats,
        payment_method: input.paymentMethod ?? 'click',
      },
      options,
    );
    return toBookingView(camelizeKeys(raw));
  },
};
