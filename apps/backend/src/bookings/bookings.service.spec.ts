import { Role } from '@safaar/types';
import type { RequestActor } from '../common/actor';
import { EmailService } from '../infrastructure/email.service';
import { PostgresService } from '../infrastructure/postgres.service';
import { PromosService } from '../promos/promos.service';
import { EventsService } from '../realtime/events.service';
import { BookingsService } from './bookings.service';

function noopPromosService(): jest.Mocked<Pick<PromosService, 'validate' | 'redeem'>> {
  return {
    validate: jest.fn().mockResolvedValue({
      code: '',
      valid: false,
      discount_type: null,
      discount_value: 0,
    }),
    redeem: jest.fn().mockResolvedValue(true),
  };
}

describe('BookingsService.createHotel guest checkout', () => {
  let service: BookingsService;
  let pg: jest.Mocked<Pick<PostgresService, 'query'>> & {
    transaction: jest.Mock;
  };
  let events: {
    bookingStatusChanged: jest.Mock;
    partnerDashboardUpdated: jest.Mock;
    adminDashboardUpdated: jest.Mock;
  };
  let email: { send: jest.Mock };
  let promos: jest.Mocked<Pick<PromosService, 'validate' | 'redeem'>>;

  const hotelRow = {
    id: 'hotel-1',
    partner_organization_id: 'partner-1',
    partner_type: 'hotel',
    commission_rate: 12,
    check_in_time: null,
    check_out_time: null,
  };

  beforeEach(() => {
    pg = {
      query: jest.fn(),
      transaction: jest.fn((operation: (tx: unknown) => unknown) =>
        Promise.resolve(operation({ query: pg.query })),
      ),
    };
    events = {
      bookingStatusChanged: jest.fn(),
      partnerDashboardUpdated: jest.fn(),
      adminDashboardUpdated: jest.fn(),
    };
    email = {
      send: jest.fn().mockResolvedValue({ providerMessageId: '', accepted: true }),
    };
    promos = noopPromosService();
    service = new BookingsService(
      pg as unknown as PostgresService,
      events as unknown as EventsService,
      email as unknown as EmailService,
      promos as unknown as PromosService,
    );
  });

  it('stores guest contact fields for unauthenticated hotel bookings', async () => {
    pg.query
      .mockResolvedValueOnce([hotelRow])
      .mockResolvedValueOnce([
        {
          id: 'room-1',
          hotel_id: 'hotel-1',
          base_price: '100000',
        },
      ])
      // sana-ziddiyat tekshiruvi (bo'sh = ziddiyat yo'q)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]) // INSERT bookings
      .mockResolvedValueOnce([]) // INSERT booking_status_history
      .mockResolvedValueOnce([]) // SELECT existing pending payment (none)
      .mockResolvedValueOnce([]); // INSERT payments

    const result = await service.createHotel(undefined, {
      hotel_id: 'hotel-1',
      room_id: 'room-1',
      check_in: '2026-08-10',
      check_out: '2026-08-12',
      rooms: 1,
      guests: 2,
      firstName: ' Laziz ',
      lastName: ' Shakarov ',
      email: 'LAZIZ@EXAMPLE.COM ',
      phone: ' +998901234567 ',
    });

    expect(result.booking.user_id).toBeNull();
    expect(result.booking.guest_name).toBe('Laziz Shakarov');
    expect(result.booking.guest_email).toBe('laziz@example.com');
    expect(result.booking.guest_phone).toBe('+998901234567');
    expect(result.booking.price_snapshot).toMatchObject({
      guest: {
        first_name: 'Laziz',
        last_name: 'Shakarov',
        name: 'Laziz Shakarov',
        email: 'laziz@example.com',
        phone: '+998901234567',
      },
    });
    expect(events.bookingStatusChanged).toHaveBeenCalledWith(result.booking);
    expect(events.partnerDashboardUpdated).toHaveBeenCalledWith('partner-1');
    expect(events.adminDashboardUpdated).toHaveBeenCalled();
  });

  it('populates booking.user_id when an authenticated customer books (regression: guest-checkout guard was stripping the actor for everyone)', async () => {
    pg.query
      .mockResolvedValueOnce([hotelRow])
      .mockResolvedValueOnce([
        { id: 'room-1', hotel_id: 'hotel-1', base_price: '100000' },
      ])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    const authedActor: RequestActor = {
      id: 'user-42',
      actorType: 'user',
      role: Role.USER,
      roles: [Role.USER],
    };

    const result = await service.createHotel(authedActor, {
      hotel_id: 'hotel-1',
      room_id: 'room-1',
      check_in: '2026-08-10',
      check_out: '2026-08-12',
    });

    expect(result.booking.user_id).toBe('user-42');
  });

  it('confirms a cash-payment booking immediately instead of leaving it pending forever (regression: cash bookings had no path to confirmed and would auto-expire)', async () => {
    pg.query
      .mockResolvedValueOnce([hotelRow])
      .mockResolvedValueOnce([
        { id: 'room-1', hotel_id: 'hotel-1', base_price: '100000' },
      ])
      .mockResolvedValueOnce([]) // conflict check
      .mockResolvedValueOnce([]) // INSERT bookings
      .mockResolvedValueOnce([]) // INSERT booking_status_history (created)
      .mockResolvedValueOnce([]) // existing pending payment check
      .mockResolvedValueOnce([]) // INSERT payments
      .mockResolvedValueOnce([]) // UPDATE bookings SET status = confirmed (cash)
      .mockResolvedValueOnce([]); // INSERT booking_status_history (cash_booking_confirmed)

    const result = await service.createHotel(undefined, {
      hotel_id: 'hotel-1',
      room_id: 'room-1',
      check_in: '2026-08-10',
      check_out: '2026-08-12',
      payment_method: 'cash',
    });

    expect(result.booking.status).toBe('confirmed');
    expect(result.booking.confirmed_at).not.toBeNull();
    expect(result.payment.status).toBe('awaiting_cash');
  });

  it('uses the organization default_commission_rate instead of a hardcoded 12% (regression: admin commission setting was ignored)', async () => {
    pg.query
      .mockResolvedValueOnce([{ ...hotelRow, commission_rate: 20 }])
      .mockResolvedValueOnce([
        { id: 'room-1', hotel_id: 'hotel-1', base_price: '100000' },
      ])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    const result = await service.createHotel(undefined, {
      hotel_id: 'hotel-1',
      room_id: 'room-1',
      check_in: '2026-08-10',
      check_out: '2026-08-12',
      rooms: 1,
    });

    // subtotal = 100000 * 2 nights * 1 room = 200000; 20% komissiya = 40000
    expect(result.booking.commission_amount).toBe(40000);
    expect(result.booking.partner_payable).toBe(160000);
  });

  it('applies a valid promo discount and reduces total_amount/partner_payable accordingly', async () => {
    promos.validate.mockResolvedValueOnce({
      code: 'SUMMER10',
      valid: true,
      discount_type: 'percentage',
      discount_value: 10,
    });
    pg.query
      .mockResolvedValueOnce([hotelRow])
      .mockResolvedValueOnce([
        { id: 'room-1', hotel_id: 'hotel-1', base_price: '100000' },
      ])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]) // INSERT bookings
      .mockResolvedValueOnce([]) // INSERT booking_status_history
      .mockResolvedValueOnce([]) // SELECT existing pending payment
      .mockResolvedValueOnce([]); // INSERT payments

    const result = await service.createHotel(undefined, {
      hotel_id: 'hotel-1',
      room_id: 'room-1',
      check_in: '2026-08-10',
      check_out: '2026-08-12',
      rooms: 1,
      promo_code: 'SUMMER10',
    });

    expect(promos.redeem).toHaveBeenCalledWith('SUMMER10', expect.anything());
    // subtotal 200000, 10% chegirma = 20000 -> total 180000, 12% komissiya = 21600
    expect(result.booking.discount_amount).toBe(20000);
    expect(result.booking.total_amount).toBe(180000);
    expect(result.booking.commission_amount).toBe(21600);
  });

  it('rejects an invalid/expired promo code with 400 before touching inventory', async () => {
    promos.validate.mockResolvedValueOnce({
      code: 'EXPIRED',
      valid: false,
      discount_type: null,
      discount_value: 0,
    });
    pg.query.mockResolvedValueOnce([hotelRow]);

    await expect(
      service.createHotel(undefined, {
        hotel_id: 'hotel-1',
        room_id: 'room-1',
        check_in: '2026-08-10',
        check_out: '2026-08-12',
        promo_code: 'EXPIRED',
      }),
    ).rejects.toMatchObject({ status: 400 });

    expect(pg.transaction).not.toHaveBeenCalled();
  });

  it('sanalar band bo‘lsa 409 ROOM_ALREADY_BOOKED qaytaradi va bron yaratmaydi (regression: BUG-03 overselling)', async () => {
    pg.query
      .mockResolvedValueOnce([hotelRow])
      .mockResolvedValueOnce([
        { id: 'room-1', hotel_id: 'hotel-1', base_price: '100000' },
      ])
      // sana-ziddiyat tekshiruvi — mavjud bron topildi
      .mockResolvedValueOnce([{ id: 'existing-booking-1' }]);

    await expect(
      service.createHotel(undefined, {
        hotel_id: 'hotel-1',
        room_id: 'room-1',
        check_in: '2026-08-10',
        check_out: '2026-08-12',
        rooms: 1,
        guest_email: 'guest@example.com',
      }),
    ).rejects.toMatchObject({ status: 409 });

    // Ziddiyat topilgach INSERT chaqirilmasligi kerak (faqat 3 ta so'rov:
    // hotel, room-lock, conflict-check).
    expect(pg.query).toHaveBeenCalledTimes(3);
  });

  it('noto‘g‘ri check_in/check_out uchun 400 qaytaradi (500 emas)', async () => {
    pg.query.mockResolvedValueOnce([hotelRow]);

    await expect(
      service.createHotel(undefined, {
        hotel_id: 'hotel-1',
        room_id: 'room-1',
        check_in: 'not-a-date',
        check_out: '2026-08-12',
      }),
    ).rejects.toMatchObject({ status: 400 });
  });

  it('a not-approved organization is invisible to booking creation, same as it already is to browsing (regression: rejected/suspended partner could still receive paid bookings)', async () => {
    // `po.status = 'approved'` endi so'rov ichida filtrlanadi — organization
    // approved bo'lmasa hech qanday qator qaytmaydi (xuddi mavjud bo'lmagan
    // hotel kabi).
    pg.query.mockResolvedValueOnce([]);

    await expect(
      service.createHotel(undefined, {
        hotel_id: 'hotel-1',
        room_id: 'room-1',
        check_in: '2026-08-10',
        check_out: '2026-08-12',
      }),
    ).rejects.toMatchObject({ status: 404 });

    const [sql] = pg.query.mock.calls[0]!;
    expect(String(sql)).toContain("po.status = 'approved'");
  });
});

