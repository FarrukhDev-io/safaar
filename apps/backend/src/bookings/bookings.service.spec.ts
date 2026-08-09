import { Role } from '@safaar/types';
import type { RequestActor } from '../common/actor';
import { EmailService } from '../infrastructure/email.service';
import { PostgresService } from '../infrastructure/postgres.service';
import { EventsService } from '../realtime/events.service';
import { BookingsService } from './bookings.service';

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
    service = new BookingsService(
      pg as unknown as PostgresService,
      events as unknown as EventsService,
      email as unknown as EmailService,
    );
  });

  it('stores guest contact fields for unauthenticated hotel bookings', async () => {
    pg.query
      .mockResolvedValueOnce([
        {
          id: 'hotel-1',
          partner_organization_id: 'partner-1',
          partner_type: 'hotel',
        },
      ])
      .mockResolvedValueOnce([
        {
          id: 'room-1',
          hotel_id: 'hotel-1',
          base_price: '100000',
        },
      ])
      // sana-ziddiyat tekshiruvi (bo'sh = ziddiyat yo'q)
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

  it('sanalar band bo‘lsa 409 ROOM_ALREADY_BOOKED qaytaradi va bron yaratmaydi (regression: BUG-03 overselling)', async () => {
    pg.query
      .mockResolvedValueOnce([
        { id: 'hotel-1', partner_organization_id: 'partner-1', partner_type: 'hotel' },
      ])
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
    pg.query.mockResolvedValueOnce([
      { id: 'hotel-1', partner_organization_id: 'partner-1', partner_type: 'hotel' },
    ]);

    await expect(
      service.createHotel(undefined, {
        hotel_id: 'hotel-1',
        room_id: 'room-1',
        check_in: 'not-a-date',
        check_out: '2026-08-12',
      }),
    ).rejects.toMatchObject({ status: 400 });
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
    service = new BookingsService(
      pg as unknown as PostgresService,
      events as unknown as EventsService,
      { send: jest.fn() } as unknown as EmailService,
    );
  });

  it("bo'sh o'rindiq uchun muvaffaqiyatli bron yaratadi", async () => {
    pg.query
      .mockResolvedValueOnce([
        { id: 'trip-1', company_id: 'company-1', base_price: '50000' },
      ])
      .mockResolvedValueOnce([{ partner_organization_id: 'partner-1' }])
      .mockResolvedValueOnce([
        { id: 'seat-1', seat_code: '12A', status: 'available', price: '50000' },
      ])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    const result = await service.createBus(actor, {
      trip_id: 'trip-1',
      seats: ['12A'],
    });

    expect(result.booking.trip_id).toBe('trip-1');
    expect(pg.transaction).toHaveBeenCalledTimes(1);
  });

  it("o'rindiq allaqachon band bo'lsa SEAT_NOT_AVAILABLE bilan rad etadi va bron yaratmaydi (tranzaksiya ichida qulflangan holatni ko'radi)", async () => {
    pg.query
      .mockResolvedValueOnce([
        { id: 'trip-1', company_id: 'company-1', base_price: '50000' },
      ])
      .mockResolvedValueOnce([{ partner_organization_id: 'partner-1' }])
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
