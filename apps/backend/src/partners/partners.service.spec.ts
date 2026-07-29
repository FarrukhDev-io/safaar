import { Role } from '@safaar/types';
import type { RequestActor } from '../common/actor';
import { JobQueueService } from '../infrastructure/job-queue.service';
import { PostgresService } from '../infrastructure/postgres.service';
import { EventsService } from '../realtime/events.service';
import { PartnersService } from './partners.service';

describe('PartnersService frontend action endpoints', () => {
  let service: PartnersService;
  let pgMock: jest.Mocked<Pick<PostgresService, 'query'>>;
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

  it('returns active drafts before previously submitted hotels', async () => {
    pgMock.query.mockResolvedValueOnce([]);

    await service.hotels(actor);

    expect(pgMock.query).toHaveBeenCalledWith(
      expect.stringContaining(
        "ORDER BY CASE WHEN status = 'draft' THEN 0 ELSE 1 END",
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
      .mockResolvedValueOnce([{ count: 1 }]);

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

  it('rejects amenity codes that are not in the catalog', async () => {
    pgMock.query
      .mockResolvedValueOnce([hotelRow])
      .mockResolvedValueOnce([
        { code: 'wifi', id: '00000000-0000-0000-0000-000000000004' },
      ]);

    await expect(
      service.updateListingAmenities(actor, hotelId, {
        amenities: ['wifi', 'unknown-amenity'],
      }),
    ).rejects.toThrow('Qulayliklar katalogdan topilmadi');
  });
});
