import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { BookingStatus, Role } from '@safaar/types';
import type { RequestActor } from '../common/actor';
import { EmailService } from '../infrastructure/email.service';
import {
  PostgresService,
  type PostgresTransaction,
} from '../infrastructure/postgres.service';
import { EventsService } from '../realtime/events.service';

/**
 * DB-level booking status constants (lowercase, matching pg enum values).
 */
const BS = {
  PENDING: BookingStatus.PENDING.toLowerCase(),
  AWAITING_PAYMENT: BookingStatus.AWAITING_PAYMENT.toLowerCase(),
  AWAITING_PARTNER_CONFIRMATION:
    BookingStatus.AWAITING_PARTNER_CONFIRMATION.toLowerCase(),
  CONFIRMED: BookingStatus.CONFIRMED.toLowerCase(),
  CANCELLED: BookingStatus.CANCELLED.toLowerCase(),
  COMPLETED: BookingStatus.COMPLETED.toLowerCase(),
  EXPIRED: BookingStatus.EXPIRED.toLowerCase(),
} as const;

interface HotelBookingRow {
  id: string;
  partner_organization_id: string;
}

interface HotelRoomRow {
  id: string;
  hotel_id: string;
  base_price: string | number;
}

interface TripRow {
  id: string;
  company_id: string;
  base_price: string | number;
}

interface TripSeatRow {
  id: string;
  seat_code: string;
  status: string;
  price: string | number;
}

interface BusCompanyRow {
  partner_organization_id: string;
}

interface BookingRow {
  id: string;
  user_id: string | null;
  partner_organization_id: string;
  total_amount: string | number;
  currency: string;
  payment_method: string;
  expires_at?: string | null;
  booking_number?: string;
  [key: string]: unknown;
}

@Injectable()
export class BookingsService {
  private readonly logger = new Logger(BookingsService.name);

  constructor(
    private readonly pg: PostgresService,
    private readonly events: EventsService,
    private readonly emailService: EmailService,
  ) {}