describe('BookingsService.createHotel restaurant (time-slot) reservations', () => {
  let service: BookingsService;
  let pg: jest.Mocked<Pick<PostgresService, 'query'>> & {
    transaction: jest.Mock;
  };
  let events: {
    bookingStatusChanged: jest.Mock;
    partnerDashboardUpdated: jest.Mock;
    adminDashboardUpdated: jest.Mock;
  };
  let promos: jest.Mocked<Pick<PromosService, 'validate' | 'redeem'>>;

  const restaurantHotelRow = {
    id: 'hotel-r1',
    partner_organization_id: 'partner-r1',
    partner_type: 'restaurant',
    commission_rate: 12,
    check_in_time: '09:00',
    check_out_time: '23:00',
  };

  beforeEach(() => {
    pg = {
      query: jest.fn(),
      transaction: jest.fn((operation: (tx: unknown) => unknown) =>
        Promise.resolve(operation({ query: pg.query })),
      ),
    };
    events = {
      bookingStatusChanged: jest.fn(),
      partnerDashboardUpdated: jest.fn(),
      adminDashboardUpdated: jest.fn(),
    };
    promos = noopPromosService();
    service = new BookingsService(
      pg as unknown as PostgresService,
      events as unknown as EventsService,
      { send: jest.fn() } as unknown as EmailService,
      promos as unknown as PromosService,
    );
  });

  it('persists slot_time and uses a slot-overlap conflict check (regression: public restaurant bookings never carried the time slot)', async () => {
    pg.query
      .mockResolvedValueOnce([restaurantHotelRow])
      .mockResolvedValueOnce([
        { id: 'table-1', hotel_id: 'hotel-r1', base_price: '150000' },
      ])
      .mockResolvedValueOnce([]) // slot conflict check — bo'sh
      .mockResolvedValueOnce([]) // INSERT bookings
      .mockResolvedValueOnce([]) // INSERT booking_status_history
      .mockResolvedValueOnce([]) // existing pending payment check
      .mockResolvedValueOnce([]); // INSERT payments

    const result = await service.createHotel(undefined, {
      hotel_id: 'hotel-r1',
      room_id: 'table-1',
      check_in: '2026-08-10',
      slot_time: '19:00',
      guest_name: 'Laziz',
    });

    expect(result.booking.type).toBe('restaurant');
    expect(result.booking.check_out).toBe('2026-08-10');
    expect(result.booking.slot_time).toBe('19:00');

    const conflictCall = pg.query.mock.calls[2]!;
    expect(String(conflictCall[0])).toContain('90 minutes');
    expect(conflictCall[1]).toEqual([
      'table-1',
      'cancelled',
      'expired',
      'completed',
      '2026-08-10',
      '19:00',
    ]);
  });

  it('rejects a restaurant reservation with no slot_time (400, not a silent same-day hotel booking)', async () => {
    pg.query.mockResolvedValueOnce([restaurantHotelRow]);

    await expect(
      service.createHotel(undefined, {
        hotel_id: 'hotel-r1',
        room_id: 'table-1',
        check_in: '2026-08-10',
      }),
    ).rejects.toMatchObject({ status: 400 });
  });

  it('rejects a slot outside operating hours', async () => {
    pg.query.mockResolvedValueOnce([restaurantHotelRow]);

    await expect(
      service.createHotel(undefined, {
        hotel_id: 'hotel-r1',
        room_id: 'table-1',
        check_in: '2026-08-10',
        slot_time: '06:00',
      }),
    ).rejects.toMatchObject({ status: 400 });
  });

  it('rejects a double-booked table+slot with 409 TABLE_ALREADY_BOOKED', async () => {
    pg.query
      .mockResolvedValueOnce([restaurantHotelRow])
      .mockResolvedValueOnce([
        { id: 'table-1', hotel_id: 'hotel-r1', base_price: '150000' },
      ])
      .mockResolvedValueOnce([{ id: 'existing-1' }]);

    await expect(
      service.createHotel(undefined, {
        hotel_id: 'hotel-r1',
        room_id: 'table-1',
        check_in: '2026-08-10',
        slot_time: '19:00',
      }),
    ).rejects.toMatchObject({ status: 409 });
  });
});

