import { Role } from '@safaar/types';
import type { RequestActor } from '../common/actor';
import { JobQueueService } from '../infrastructure/job-queue.service';
import { PostgresService } from '../infrastructure/postgres.service';
import { EventsService } from '../realtime/events.service';
import { PartnersService } from './partners.service';

describe('PartnersService frontend action endpoints', () => {
  let service: PartnersService;
  let pgMock: jest.Mocked<Pick<PostgresService, 'query'>> & {
    transaction: jest.Mock;
  };
  let eventsMock: {
    hotelListingChanged: jest.Mock;
    adminDashboardUpdated: jest.Mock;
  };
  const actor: RequestActor = {
    id: '00000000-0000-0000-0000-000000000001',
    actorType: 'partner',
    role: Role.PARTNER,
    roles: [Role.PARTNER],
    organizationId: '00000000-0000-0000-0000-000000000002',
    sessionId: 'test-session-id',
  };
  const hotelId = '00000000-0000-0000-0000-000000000003';
  const hotelRow = {
    id: hotelId,
    partner_organization_id: '00000000-0000-0000-0000-000000000002',
    name: { uz: 'Old', ru: 'Old', en: 'Old' },
    description: { uz: '', ru: '', en: '' },
    stars: 3,
    address: '',
    latitude: 0,
    longitude: 0,
    amenities: [],
    images: [],
    status: 'draft',
    check_in_time: '14:00',
    check_out_time: '12:00',
  };

  beforeEach(() => {
    pgMock = {
      query: jest.fn().mockResolvedValue([hotelRow]),
      transaction: jest.fn((operation: (tx: unknown) => unknown) =>
        Promise.resolve(operation({ query: pgMock.query })),
      ),
    };
    eventsMock = {
      hotelListingChanged: jest.fn(),
      adminDashboardUpdated: jest.fn(),
    };
    service = new PartnersService(
      pgMock as unknown as PostgresService,
      { add: jest.fn() } as unknown as JobQueueService,
      eventsMock as unknown as EventsService,
    );
  });

  it('returns the published listing before a pending next-draft, and an active draft before a rejected one', async () => {
    pgMock.query.mockResolvedValueOnce([]);

    await service.hotels(actor);

    expect(pgMock.query).toHaveBeenCalledWith(
      expect.stringContaining(
        'ORDER BY CASE status\n' +
          "                  WHEN 'published' THEN 0\n" +
          "                  WHEN 'pending_review' THEN 1\n" +
          "                  WHEN 'hidden' THEN 2\n" +
          "                  WHEN 'draft' THEN 3\n" +
          "                  WHEN 'rejected' THEN 4\n" +
          '                  ELSE 5\n' +
          '                END',
      ),
      [actor.organizationId, 50, 0],
    );
    expect(pgMock.query.mock.calls[0]?.[0]).toContain('AND deleted_at IS NULL');
  });

  it('keeps a reset draft name empty instead of falling back to its slug', async () => {
    pgMock.query
      .mockResolvedValueOnce([{ ...hotelRow, slug: 'draft-partner-1234' }])
      .mockResolvedValueOnce([
        {
          hotel_id: hotelId,
          language: 'uz',
          name: '',
          short_description: '',
          description: '',
        },
      ])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    const [draft] = await service.hotels(actor);

    expect(draft.name).toEqual({ uz: '', ru: '', en: '' });
  });

  it('supports room type and bulk room buttons from the partner listing UI', async () => {
    pgMock.query
      .mockResolvedValueOnce([hotelRow])
      .mockResolvedValueOnce([
        {
          id: '00000000-0000-0000-0000-000000000004',
          code: 'deluxe',
          name: { uz: 'Deluxe', ru: 'Deluxe', en: 'Deluxe' },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .mockResolvedValueOnce([hotelRow])
      .mockResolvedValueOnce([
        {
          id: '00000000-0000-0000-0000-000000000004',
          base_price: 90000000,
          capacity: 2,
        },
      ])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    const roomType = await service.createRoomType(actor, hotelId, {
      name: 'Deluxe',
      basePrice: 90000000,
      capacity: 2,
    });
    const bulk = await service.createRoomsBulk(actor, hotelId, {
      roomTypeId: roomType.id,
      startNumber: 301,
      count: 2,
      basePrice: 90000000,
    });

    expect((roomType.name as { uz: string }).uz).toBe('Deluxe');
    expect(bulk).toMatchObject({ ok: true, added: 2 });
  });

  it('updates listing sections and publish status for partner listing UI', async () => {
    await service.updateListingGeneral(actor, hotelId, {
      name: 'Yangi nom',
      description: 'Batafsil tavsif',
      stars: 5,
    });

    expect(pgMock.query).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE hotels'),
      expect.arrayContaining([5, expect.any(String), hotelId]),
    );
  });

  it('keeps listing rules SQL placeholders aligned', async () => {
    await service.updateListingRules(actor, hotelId, {
      checkInTime: '15:00',
      checkOutTime: '11:00',
    });

    const updateCall = pgMock.query.mock.calls.find(
      ([sql]) =>
        typeof sql === 'string' && sql.includes('rules_completed_at = $3'),
    );

    expect(updateCall).toBeDefined();
    expect(updateCall?.[0]).toContain(
      "submitted_at = CASE WHEN status = 'published' THEN $5",
    );
    expect(updateCall?.[0]).toContain('WHERE id = $6');
    expect(updateCall?.[1]).toEqual([
      '15:00',
      '11:00',
      expect.any(String),
      expect.any(String),
      expect.any(String),
      hotelId,
    ]);
  });

  it('rejects review submission until every listing section is complete', async () => {
    pgMock.query
      .mockResolvedValueOnce([hotelRow])
      .mockResolvedValueOnce([
        {
          name: 'Hotel',
          short_description: 'Qisqa tavsif',
          description: 'Batafsil tavsif',
        },
      ])
      .mockResolvedValueOnce([{ count: 3 }])
      .mockResolvedValueOnce([{ count: 1 }])
      .mockResolvedValueOnce([{ count: 1 }])
      .mockResolvedValueOnce([{ type: 'hotel' }]);

    await expect(
      service.updateListingStatus(actor, hotelId, { status: 'UNDER_REVIEW' }),
    ).rejects.toThrow("E'lon to'liq to'ldirilmagan");
  });

  it('writes submitted_at when a complete listing enters review', async () => {
    const completeHotel = {
      ...hotelRow,
      address: 'Samarqand, Registon kochasi 1',
      latitude: 39.65,
      longitude: 66.96,
      rules_completed_at: new Date().toISOString(),
    };
    pgMock.query
      .mockResolvedValueOnce([completeHotel])
      .mockResolvedValueOnce([
        {
          name: 'Hotel',
          short_description: 'Yetarlicha uzun qisqa tavsif matni',
          description:
            'Bu mehmonxona haqida mijozga ko‘rinadigan yetarlicha uzun batafsil tavsif matni mavjud. Mehmonlar uchun muhim xizmatlar va qulayliklar batafsil tushuntiriladi.',
        },
      ])
      .mockResolvedValueOnce([{ count: 3 }])
      .mockResolvedValueOnce([{ count: 3 }])
      .mockResolvedValueOnce([{ count: 1 }])
      .mockResolvedValueOnce([{ type: 'hotel' }])
      .mockResolvedValueOnce([{ ...completeHotel, status: 'pending_review' }]);

    const result = await service.updateListingStatus(actor, hotelId, {
      status: 'UNDER_REVIEW',
    });

    expect(result).toMatchObject({ status: 'pending_review' });
    expect(pgMock.query).toHaveBeenLastCalledWith(
      expect.stringContaining('status = $1::"HotelStatus"'),
      expect.arrayContaining([
        'pending_review',
        expect.any(String),
        actor.id,
        hotelId,
      ]),
    );
    expect(pgMock.query.mock.calls.at(-1)?.[0]).toContain(
      `$1::"HotelStatus" = 'pending_review'::"HotelStatus"`,
    );
    expect(pgMock.query.mock.calls.at(-1)?.[0]).toContain(
      'submitted_by = CASE',
    );
    expect(eventsMock.hotelListingChanged).toHaveBeenCalledWith({
      hotelId,
      partnerId: actor.organizationId,
      status: 'pending_review',
      action: 'submitted',
      sections: ['status'],
    });
    expect(eventsMock.adminDashboardUpdated).toHaveBeenCalledTimes(1);
  });

  it("restoran e'lonini faol xona bo'lmasa ham ko'rib chiqishga yuboradi", async () => {
    const completeRestaurant = {
      ...hotelRow,
      address: 'Samarqand, Registon kochasi 1',
      latitude: 39.65,
      longitude: 66.96,
      rules_completed_at: new Date().toISOString(),
    };
    pgMock.query
      .mockResolvedValueOnce([completeRestaurant])
      .mockResolvedValueOnce([
        {
          name: 'Restoran',
          short_description: 'Yetarlicha uzun qisqa restoran tavsifi',
          description:
            'Bu restoran haqida mijozga ko‘rinadigan yetarlicha uzun batafsil tavsif matni mavjud. Taomlar, ish vaqti va bron qoidalari tushuntiriladi.',
        },
      ])
      .mockResolvedValueOnce([{ count: 3 }])
      .mockResolvedValueOnce([{ count: 3 }])
      .mockResolvedValueOnce([{ count: 0 }])
      .mockResolvedValueOnce([{ type: 'restaurant' }])
      .mockResolvedValueOnce([
        { ...completeRestaurant, status: 'pending_review' },
      ]);

    const result = await service.updateListingStatus(actor, hotelId, {
      status: 'UNDER_REVIEW',
    });

    expect(result).toMatchObject({ status: 'pending_review' });
  });

  it('auto-creates amenity codes that are not in the catalog', async () => {
    pgMock.query
      .mockResolvedValueOnce([hotelRow])
      .mockResolvedValueOnce([
        { code: 'wifi', id: '00000000-0000-0000-0000-000000000004' },
      ])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        { code: 'wifi', id: '00000000-0000-0000-0000-000000000004' },
        { code: 'unknown-amenity', id: '00000000-0000-0000-0000-000000000005' },
      ])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([hotelRow]);

    const res = await service.updateListingAmenities(actor, hotelId, {
      amenities: ['wifi', 'unknown-amenity'],
    });
    expect(res).toBeDefined();
  });

  describe('createBooking — restoran stol/vaqt-slot himoyasi', () => {
    const roomTypeId = '00000000-0000-0000-0000-000000000005';
    const roomId = '00000000-0000-0000-0000-000000000006';
    const restaurantHotelRow = {
      id: hotelId,
      check_in_time: '10:00',
      check_out_time: '23:00',
      partner_type: 'restaurant',
    };
    const walkInBody = {
      hotelId,
      roomTypeId,
      roomNumber: 'T1',
      slotTime: '19:00',
      checkIn: '2026-08-10',
      checkOut: '2026-08-10',
      adults: 2,
      children: 0,
      nights: 1,
      totalPrice: 200000,
      source: 'walk_in',
      fullName: 'Test Guest',
      phone: '+998901234567',
    };

    it("bron turini 'restaurant' deb yozadi va xona/sana/slot ustunlarini haqiqiy INSERT ustunlariga to'ldiradi", async () => {
      pgMock.query
        .mockResolvedValueOnce([restaurantHotelRow]) // hotel + partner_organizations JOIN
        .mockResolvedValueOnce([
          { id: roomTypeId, name: { uz: 'Stol' }, base_price: 0, capacity: 4 },
        ]) // room_types
        .mockResolvedValueOnce([
          { id: roomId, room_type_id: roomTypeId, code: 'T1', base_price: 0 },
        ]) // hotel_rooms (roomNumber bo'yicha)
        .mockResolvedValueOnce([{ id: roomId }]) // FOR UPDATE qulf
        .mockResolvedValueOnce([]) // ziddiyat tekshiruvi — bo'sh, ziddiyat yo'q
        .mockResolvedValueOnce([]) // INSERT bookings
        .mockResolvedValueOnce([]) // INSERT payments
        .mockResolvedValueOnce([
          { id: 'booking-1', partner_organization_id: actor.organizationId },
        ]); // this.booking() ichidagi so'rov

      await service.createBooking(actor, walkInBody);

      expect(pgMock.transaction).toHaveBeenCalledTimes(1);
      const insertCall = pgMock.query.mock.calls.find(
        ([sql]) =>
          typeof sql === 'string' && sql.includes('INSERT INTO bookings'),
      );
      expect(insertCall).toBeDefined();
      const params = insertCall?.[1] as unknown[];
      expect(params[4]).toBe('restaurant');
      expect(params[18]).toBe(roomId);
      expect(params[19]).toBe('2026-08-10');
      expect(params[20]).toBe('2026-08-10');
      expect(params[21]).toBe('19:00');
    });

    it('bir xil stol + kesishuvchi vaqt-slot uchun 409 (TABLE_ALREADY_BOOKED) qaytaradi', async () => {
      pgMock.query
        .mockResolvedValueOnce([restaurantHotelRow])
        .mockResolvedValueOnce([
          { id: roomTypeId, name: { uz: 'Stol' }, base_price: 0, capacity: 4 },
        ])
        .mockResolvedValueOnce([
          { id: roomId, room_type_id: roomTypeId, code: 'T1', base_price: 0 },
        ])
        .mockResolvedValueOnce([{ id: roomId }]) // FOR UPDATE qulf
        .mockResolvedValueOnce([{ id: 'existing-booking-id' }]); // ziddiyat topildi

      await expect(service.createBooking(actor, walkInBody)).rejects.toThrow(
        'Bu stol tanlangan vaqtda band',
      );

      expect(
        pgMock.query.mock.calls.some(
          ([sql]) =>
            typeof sql === 'string' && sql.includes('INSERT INTO bookings'),
        ),
      ).toBe(false);
    });

    it('ish vaqtidan tashqari slot uchun SLOT_OUTSIDE_HOURS xatosini qaytaradi', async () => {
      pgMock.query
        .mockResolvedValueOnce([restaurantHotelRow])
        .mockResolvedValueOnce([
          { id: roomTypeId, name: { uz: 'Stol' }, base_price: 0, capacity: 4 },
        ])
        .mockResolvedValueOnce([
          { id: roomId, room_type_id: roomTypeId, code: 'T1', base_price: 0 },
        ]);

      await expect(
        service.createBooking(actor, { ...walkInBody, slotTime: '23:30' }),
      ).rejects.toThrow('Tanlangan vaqt ish vaqtidan tashqarida');
    });
  });
});

