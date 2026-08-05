import { rawApi } from "../client";
import { camelizeKeys } from "../case";
import { toBookingView } from "../adapters";
import type { BookingView } from "../types";

export interface CreateHotelBookingInput {
  hotelId: string;
  roomId: string;
  checkIn: string;
  checkOut: string;
  guests?: number;
  paymentMethod?: string;
  guestName?: string;
  guestPhone?: string;
  guestEmail?: string;
  slotTime?: string;
  totalPrice?: number;
  source?: string;
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
    const raw = await rawApi.post<unknown>(
      "/bookings/hotel",
      {
        hotel_id: input.hotelId,
        room_id: input.roomId,
        check_in: input.checkIn,
        check_out: input.checkOut,
        rooms: 1,
        adults: input.guests ?? 1,
        payment_method: input.paymentMethod ?? "click",
        guest_name: input.guestName,
        guest_phone: input.guestPhone,
        guest_email: input.guestEmail,
        slot_time: input.slotTime,
        total_price: input.totalPrice,
        source: input.source,
      },
      options,
    );
    return toBookingView(camelizeKeys(raw));
  },

  /** `GET /bookings/:id` — bron tafsiloti. */
  async getBooking(id: string, options?: { token?: string }): Promise<BookingView> {
    const raw = await rawApi.get<unknown>(`/bookings/${encodeURIComponent(id)}`, options);
    return toBookingView(camelizeKeys(raw));
  },

  /** `POST /bookings/bus` — avtobus broni yaratish. */
  async createBusBooking(
    input: CreateBusBookingInput,
    options?: { token?: string },
  ): Promise<BookingView> {
    const raw = await rawApi.post<unknown>(
      "/bookings/bus",
      {
        trip_id: input.tripId,
        seats: input.seats,
        payment_method: input.paymentMethod ?? "click",
      },
      options,
    );
    return toBookingView(camelizeKeys(raw));
  },

  /** `POST /bookings/:id/cancel-preview` — bekor qilish jarimasini hisoblash. */
  async cancelPreview(id: string, options?: { token?: string }): Promise<any> {
    return rawApi.post<any>(`/bookings/${encodeURIComponent(id)}/cancel-preview`, {}, options);
  },

  /** `POST /bookings/:id/cancel` — bronni bekor qilish. */
  async cancelBooking(id: string, reason?: string, options?: { token?: string }): Promise<BookingView> {
    const raw = await rawApi.post<unknown>(
      `/bookings/${encodeURIComponent(id)}/cancel`,
      { reason },
      options,
    );
    return toBookingView(camelizeKeys(raw));
  },

  /** `GET /bookings/:id/messages` — chat xabarlari. */
  async getMessages(id: string, options?: { token?: string }): Promise<any[]> {
    return rawApi.get<any[]>(`/bookings/${encodeURIComponent(id)}/messages`, options);
  },

  /** `POST /bookings/:id/messages` — chatga xabar yuborish. */
  async sendMessage(id: string, body: string, options?: { token?: string }): Promise<any> {
    return rawApi.post<any>(
      `/bookings/${encodeURIComponent(id)}/messages`,
      { body },
      options,
    );
  },
};