describe('BookingsService.createBus (regression: BUG-04 seat double-selling)', () => {
  let service: BookingsService;
  let pg: jest.Mocked<Pick<PostgresService, 'query'>> & {
    transaction: jest.Mock;
  };
  let events: {
    bookingStatusChanged: jest.Mock;
    partnerDashboardUpdated: jest.Mock;
    adminDashboardUpdated: jest.Mock;
  };
  let promos: jest.Mocked<Pick<PromosService, 'validate' | 'redeem'>>;
  const actor: RequestActor = {
    id: 'user-1',
    actorType: 'user',
    role: Role.USER,
    roles: [Role.USER],
  };

  beforeEach(() => {
    pg = {
      query: jest.fn(),
      transaction: jest.fn((operation: (tx: unknown) => unknown) =>
        Promise.resolve(operation({ query: pg.query })),
      ),
    };
    events = {
      bookingStatusChanged: jest.fn(),
      partnerDashboardUpdated: jest.fn(),
      adminDashboardUpdated: jest.fn(),
    };
    promos = noopPromosService();
    service = new BookingsService(
      pg as unknown as PostgresService,
      events as unknown as EventsService,
      { send: jest.fn() } as unknown as EmailService,
      promos as unknown as PromosService,
    );
  });

  it("bo'sh o'rindiq uchun muvaffaqiyatli bron yaratadi", async () => {
    pg.query
      .mockResolvedValueOnce([
        { id: 'trip-1', company_id: 'company-1', base_price: '50000' },
      ])
      .mockResolvedValueOnce([
        { partner_organization_id: 'partner-1', commission_rate: 12 },
      ])
      .mockResolvedValueOnce([
        { id: 'seat-1', seat_code: '12A', status: 'available', price: '50000' },
      ])
      .mockResolvedValueOnce([]) // INSERT bookings
      .mockResolvedValueOnce([]) // INSERT booking_status_history
      .mockResolvedValueOnce([]) // UPDATE trip_seats (mark held)
      .mockResolvedValueOnce([]) // existing pending payment check
      .mockResolvedValueOnce([]); // INSERT payments

    const result = await service.createBus(actor, {
      trip_id: 'trip-1',
      seats: ['12A'],
    });

    expect(result.booking.trip_id).toBe('trip-1');
    expect(result.booking.user_id).toBe('user-1');
    expect(pg.transaction).toHaveBeenCalledTimes(1);
  });

  it("o'rindiq allaqachon band bo'lsa SEAT_NOT_AVAILABLE bilan rad etadi va bron yaratmaydi (tranzaksiya ichida qulflangan holatni ko'radi)", async () => {
    pg.query
      .mockResolvedValueOnce([
        { id: 'trip-1', company_id: 'company-1', base_price: '50000' },
      ])
      .mockResolvedValueOnce([
        { partner_organization_id: 'partner-1', commission_rate: 12 },
      ])
      // FOR UPDATE qulfdan keyin — o'rindiq boshqa tranzaksiya tomonidan
      // allaqachon 'held' qilib qo'yilgan holatni simulyatsiya qiladi.
      .mockResolvedValueOnce([
        { id: 'seat-1', seat_code: '12A', status: 'held', price: '50000' },
      ]);

    await expect(
      service.createBus(actor, { trip_id: 'trip-1', seats: ['12A'] }),
    ).rejects.toMatchObject({ status: 422 });

    // Ziddiyat aniqlangach INSERT chaqirilmasligi kerak (faqat 3 ta so'rov:
    // trip, company, seat-lock).
    expect(pg.query).toHaveBeenCalledTimes(3);
  });

  it('a not-approved bus company is invisible to booking creation (regression: rejected/suspended partner could still sell seats)', async () => {
    pg.query
      .mockResolvedValueOnce([
        { id: 'trip-1', company_id: 'company-1', base_price: '50000' },
      ])
      .mockResolvedValueOnce([]); // JOIN ... WHERE po.status = 'approved' — no match

    await expect(
      service.createBus(actor, { trip_id: 'trip-1', seats: ['12A'] }),
    ).rejects.toMatchObject({ status: 404 });
  });
});