describe('PartnersService.withdrawal (regression: C-2 unlimited overdraft)', () => {
  let service: PartnersService;
  let pg: { query: jest.Mock; transaction: jest.Mock };
  const actor: RequestActor = {
    id: 'partner-user-1',
    actorType: 'partner',
    role: Role.PARTNER,
    roles: [Role.PARTNER],
    organizationId: 'org-1',
    sessionId: 'session-1',
  };

  beforeEach(() => {
    pg = { query: jest.fn(), transaction: jest.fn() };
    pg.transaction.mockImplementation(
      (operation: (tx: unknown) => unknown) =>
        operation({ query: pg.query }),
    );
    service = new PartnersService(
      pg as unknown as PostgresService,
      { add: jest.fn() } as unknown as JobQueueService,
    );
  });

  function mockBalanceQueries(grossAmount: number, alreadyCommitted: number) {
    pg.query
      .mockResolvedValueOnce([{ id: 'org-1' }]) // SELECT ... FOR UPDATE lock
      .mockResolvedValueOnce([{ sum: String(grossAmount) }]) // gross bookings sum
      .mockResolvedValueOnce([{ sum: String(alreadyCommitted) }]); // already requested/approved/paid
  }

  it('rejects a withdrawal that exceeds the available balance', async () => {
    // gross=1,000,000 -> available = 700,000; nothing committed yet; asking for 700,001.
    mockBalanceQueries(1_000_000, 0);

    await expect(
      service.withdrawal(actor, { amount: 700_001 }),
    ).rejects.toMatchObject({
      response: { code: 'WITHDRAWAL_EXCEEDS_BALANCE' },
    });
  });

  it('rejects a second withdrawal once a prior one already committed the remaining balance', async () => {
    // available = 700,000; 700,000 already requested; nothing left for a new 1 UZS request.
    mockBalanceQueries(1_000_000, 700_000);

    await expect(
      service.withdrawal(actor, { amount: 1 }),
    ).rejects.toMatchObject({
      response: { code: 'WITHDRAWAL_EXCEEDS_BALANCE' },
    });
  });

  it('allows a withdrawal that fits within the available balance', async () => {
    mockBalanceQueries(1_000_000, 0);
    pg.query.mockResolvedValueOnce([
      { id: 'wr-1', amount: 700_000, status: 'requested' },
    ]);

    const result = await service.withdrawal(actor, { amount: 700_000 });
    expect(result).toMatchObject({ id: 'wr-1', status: 'requested' });
  });

  it('locks the organization row before computing balance (serializes concurrent requests)', async () => {
    mockBalanceQueries(1_000_000, 0);
    pg.query.mockResolvedValueOnce([{ id: 'wr-1' }]);

    await service.withdrawal(actor, { amount: 100 });

    expect(pg.query.mock.calls[0]?.[0]).toContain('FOR UPDATE');
  });
});