  async createHotel(
    actor: RequestActor | undefined,
    dto: Record<string, unknown>,
  ) {
    const userId = actor?.id ?? null;
    const hotelId = String(dto.hotel_id ?? dto.hotelId ?? '');
    const roomId = String(dto.room_id ?? dto.roomId ?? dto.roomTypeId ?? '');

    const [hotel] = await this.pg.query<
      HotelBookingRow & { partner_type?: string }
    >(
      `SELECT h.id, h.partner_organization_id, po.type AS partner_type
       FROM hotels h
       JOIN partner_organizations po ON po.id = h.partner_organization_id
       WHERE h.id = $1 AND h.deleted_at IS NULL AND h.status = 'published'`,
      [hotelId],
    );

    if (!hotel) {
      throw new NotFoundException({
        code: 'ROOM_NOT_AVAILABLE',
        message: 'Tanlangan sanalar uchun xona mavjud emas',
      });
    }

    const checkIn = String(dto.check_in ?? dto.checkIn ?? '');
    const checkOut = String(dto.check_out ?? dto.checkOut ?? '');
    const checkInMs = Date.parse(checkIn);
    const checkOutMs = Date.parse(checkOut);
    if (
      !Number.isFinite(checkInMs) ||
      !Number.isFinite(checkOutMs) ||
      checkOutMs <= checkInMs
    ) {
      throw new BadRequestException({
        code: 'BOOKING_DATES_INVALID',
        message: "check_in/check_out sanalari noto'g'ri",
      });
    }
    const nights = this.calculateNights(checkIn, checkOut);
    const rooms = Number(dto.rooms ?? 1);
    const firstName = this.optionalText(dto.firstName ?? dto.first_name);
    const lastName = this.optionalText(dto.lastName ?? dto.last_name);
    const fullName = this.optionalText(dto.fullName ?? dto.full_name);
    const composedName = [firstName, lastName].filter(Boolean).join(' ').trim();
    const guestName =
      this.optionalText(dto.guest_name ?? dto.guestName) ??
      fullName ??
      (composedName || '');
    const guestEmail =
      this.optionalText(
        dto.guest_email ?? dto.guestEmail ?? dto.email,
      )?.toLowerCase() ?? '';
    const guestPhone =
      this.optionalText(dto.guest_phone ?? dto.guestPhone ?? dto.phone) ?? '';

    const bookingType: 'hotel' | 'restaurant' =
      hotel?.partner_type === 'restaurant' || dto.type === 'restaurant'
        ? 'restaurant'
        : 'hotel';

    // Xona qulfi + sana-ziddiyat tekshiruvi + INSERT bitta tranzaksiya
    // ichida bo'lishi SHART — aks holda bir necha bir vaqtdagi so'rov
    // bitta xonani bir necha marta "band qilib" yuborishi mumkin (avval
    // shu yerda umuman himoya yo'q edi, `FOR UPDATE` tranzaksiyasiz
    // qulf sifatida ishlamas edi). Pattern — hamkor walk-in bron kodida
    // (`partners.service.ts createBooking`) allaqachon to'g'ri qo'llangan.
    const { booking, payment } = await this.pg.transaction(async (tx) => {
      const [room] = await tx.query<HotelRoomRow>(
        "SELECT id, base_price, hotel_id FROM hotel_rooms WHERE id = $1 AND hotel_id = $2 AND status = 'active' FOR UPDATE",
        [roomId, hotelId],
      );

      if (!room) {
        throw new NotFoundException({
          code: 'ROOM_NOT_AVAILABLE',
          message: 'Tanlangan sanalar uchun xona mavjud emas',
        });
      }

      const activeExclusions = [BS.CANCELLED, BS.EXPIRED, BS.COMPLETED];
      const conflicts = await tx.query<{ id: string }>(
        `SELECT id FROM bookings
         WHERE room_id = $1::uuid
           AND status NOT IN ($2, $3, $4)
           AND check_in < $5::date
           AND $6::date < check_out
         LIMIT 1`,
        [room.id, ...activeExclusions, checkOut, checkIn],
      );

      if (conflicts[0]) {
        throw new ConflictException({
          code: 'ROOM_ALREADY_BOOKED',
          message: 'Tanlangan sanalar uchun xona allaqachon band qilingan',
        });
      }

      const subtotal = Number(room.base_price) * nights * rooms;

      const booking = await this.createBooking(tx, userId, {
        type: bookingType,
        partner_organization_id: hotel.partner_organization_id,
        payment_method: this.paymentMethod(dto.payment_method),
        confirmation_mode: this.confirmationMode(dto.confirmation_mode),
        subtotal,
        hotel_id: hotel.id,
        trip_id: null,
        room_id: room.id,
        check_in: checkIn,
        check_out: checkOut,
        guest_name: guestName,
        guest_email: guestEmail,
        guest_phone: guestPhone,
        price_snapshot: {
          room_id: room.id,
          check_in: checkIn,
          check_out: checkOut,
          nights,
          rooms,
          adults: Number(dto.adults ?? dto.guests ?? 1),
          children: Number(dto.children ?? 0),
          guest: {
            first_name: firstName ?? null,
            last_name: lastName ?? null,
            name: guestName,
            email: guestEmail,
            phone: guestPhone,
          },
        },
      });

      const payment = await this.createPayment(tx, booking);
      return { booking, payment };
    });

    this.events.bookingStatusChanged(booking);
    this.events.partnerDashboardUpdated(booking.partner_organization_id);
    this.events.adminDashboardUpdated();
    void this.sendBookingConfirmationEmail(booking);
    return { booking, payment };
  }