describe('BookingsService.cancel (regression: explicit cancellation never released bus seats)', () => {
  let service: BookingsService;
  let pg: jest.Mocked<Pick<PostgresService, 'query'>> & {
    transaction: jest.Mock;
  };
  let events: { bookingStatusChanged: jest.Mock };

  const bookingRow = {
    id: 'booking-1',
    status: 'confirmed',
    user_id: 'user-1',
    partner_organization_id: 'partner-1',
    total_amount: 100000,
    currency: 'UZS',
    payment_method: 'click',
  };

  beforeEach(() => {
    pg = {
      query: jest.fn(),
      transaction: jest.fn((operation: (tx: unknown) => unknown) =>
        Promise.resolve(operation({ query: pg.query })),
      ),
    };
    events = { bookingStatusChanged: jest.fn() };
    service = new BookingsService(
      pg as unknown as PostgresService,
      events as unknown as EventsService,
      { send: jest.fn() } as unknown as EmailService,
      noopPromosService() as unknown as PromosService,
    );
  });

  const actor: RequestActor = {
    id: 'user-1',
    actorType: 'user',
    role: Role.USER,
    roles: [Role.USER],
  };

  it('releases any held trip_seats tied to this booking when explicitly cancelled', async () => {
    pg.query
      .mockResolvedValueOnce([bookingRow]) // assertBooking
      .mockResolvedValueOnce([{ ...bookingRow, status: 'cancelled' }]) // UPDATE bookings RETURNING *
      .mockResolvedValueOnce([]) // UPDATE trip_seats
      .mockResolvedValueOnce([]); // addStatusHistory INSERT

    const result = await service.cancel(actor, 'booking-1', {});

    expect(result.status).toBe('cancelled');
    const seatRelease = pg.query.mock.calls.find(([sql]) =>
      String(sql).includes('trip_seats'),
    );
    expect(seatRelease).toBeDefined();
    expect(seatRelease?.[1]).toEqual(['booking-1']);
  });

  it('rejects cancelling an already-cancelled booking', async () => {
    pg.query.mockResolvedValueOnce([{ ...bookingRow, status: 'cancelled' }]);

    await expect(service.cancel(actor, 'booking-1', {})).rejects.toMatchObject({
      status: 422,
    });
  });
});