describe('PartnersService.createExport (regression: M-2 duplicate in-flight export rows)', () => {
  let service: PartnersService;
  let pg: { query: jest.Mock };
  let jobs: { add: jest.Mock };
  const actor: RequestActor = {
    id: 'partner-user-1',
    actorType: 'partner',
    role: Role.PARTNER,
    roles: [Role.PARTNER],
    organizationId: 'org-1',
    sessionId: 'session-1',
  };

  beforeEach(() => {
    pg = { query: jest.fn() };
    jobs = { add: jest.fn().mockResolvedValue(undefined) };
    service = new PartnersService(
      pg as unknown as PostgresService,
      jobs as unknown as JobQueueService,
    );
  });

  it('enqueues a job and returns the new row when no export is already in flight', async () => {
    pg.query
      .mockResolvedValueOnce([{ id: 'job-1' }]) // INSERT ... ON CONFLICT ... RETURNING id
      .mockResolvedValueOnce([{ id: 'job-1', status: 'queued' }]); // SELECT * WHERE id

    const result = await service.createExport(actor, 'finance', {
      format: 'csv',
    });

    expect(jobs.add).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({ id: 'job-1', status: 'queued' });
  });

  it('does not enqueue a second job and returns the existing row when one is already queued', async () => {
    pg.query
      .mockResolvedValueOnce([]) // INSERT ... ON CONFLICT DO NOTHING -> lost the race, 0 rows
      .mockResolvedValueOnce([{ id: 'job-existing', status: 'queued' }]); // SELECT existing in-flight row

    const result = await service.createExport(actor, 'finance', {
      format: 'csv',
    });

    expect(jobs.add).not.toHaveBeenCalled();
    expect(result).toMatchObject({ id: 'job-existing', status: 'queued' });
  });

  it('the INSERT relies on the DB partial-unique-index conflict target, not a separate check-then-write', async () => {
    pg.query
      .mockResolvedValueOnce([{ id: 'job-1' }])
      .mockResolvedValueOnce([{ id: 'job-1' }]);

    await service.createExport(actor, 'finance', { format: 'csv' });

    const [sql] = pg.query.mock.calls[0]!;
    expect(String(sql)).toContain('ON CONFLICT');
    expect(String(sql)).toContain("status IN ('queued', 'processing')");
  });
});