  async createBus(
    actor: RequestActor | undefined,
    dto: Record<string, unknown>,
  ) {
    const currentActor = this.requireActor(actor);
    const tripId = String(dto.trip_id ?? dto.tripId ?? '');

    const [trip] = await this.pg.query<TripRow>(
      "SELECT id, company_id, base_price FROM trips WHERE id = $1 AND status = 'scheduled'",
      [tripId],
    );

    if (!trip) {
      throw new NotFoundException({
        code: 'TRIP_NOT_FOUND',
        message: 'Reys topilmadi',
      });
    }

    const [company] = await this.pg.query<BusCompanyRow>(
      'SELECT partner_organization_id FROM bus_companies WHERE id = $1',
      [trip.company_id],
    );
    if (!company?.partner_organization_id) {
      throw new NotFoundException({
        code: 'BUS_COMPANY_NOT_FOUND',
        message: 'Avtobus hamkori topilmadi',
      });
    }
    const partnerOrganizationId = company.partner_organization_id;
    const requestedSeatCodes = Array.isArray(dto.seats)
      ? dto.seats.map(String)
      : null;
    const expiresAt = new Date(Date.now() + 15 * 60_000);

    // O'rindiq qulfi + bandlik tekshiruvi + bron/to'lov yozish bitta
    // tranzaksiya ichida bo'lishi SHART — aks holda ikkita bir vaqtdagi
    // so'rov bitta o'rindiqni ikkalasiga ham "band qilib" berishi mumkin
    // (avval `FOR UPDATE` tranzaksiyasiz qulf sifatida ishlamas edi —
    // xuddi mehmonxona bron qilishdagi kabi, BUG-03'ning ikkinchisi).
    const { booking, payment } = await this.pg.transaction(async (tx) => {
      const seatCodes =
        requestedSeatCodes ??
        (
          await tx.query<{ seat_code: string }>(
            "SELECT seat_code FROM trip_seats WHERE trip_id = $1 AND status = 'available' ORDER BY seat_code LIMIT 1",
            [tripId],
          )
        ).map((s) => s.seat_code);

      if (seatCodes.length === 0) {
        throw new UnprocessableEntityException({
          code: 'SEAT_NOT_AVAILABLE',
          message: "O'rindiq band",
        });
      }

      const seats = await tx.query<TripSeatRow>(
        'SELECT * FROM trip_seats WHERE trip_id = $1 AND seat_code = ANY($2::text[]) FOR UPDATE',
        [tripId, seatCodes],
      );

      if (
        seats.length !== seatCodes.length ||
        seats.some((seat) => seat.status !== 'available')
      ) {
        throw new UnprocessableEntityException({
          code: 'SEAT_NOT_AVAILABLE',
          message: "O'rindiq band",
        });
      }

      const subtotal = seats.reduce((sum, seat) => sum + Number(seat.price), 0);

      const booking = await this.createBooking(tx, currentActor.id, {
        type: 'bus',
        partner_organization_id: partnerOrganizationId,
        payment_method: this.paymentMethod(dto.payment_method),
        confirmation_mode: this.confirmationMode(dto.confirmation_mode),
        subtotal,
        hotel_id: null,
        trip_id: trip.id,
        expires_at: expiresAt.toISOString(),
        price_snapshot: {
          seats: seats.map((s) => s.seat_code),
          passengers: dto.passengers ?? [],
        },
      });

      // O'rindiqlarni "band" deb belgilash — xuddi shu tranzaksiya
      // ichida, hali qulf ushlab turilganda.
      for (const seat of seats) {
        await tx.query(
          'UPDATE trip_seats SET status = $1, held_by_booking_id = $2, held_until = $3 WHERE id = $4',
          ['held', booking.id, booking.expires_at, seat.id],
        );
      }

      const payment = await this.createPayment(tx, booking);
      return { booking, payment };
    });

    this.events.bookingStatusChanged(booking);
    this.events.partnerDashboardUpdated(booking.partner_organization_id);
    this.events.adminDashboardUpdated();
    return { booking, payment };
  }

  async findOne(actor: RequestActor | undefined, id: string) {
    const booking = await this.assertBooking(id, actor);
    const [payment] = await this.pg.query(
      'SELECT * FROM payments WHERE booking_id = $1 ORDER BY created_at DESC LIMIT 1',
      [id],
    );
    return { ...booking, payment: payment ?? null };
  }

  /**
   * Login qilmagan (guest) mijoz o'z bronini xom ID orqali emas, balki
   * booking_number + email juftligi orqali qidiradi. Ikkalasi ham to'g'ri
   * kelmasa xuddi shu umumiy xabar qaytariladi — shu orqali "bron raqami
   * mavjud, lekin email noto'g'ri" holatini tashqi kuzatuvchi bilib
   * olmaydi (enumeration'ga qarshi).
   */
  async lookupBooking(bookingNumber: string, email: string) {
    const normalizedNumber = bookingNumber.trim();
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedNumber || !normalizedEmail) {
      throw new BadRequestException({
        code: 'BOOKING_LOOKUP_INVALID',
        message: 'Bron raqami va email kiritilishi shart',
      });
    }