describe('BookingsService.findOne — authorization (regression: unauthenticated IDOR)', () => {
  let service: BookingsService;
  let pg: jest.Mocked<Pick<PostgresService, 'query'>>;

  const bookingRow = {
    id: 'booking-1',
    user_id: 'user-owner',
    partner_organization_id: 'partner-1',
    total_amount: 100000,
    currency: 'UZS',
    payment_method: 'cash',
  };

  beforeEach(() => {
    pg = { query: jest.fn() };
    service = new BookingsService(
      pg as unknown as PostgresService,
      {
        bookingStatusChanged: jest.fn(),
        partnerDashboardUpdated: jest.fn(),
        adminDashboardUpdated: jest.fn(),
      } as unknown as EventsService,
      { send: jest.fn() } as unknown as EmailService,
      noopPromosService() as unknown as PromosService,
    );
  });

  it('anonim (actor yo‘q) chaqiruv 401 bilan rad etiladi', async () => {
    pg.query.mockResolvedValueOnce([bookingRow]);

    await expect(service.findOne(undefined, 'booking-1')).rejects.toMatchObject(
      { status: 401 },
    );
  });

  it('boshqa foydalanuvchi bronini ko‘ra olmaydi (403)', async () => {
    pg.query.mockResolvedValueOnce([bookingRow]);
    const otherUser: RequestActor = {
      id: 'user-other',
      actorType: 'user',
      role: Role.USER,
      roles: [Role.USER],
    };

    await expect(
      service.findOne(otherUser, 'booking-1'),
    ).rejects.toMatchObject({ status: 403 });
  });

  it('bron egasi o‘z bronini ko‘ra oladi', async () => {
    pg.query.mockResolvedValueOnce([bookingRow]).mockResolvedValueOnce([]);
    const owner: RequestActor = {
      id: 'user-owner',
      actorType: 'user',
      role: Role.USER,
      roles: [Role.USER],
    };

    const result = await service.findOne(owner, 'booking-1');
    expect(result.id).toBe('booking-1');
  });
});