describe('PartnersService.deleteTeamMember (regression: L-1 false success on cross-org/missing id)', () => {
  let service: PartnersService;
  let pg: { query: jest.Mock };
  const actor: RequestActor = {
    id: 'partner-user-1',
    actorType: 'partner',
    role: Role.PARTNER,
    roles: [Role.PARTNER],
    organizationId: 'org-1',
    sessionId: 'session-1',
  };

  beforeEach(() => {
    pg = { query: jest.fn() };
    service = new PartnersService(
      pg as unknown as PostgresService,
      { add: jest.fn() } as unknown as JobQueueService,
    );
  });

  it('404s instead of reporting fake success for a member outside the caller org', async () => {
    pg.query.mockResolvedValueOnce([]); // WHERE organization_id filtered it out

    await expect(
      service.deleteTeamMember(actor, 'other-org-member-id'),
    ).rejects.toMatchObject({
      status: 404,
      response: expect.objectContaining({ code: 'TEAM_MEMBER_NOT_FOUND' }),
    });
  });

  it('404s for a nonexistent id', async () => {
    pg.query.mockResolvedValueOnce([]);

    await expect(
      service.deleteTeamMember(actor, 'does-not-exist'),
    ).rejects.toMatchObject({ status: 404 });
  });

  it('reports success when a real, in-org member is deleted', async () => {
    pg.query.mockResolvedValueOnce([{ id: 'member-1' }]);

    const result = await service.deleteTeamMember(actor, 'member-1');

    expect(result).toEqual({ id: 'member-1', deleted: true });
  });
});