    const [booking] = await this.pg.query<BookingRow>(
      `SELECT id, booking_number, type, status, currency, total_amount,
              hotel_id, trip_id, check_in, check_out, slot_time,
              guest_name, guest_email, created_at
       FROM bookings
       WHERE booking_number = $1 AND lower(guest_email) = $2
       LIMIT 1`,
      [normalizedNumber, normalizedEmail],
    );

    if (!booking) {
      throw new NotFoundException({
        code: 'BOOKING_NOT_FOUND',
        message: "Bron topilmadi. Bron raqami va email'ni tekshiring",
      });
    }

    const [payment] = await this.pg.query(
      "SELECT status, provider, amount, currency FROM payments WHERE booking_id = $1 ORDER BY created_at DESC LIMIT 1",
      [booking.id],
    );

    // Ichki moliyaviy maydonlar (commission_amount, partner_payable) va
    // to'liq guest kontakt ma'lumotlari qaytarilmaydi — email orqali
    // tasdiqlash JWT'dan zaifroq isbot, shuning uchun javob ataylab cheklangan.
    return {
      id: booking.id,
      booking_number: booking.booking_number,
      type: booking.type,
      status: booking.status,
      currency: booking.currency,
      total_amount: booking.total_amount,
      hotel_id: booking.hotel_id,
      trip_id: booking.trip_id,
      check_in: booking.check_in,
      check_out: booking.check_out,
      slot_time: booking.slot_time,
      guest_name: booking.guest_name,
      created_at: booking.created_at,
      payment: payment ?? null,
    };
  }

  async retryPayment(actor: RequestActor | undefined, id: string) {
    const booking = await this.assertBooking(id, actor);
    return this.createPayment(this.pg, booking);
  }

  async cancelPreview(actor: RequestActor | undefined, id: string) {
    const booking = await this.assertBooking(id, actor);
    const total = Number(booking.total_amount);
    const refundAmount = Math.round(total * 0.8);

    return {
      booking_id: id,
      currency: booking.currency,
      paid_amount: total,
      refund_amount: refundAmount,
      penalty_amount: total - refundAmount,
      policy: 'Flexible: 24 soatgacha 80% refund',
    };
  }

  async cancel(
    actor: RequestActor | undefined,
    id: string,
    body: Record<string, unknown>,
  ) {
    const booking = await this.assertBooking(id, actor);

    if (booking.status === BS.CANCELLED) {
      throw new UnprocessableEntityException({
        code: 'BOOKING_INVALID_STATUS',
        message: 'Bron allaqachon bekor qilingan',
      });
    }

    const now = new Date().toISOString();
    const reason = String(body.reason ?? 'Bekor qilindi');

    const [updated] = await this.pg.query(
      `UPDATE bookings
       SET status = $1, cancelled_at = $2, cancel_reason_text = $3, updated_at = $4
       WHERE id = $5
       RETURNING *`,
      [BS.CANCELLED, now, reason, now, id],
    );

    await this.addStatusHistory(
      this.pg,
      updated as Parameters<typeof this.addStatusHistory>[1],
      'cancelled',
      actor,
    );

    this.events.bookingStatusChanged(updated);
    return updated;
  }

  async voucher(actor: RequestActor | undefined, id: string) {
    const booking = await this.assertBooking(id, actor);
    return {
      booking_id: id,
      booking_number: booking.booking_number,
      format: 'pdf',
      download_url: `${this.publicOrigin()}/bookings/${id}/voucher`,
    };
  }

  async statusHistory(actor: RequestActor | undefined, id: string) {
    await this.assertBooking(id, actor);
    return this.pg.query(
      'SELECT * FROM booking_status_history WHERE booking_id = $1 ORDER BY created_at DESC',
      [id],
    );
  }

  conversation(_actor: RequestActor | undefined, id: string) {
    return {
      id: `conversation_${id}`,
      booking_id: id,
      participants: [],
    };
  }

  async messages(actor: RequestActor | undefined, id: string) {
    await this.assertBooking(id, actor);
    return this.pg.query(
      'SELECT * FROM booking_messages WHERE booking_id = $1 AND hidden_at IS NULL ORDER BY created_at ASC',
      [id],
    );
  }

  async sendMessage(
    actor: RequestActor | undefined,
    id: string,
    body: Record<string, unknown>,
  ) {
    await this.assertBooking(id, actor);
    const currentActor = this.requireActor(actor);
    const messageId = randomUUID();
    const now = new Date().toISOString();

    await this.pg.query(
      `INSERT INTO booking_messages (id, booking_id, sender_type, sender_id, message_type, body, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        messageId,
        id,
        currentActor.actorType,
        currentActor.id,
        'text',
        String(body.body ?? ''),
        now,
      ],
    );

    const msg = {
      id: messageId,
      booking_id: id,
      sender_type: currentActor.actorType,
      sender_id: currentActor.id,
      message_type: 'text',
      body: String(body.body ?? ''),
      created_at: now,
    };

    // Fetch booking for partner context
    const [booking] = await this.pg.query<{
      partner_organization_id?: string;
    }>('SELECT partner_organization_id FROM bookings WHERE id = $1', [id]);
    this.events.bookingMessageCreated(
      id,
      msg,
      booking?.partner_organization_id,
    );
    return msg;
  }

  async readMessage(
    actor: RequestActor | undefined,
    id: string,
    messageId: string,
  ) {
    await this.assertBooking(id, actor);
    const [message] = await this.pg.query(
      'SELECT * FROM booking_messages WHERE id = $1 AND booking_id = $2',
      [messageId, id],
    );

    if (!message) {
      throw new NotFoundException({
        code: 'BOOKING_CHAT_FORBIDDEN',
        message: 'Xabar topilmadi',
      });
    }

    return message;
  }

  async findByUser(userId: string) {
    return this.pg.query(
      'SELECT * FROM bookings WHERE user_id = $1 ORDER BY created_at DESC',
      [userId],
    );
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private requireActor(actor: RequestActor | undefined): RequestActor {
    if (!actor) {
      throw new UnauthorizedException({
        code: 'AUTH_TOKEN_INVALID',
        message: 'Sessiya topilmadi yoki token yaroqsiz',
      });
    }
    return actor;
  }

  private publicOrigin(): string {
    return (
      process.env.PUBLIC_API_ORIGIN ??
      `http://localhost:${process.env.PORT ?? '4000'}`
    ).replace(/\/$/, '');
  }

  private async createBooking(
    db: PostgresTransaction,
    userId: string | null,
    input: {
      type: 'hotel' | 'bus' | 'restaurant';
      partner_organization_id: string;
      payment_method: string;
      confirmation_mode: string;
      subtotal: number;
      hotel_id: string | null;
      trip_id: string | null;
      room_id?: string | null;
      check_in?: string | null;
      check_out?: string | null;
      expires_at?: string;
      price_snapshot: Record<string, unknown>;
      guest_name?: string;
      guest_email?: string;
      guest_phone?: string;
    },
  ) {
    const id = randomUUID();
    const now = new Date().toISOString();
    const commission = Math.round(input.subtotal * 0.12);
    const totalAmount = input.subtotal;
    const partnerPayable = input.subtotal - commission;
    const expiresAt =
      input.expires_at ?? new Date(Date.now() + 15 * 60_000).toISOString();
    const partnerConfirmationDeadline =
      input.confirmation_mode === 'request_confirmation'
        ? new Date(Date.now() + 30 * 60_000).toISOString()
        : null;

    const guestName = input.guest_name ?? null;
    const guestEmail = input.guest_email ?? null;
    const guestPhone = input.guest_phone ?? null;

    const bookingRow = {
      id,
      booking_number: bookingNumber(),
      user_id: userId,
      partner_organization_id: input.partner_organization_id,
      type: input.type,
      confirmation_mode: input.confirmation_mode,
      payment_method: input.payment_method,
      status: BS.PENDING,
      currency: 'UZS',
      subtotal: input.subtotal,
      discount_amount: 0,
      bonus_amount: 0,
      service_fee: 0,
      total_amount: totalAmount,
      commission_amount: commission,
      partner_payable: partnerPayable,
      hotel_id: input.hotel_id,
      trip_id: input.trip_id,
      room_id: input.room_id ?? null,
      check_in: input.check_in ?? null,
      check_out: input.check_out ?? null,
      partner_confirmation_deadline: partnerConfirmationDeadline,
      expires_at: expiresAt,
      confirmed_at: null,
      cancelled_at: null,
      cancel_reason_text: null,
      policy_snapshot: {},
      price_snapshot: input.price_snapshot,
      guest_name: guestName,
      guest_email: guestEmail,
      guest_phone: guestPhone,
      created_at: now,
      updated_at: now,
    };

    await db.query(
      `INSERT INTO bookings (
        id, booking_number, user_id, partner_organization_id,
        type, confirmation_mode, payment_method, status,
        currency, subtotal, discount_amount, bonus_amount, service_fee,
        total_amount, commission_amount, partner_payable,
        hotel_id, trip_id, room_id, check_in, check_out,
        partner_confirmation_deadline, expires_at,
        confirmed_at, cancelled_at, cancel_reason_text,
        policy_snapshot, price_snapshot,
        guest_name, guest_email, guest_phone,
        created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4,
        $5, $6, $7, $8,
        $9, $10, $11, $12, $13,
        $14, $15, $16,
        $17, $18, $19, $20::date, $21::date,
        $22, $23,
        $24, $25, $26,
        $27, $28,
        $29, $30, $31,
        $32, $33
      )`,
      [
        bookingRow.id,
        bookingRow.booking_number,
        bookingRow.user_id,
        bookingRow.partner_organization_id,
        bookingRow.type,
        bookingRow.confirmation_mode,
        bookingRow.payment_method,
        bookingRow.status,
        bookingRow.currency,
        bookingRow.subtotal,
        bookingRow.discount_amount,
        bookingRow.bonus_amount,
        bookingRow.service_fee,
        bookingRow.total_amount,
        bookingRow.commission_amount,
        bookingRow.partner_payable,
        bookingRow.hotel_id,
        bookingRow.trip_id,
        bookingRow.room_id,
        bookingRow.check_in,
        bookingRow.check_out,
        bookingRow.partner_confirmation_deadline,
        bookingRow.expires_at,
        bookingRow.confirmed_at,
        bookingRow.cancelled_at,
        bookingRow.cancel_reason_text,
        JSON.stringify(bookingRow.policy_snapshot),
        JSON.stringify(bookingRow.price_snapshot),
        bookingRow.guest_name,
        bookingRow.guest_email,
        bookingRow.guest_phone,
        bookingRow.created_at,
        bookingRow.updated_at,
      ],
    );

    await this.addStatusHistory(db, bookingRow, 'created');

    return bookingRow;
  }

  private async addStatusHistory(
    db: PostgresTransaction,
    booking: { id: string; status: string },
    action: string,
    actor?: RequestActor,
  ) {
    const now = new Date().toISOString();
    await db.query(
      `INSERT INTO booking_status_history (id, booking_id, status, action, actor_type, actor_id, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        randomUUID(),
        booking.id,
        booking.status,
        action,
        actor?.actorType ?? null,
        actor?.id ?? null,
        now,
      ],
    );
  }

  /**
   * Bron yaratilgach tasdiqlash xabari yuboriladi — guest (login qilmagan)
   * mijoz uchun bu bron raqamini bilishning YAGONA yo'li, chunki `GET
   * /bookings/:id` endi auth talab qiladi. Xatolik bron yaratishni
   * to'xtatmasligi kerak (email provayder vaqtincha ishlamasa ham bron
   * o'zi muvaffaqiyatli qolishi kerak), shuning uchun chaqiruvchi tomonda
   * `await`siz, xatosi yutilgan holda ishlatiladi.
   */
  private async sendBookingConfirmationEmail(booking: {
    id: string;
    booking_number: string;
    guest_name?: string | null;
    guest_email?: string | null;
    total_amount: number | string;
    currency: string;
  }) {
    const to = (booking.guest_email ?? '').trim();
    if (!to) {
      return;
    }

    try {
      await this.emailService.send({
        to,
        subject: `Safaar — bron tasdiqlandi (${booking.booking_number})`,
        text: `Assalomu alaykum${booking.guest_name ? ', ' + booking.guest_name : ''}!\n\nBroningiz qabul qilindi.\nBron raqami: ${booking.booking_number}\nSumma: ${booking.total_amount} ${booking.currency}\n\nBronni keyinchalik tekshirish uchun saytda "Bronni topish" bo'limida bron raqami va shu email manzilingizni kiriting.`,
        html: `<p>Assalomu alaykum${booking.guest_name ? ', ' + booking.guest_name : ''}!</p><p>Broningiz qabul qilindi.</p><p><b>Bron raqami:</b> ${booking.booking_number}<br/><b>Summa:</b> ${booking.total_amount} ${booking.currency}</p><p>Bronni keyinchalik tekshirish uchun saytda "Bronni topish" bo'limida bron raqami va shu email manzilingizni kiriting.</p>`,
      });
    } catch (error) {
      this.logger.warn(
        `Booking tasdiqlash emaili yuborilmadi (booking_id=${booking.id}): ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  private async createPayment(
    db: PostgresTransaction,
    booking: {
      id: string;
      total_amount: number | string;
      currency: string;
      payment_method: string;
    },
  ) {
    const id = randomUUID();
    const now = new Date().toISOString();
    const payment = {
      id,
      booking_id: booking.id,
      provider: booking.payment_method,
      status: 'pending',
      amount: Number(booking.total_amount),
      currency: booking.currency,
      payment_url: null,
      created_at: now,
      updated_at: now,
    };

    await db.query(
      `INSERT INTO payments (id, booking_id, provider, status, amount, currency, payment_url, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        payment.id,
        payment.booking_id,
        payment.provider,
        payment.status,
        payment.amount,
        payment.currency,
        payment.payment_url,
        payment.created_at,
        payment.updated_at,
      ],
    );

    return payment;
  }

  private async assertBooking(
    id: string,
    actor?: RequestActor,
  ): Promise<BookingRow> {
    const [booking] = await this.pg.query<BookingRow>(
      'SELECT * FROM bookings WHERE id = $1',
      [id],
    );

    if (!booking) {
      throw new NotFoundException({
        code: 'BOOKING_EXPIRED',
        message: 'Bron topilmadi',
      });
    }

    if (!actor) {
      // Anonim (tokensiz) chaqiruv — bron egasini aniqlab bo'lmaydi, shuning
      // uchun rad etiladi. Guest bronni ko'rish/qidirish uchun
      // `POST /bookings/lookup` (booking_number + email) ishlatilishi kerak.
      throw new UnauthorizedException({
        code: 'AUTH_TOKEN_INVALID',
        message: 'Sessiya topilmadi yoki token yaroqsiz',
      });
    }

    if (actor.role === Role.SUPER_ADMIN || actor.actorType === 'admin') {
      return booking;
    }

    if (actor.actorType === 'user' && booking.user_id === actor.id) {
      return booking;
    }

    if (
      actor.actorType === 'partner' &&
      booking.partner_organization_id === actor.organizationId
    ) {
      return booking;
    }

    throw new ForbiddenException({
      code: 'BOOKING_FORBIDDEN',
      message: 'Bu bron sizga tegishli emas',
    });
  }

  async assertBookingForActor(actor: RequestActor | undefined, id: string) {
    return this.assertBooking(id, actor);
  }

  private paymentMethod(value: unknown): string {
    const method = String(value ?? 'click');
    return ['click', 'payme', 'uzcard', 'humo', 'cash'].includes(method)
      ? method
      : 'click';
  }

  private confirmationMode(value: unknown): string {
    const mode = String(value ?? 'instant_confirmation');
    return mode === 'request_confirmation' ? mode : 'instant_confirmation';
  }

  private optionalText(value: unknown): string | undefined {
    if (value === undefined || value === null) {
      return undefined;
    }
    const text = String(value).trim();
    return text || undefined;
  }

  private calculateNights(checkIn: string, checkOut: string): number {
    const start = Date.parse(checkIn);
    const end = Date.parse(checkOut);

    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
      return 1;
    }

    return Math.max(1, Math.ceil((end - start) / 86_400_000));
  }
}

function bookingNumber(): string {
  return `UZB-${Date.now().toString(36).toUpperCase()}`;
}