describe('BookingsService.lookupBooking (guest — booking_number + email)', () => {
  let service: BookingsService;
  let pg: jest.Mocked<Pick<PostgresService, 'query'>>;

  beforeEach(() => {
    pg = { query: jest.fn() };
    service = new BookingsService(
      pg as unknown as PostgresService,
      {
        bookingStatusChanged: jest.fn(),
        partnerDashboardUpdated: jest.fn(),
        adminDashboardUpdated: jest.fn(),
      } as unknown as EventsService,
      { send: jest.fn() } as unknown as EmailService,
      noopPromosService() as unknown as PromosService,
    );
  });

  it('booking_number + email mos kelsa cheklangan maydonlarni qaytaradi', async () => {
    pg.query
      .mockResolvedValueOnce([
        {
          id: 'booking-1',
          booking_number: 'UZB-ABC123',
          type: 'hotel',
          status: 'pending',
          currency: 'UZS',
          total_amount: 100000,
          hotel_id: 'hotel-1',
          trip_id: null,
          check_in: '2026-09-01',
          check_out: '2026-09-03',
          slot_time: null,
          guest_name: 'Laziz',
          guest_email: 'guest@example.com',
          created_at: '2026-08-01T00:00:00.000Z',
          commission_amount: 12000,
          partner_payable: 88000,
        },
      ])
      .mockResolvedValueOnce([]);

    const result = await service.lookupBooking(
      'UZB-ABC123',
      'GUEST@EXAMPLE.COM',
    );

    expect(result.booking_number).toBe('UZB-ABC123');
    expect(result).not.toHaveProperty('commission_amount');
    expect(result).not.toHaveProperty('partner_payable');
    expect(result).not.toHaveProperty('guest_email');
  });

  it('email mos kelmasa umumiy 404 qaytaradi (enumeration himoyasi)', async () => {
    pg.query.mockResolvedValueOnce([]);

    await expect(
      service.lookupBooking('UZB-ABC123', 'wrong@example.com'),
    ).rejects.toMatchObject({ status: 404 });
  });

  it("bo'sh bron raqami yoki email uchun 400 qaytaradi", async () => {
    await expect(service.lookupBooking('', 'guest@example.com')).rejects.toMatchObject(
      { status: 400 },
    );
  });
});

describe('BookingsService.expireStaleBookings (regression: BUG-09 hold expiry, and paid-but-unconfirmed timeout)', () => {
  let service: BookingsService;
  let pg: jest.Mocked<Pick<PostgresService, 'query'>> & {
    transaction: jest.Mock;
  };
  let events: {
    bookingStatusChanged: jest.Mock;
    partnerDashboardUpdated: jest.Mock;
    adminDashboardUpdated: jest.Mock;
  };

  beforeEach(() => {
    pg = {
      query: jest.fn(),
      transaction: jest.fn((operation: (tx: unknown) => unknown) =>
        Promise.resolve(operation({ query: pg.query })),
      ),
    };
    events = {
      bookingStatusChanged: jest.fn(),
      partnerDashboardUpdated: jest.fn(),
      adminDashboardUpdated: jest.fn(),
    };
    service = new BookingsService(
      pg as unknown as PostgresService,
      events as unknown as EventsService,
      { send: jest.fn() } as unknown as EmailService,
      noopPromosService() as unknown as PromosService,
    );
  });

  it("muddati o'tgan bronlarni 'expired'ga o'tkazadi, o'rindiqlarni bo'shatadi va hodisalarni yuboradi", async () => {
    const expiredBooking = {
      id: 'booking-1',
      status: 'expired',
      user_id: 'user-1',
      partner_organization_id: 'partner-1',
      total_amount: 50000,
      currency: 'UZS',
      payment_method: 'cash',
    };
    pg.query
      // UPDATE bookings ... RETURNING * (expired)
      .mockResolvedValueOnce([expiredBooking])
      // UPDATE trip_seats ...
      .mockResolvedValueOnce([])
      // addStatusHistory INSERT
      .mockResolvedValueOnce([])
      // UPDATE bookings ... awaiting_partner_confirmation timeout -> none
      .mockResolvedValueOnce([]);

    await service.expireStaleBookings();

    expect(pg.transaction).toHaveBeenCalledTimes(1);
    expect(events.bookingStatusChanged).toHaveBeenCalledWith(expiredBooking);
    expect(events.partnerDashboardUpdated).toHaveBeenCalledWith('partner-1');
    expect(events.adminDashboardUpdated).toHaveBeenCalled();

    // O'rindiq bo'shatish so'rovi to'g'ri booking id bilan chaqirilganini
    // tekshiramiz.
    const seatReleaseCall = pg.query.mock.calls[1];
    expect(seatReleaseCall[0]).toContain('trip_seats');
    expect(seatReleaseCall[1]).toEqual([['booking-1']]);
  });

  it("hech qanday bron muddati o'tmagan bo'lsa hech narsa qilmaydi", async () => {
    pg.query.mockResolvedValueOnce([]).mockResolvedValueOnce([]);

    await service.expireStaleBookings();

    expect(pg.query).toHaveBeenCalledTimes(2);
    expect(events.bookingStatusChanged).not.toHaveBeenCalled();
    expect(events.adminDashboardUpdated).not.toHaveBeenCalled();
  });

  it('auto-cancels a booking stuck in awaiting_partner_confirmation past its deadline and files an auto-refund (regression: this state never expired before)', async () => {
    const cancelledBooking = {
      id: 'booking-2',
      status: 'cancelled',
      user_id: 'user-2',
      partner_organization_id: 'partner-2',
      total_amount: 70000,
      currency: 'UZS',
      payment_method: 'click',
    };
    pg.query
      .mockResolvedValueOnce([]) // no plain expired bookings
      .mockResolvedValueOnce([cancelledBooking]) // awaiting_partner_confirmation timeout -> cancelled
      .mockResolvedValueOnce([]) // addStatusHistory for the auto-cancel
      .mockResolvedValueOnce([
        { id: 'payment-1', amount: 70000, currency: 'UZS' },
      ]) // SELECT paid payment for this booking
      .mockResolvedValueOnce([]); // INSERT refunds

    await service.expireStaleBookings();

    expect(events.bookingStatusChanged).toHaveBeenCalledWith(cancelledBooking);
    expect(events.adminDashboardUpdated).toHaveBeenCalled();

    const refundCall = pg.query.mock.calls.find(([sql]) =>
      String(sql).includes('INSERT INTO refunds'),
    );
    expect(refundCall).toBeDefined();
    expect(refundCall?.[1]).toEqual([
      expect.any(String),
      'booking-2',
      'user-2',
      'UZS',
      70000,
      expect.any(String),
      expect.any(String),
    ]);
  });

  it('xatolik yuz bersa jim qoladi (cron keyingi daqiqada qayta urinadi, ilova qulamaydi)', async () => {
    pg.transaction.mockRejectedValueOnce(new Error('DB down'));

    await expect(service.expireStaleBookings()).resolves.toBeUndefined();
  });
});
