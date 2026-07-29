import { Role } from '@safaar/types';
import type { RequestActor } from '../common/actor';
import { AppCacheService } from '../infrastructure/cache.service';
import { JobQueueService } from '../infrastructure/job-queue.service';
import { PostgresService } from '../infrastructure/postgres.service';
import { EventsService } from '../realtime/events.service';
import { AdminService } from './admin.service';

describe('AdminService frontend action endpoints', () => {
  let service: AdminService;
  let pgMock: jest.Mocked<Pick<PostgresService, 'query' | 'transaction'>>;
  let eventsMock: {
    notificationCreated: jest.Mock;
    hotelListingChanged: jest.Mock;
    partnerDashboardUpdated: jest.Mock;
  };
  const actor: RequestActor = {
    id: '00000000-0000-0000-0000-000000000001',
    actorType: 'admin',
    role: Role.SUPER_ADMIN,
    roles: [Role.SUPER_ADMIN],
    sessionId: 'test-session-id',
  };

  beforeEach(() => {
    pgMock = {
      query: jest.fn(),
      transaction: jest.fn(),
    };
    pgMock.transaction.mockImplementation((operation) =>
      operation({ query: pgMock.query }),
    );
    eventsMock = {
      notificationCreated: jest.fn(),
      hotelListingChanged: jest.fn(),
      partnerDashboardUpdated: jest.fn(),
    };
    service = new AdminService(
      {
        getOrSet: async <T>(
          _key: string,
          _ttl: number,
          factory: () => Promise<T> | T,
        ): Promise<T> => Promise.resolve(factory()),
        delByPattern: jest.fn(),
      } as unknown as AppCacheService,
      { add: jest.fn() } as unknown as JobQueueService,
      pgMock as unknown as PostgresService,
      {
        partnerRequestCreated: jest.fn(),
        partnerRequestDecided: jest.fn(),
        partnerDashboardUpdated: eventsMock.partnerDashboardUpdated,
        bookingStatusChanged: jest.fn(),
        adminDashboardUpdated: jest.fn(),
        notificationCreated: eventsMock.notificationCreated,
        supportTicketUpdated: jest.fn(),
        supportMessageCreated: jest.fn(),
        hotelListingChanged: eventsMock.hotelListingChanged,
      } as unknown as EventsService,
    );
  });

  it('soft deletes users for the admin delete button', async () => {
    pgMock.query.mockResolvedValue([{ status: 'deleted' }]);
    const result = await service.userDelete(
      actor,
      '00000000-0000-0000-0000-000000000001',
    );
    expect(result.status).toBe('deleted');
  });

  it('updates support status and appends an admin support message', async () => {
    pgMock.query.mockResolvedValue([{ status: 'closed' }]);
    const closed = await service.supportStatus(
      '00000000-0000-0000-0000-000000000002',
      {
        status: 'closed',
      },
    );
    expect(closed['status']).toBe('closed');
  });

  it('normalizes withdrawal actions used by admin finance buttons', async () => {
    pgMock.query.mockResolvedValue([{ status: 'approved' }]);
    await expect(
      service.withdrawalStatus(
        '00000000-0000-0000-0000-000000000003',
        'approved',
      ),
    ).resolves.toMatchObject({
      status: 'approved',
    });
  });

  it('publishes a hotel and prepares its successor draft once', async () => {
    const hotelId = '00000000-0000-0000-0000-000000000004';
    const partnerId = '00000000-0000-0000-0000-000000000005';
    const cityId = '00000000-0000-0000-0000-000000000006';
    const submitterId = '00000000-0000-0000-0000-000000000008';
    const notificationId = '00000000-0000-0000-0000-000000000009';
    jest
      .spyOn(service, 'hotel')
      .mockResolvedValueOnce({
        completeness: { is_publishable: true, missing_fields: [] },
        name: { uz: 'Test hotel' },
        slug: 'test-hotel',
      } as never)
      .mockResolvedValueOnce({ id: hotelId, status: 'published' } as never);
    pgMock.query
      .mockResolvedValueOnce([
        {
          id: hotelId,
          partner_organization_id: partnerId,
          city_id: cityId,
          status: 'pending_review',
          submitted_by: submitterId,
          next_draft_prepared_at: null,
        },
      ])
      .mockResolvedValueOnce([
        {
          id: hotelId,
          partner_organization_id: partnerId,
          status: 'published',
        },
      ])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          id: notificationId,
          owner_type: 'partner',
          owner_id: submitterId,
          title: "E'loningiz muvaffaqiyatli tasdiqlandi",
        },
      ]);

    await expect(
      service.hotelStatus(actor, hotelId, 'published'),
    ).resolves.toMatchObject({ status: 'published' });

    expect(pgMock.query).toHaveBeenCalledWith(
      expect.stringContaining('status = $2::"HotelStatus"'),
      [hotelId, 'published', '', actor.id, expect.any(String)],
    );
    const moderationCall = pgMock.query.mock.calls.find(
      ([sql]) => typeof sql === 'string' && sql.includes('set status = $2'),
    );
    expect(moderationCall?.[0]).toContain(
      `$2::"HotelStatus" = 'rejected'::"HotelStatus"`,
    );
    expect(pgMock.query).toHaveBeenCalledWith(
      expect.stringContaining('insert into hotels'),
      expect.arrayContaining([
        expect.any(String),
        partnerId,
        expect.any(String),
        cityId,
      ]),
    );
    expect(pgMock.query).toHaveBeenCalledWith(
      expect.stringContaining('insert into notifications'),
      expect.arrayContaining([
        expect.any(String),
        submitterId,
        "E'loningiz muvaffaqiyatli tasdiqlandi",
      ]),
    );
    expect(eventsMock.notificationCreated).toHaveBeenCalledWith(
      submitterId,
      expect.objectContaining({ id: notificationId }),
    );
    expect(eventsMock.hotelListingChanged).toHaveBeenCalledWith(
      expect.objectContaining({
        hotelId,
        partnerId,
        status: 'published',
        previousStatus: 'pending_review',
        notificationId,
      }),
    );
    expect(pgMock.transaction).toHaveBeenCalledTimes(1);
  });

  it('does not prepare another draft after the approval marker is set', async () => {
    const hotelId = '00000000-0000-0000-0000-000000000004';
    jest
      .spyOn(service, 'hotel')
      .mockResolvedValueOnce({
        completeness: { is_publishable: true, missing_fields: [] },
        name: { uz: 'Test hotel' },
      } as never)
      .mockResolvedValueOnce({ id: hotelId, status: 'published' } as never);
    pgMock.query
      .mockResolvedValueOnce([
        {
          id: hotelId,
          partner_organization_id: '00000000-0000-0000-0000-000000000005',
          city_id: '00000000-0000-0000-0000-000000000006',
          status: 'published',
          submitted_by: '00000000-0000-0000-0000-000000000008',
          next_draft_prepared_at: new Date().toISOString(),
        },
      ])
      .mockResolvedValueOnce([
        {
          id: hotelId,
          partner_organization_id: '00000000-0000-0000-0000-000000000005',
          status: 'published',
        },
      ])
      .mockResolvedValueOnce([{ id: '00000000-0000-0000-0000-000000000007' }]);

    await service.hotelStatus(actor, hotelId, 'published');

    expect(
      pgMock.query.mock.calls.some(
        ([sql]) =>
          typeof sql === 'string' && sql.includes('insert into hotels'),
      ),
    ).toBe(false);
    expect(
      pgMock.query.mock.calls.some(
        ([sql]) =>
          typeof sql === 'string' && sql.includes('insert into notifications'),
      ),
    ).toBe(false);
    expect(eventsMock.notificationCreated).not.toHaveBeenCalled();
  });

  it('clears an existing safe draft after the first approval', async () => {
    const hotelId = '00000000-0000-0000-0000-000000000004';
    const draftId = '00000000-0000-0000-0000-000000000007';
    const partnerId = '00000000-0000-0000-0000-000000000005';
    const cityId = '00000000-0000-0000-0000-000000000006';
    const submitterId = '00000000-0000-0000-0000-000000000008';
    jest
      .spyOn(service, 'hotel')
      .mockResolvedValueOnce({
        completeness: { is_publishable: true, missing_fields: [] },
        name: { uz: 'Test hotel' },
      } as never)
      .mockResolvedValueOnce({ id: hotelId, status: 'published' } as never);
    pgMock.query
      .mockResolvedValueOnce([
        {
          id: hotelId,
          partner_organization_id: partnerId,
          city_id: cityId,
          status: 'pending_review',
          submitted_by: submitterId,
          next_draft_prepared_at: null,
        },
      ])
      .mockResolvedValueOnce([
        {
          id: hotelId,
          partner_organization_id: partnerId,
          status: 'published',
        },
      ])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ id: draftId, has_bookings: false }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    await service.hotelStatus(actor, hotelId, 'published');

    expect(pgMock.query).toHaveBeenCalledWith(
      expect.stringContaining("address = '', latitude = null"),
      [draftId, cityId, expect.any(String)],
    );
    expect(pgMock.query).toHaveBeenCalledWith(
      expect.stringContaining('delete from hotel_rooms'),
      [draftId],
    );
    expect(pgMock.query).toHaveBeenCalledWith(
      expect.stringContaining('insert into hotel_translations'),
      [draftId, expect.any(String)],
    );
  });

  it('rejects a hotel with its reason, notification, and blank draft', async () => {
    const hotelId = '00000000-0000-0000-0000-000000000004';
    const partnerId = '00000000-0000-0000-0000-000000000005';
    const cityId = '00000000-0000-0000-0000-000000000006';
    const submitterId = '00000000-0000-0000-0000-000000000008';
    const notificationId = '00000000-0000-0000-0000-000000000009';
    const reason = 'Rasmlar sifati talabga javob bermaydi';
    jest
      .spyOn(service, 'hotel')
      .mockResolvedValueOnce({ name: { uz: 'Test hotel' } } as never)
      .mockResolvedValueOnce({ id: hotelId, status: 'rejected' } as never);
    pgMock.query
      .mockResolvedValueOnce([
        {
          id: hotelId,
          partner_organization_id: partnerId,
          city_id: cityId,
          status: 'pending_review',
          submitted_by: submitterId,
          next_draft_prepared_at: null,
        },
      ])
      .mockResolvedValueOnce([
        {
          id: hotelId,
          partner_organization_id: partnerId,
          status: 'rejected',
        },
      ])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          id: notificationId,
          owner_type: 'partner',
          owner_id: submitterId,
          title: "E'loningiz rad etildi",
          body: `"Test hotel" e'loni rad etildi. Sabab: ${reason}`,
        },
      ]);

    await expect(
      service.hotelStatus(actor, hotelId, 'rejected', reason),
    ).resolves.toMatchObject({ status: 'rejected' });

    expect(eventsMock.notificationCreated).toHaveBeenCalledWith(
      submitterId,
      expect.objectContaining({
        title: "E'loningiz rad etildi",
        body: `"Test hotel" e'loni rad etildi. Sabab: ${reason}`,
      }),
    );
    expect(eventsMock.hotelListingChanged).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'rejected',
        rejectionReason: reason,
        notificationId,
      }),
    );
  });

  it('loads admin settings from persistent storage with defaults', async () => {
    pgMock.query.mockResolvedValue([
      {
        group_key: 'general',
        value: {
          support_email: 'help@safaar.uz',
          maintenance_mode: true,
        },
      },
      {
        group_key: 'finance',
        value: {
          hotel_commission_rate: 17,
        },
      },
    ]);

    await expect(service.settings()).resolves.toMatchObject({
      general: {
        app_name: 'UzBron',
        support_email: 'help@safaar.uz',
        maintenance_mode: true,
      },
      finance: {
        hotel_commission_rate: 17,
        bus_commission_rate: 10,
      },
    });
  });

  it('persists admin settings groups and audits the change', async () => {
    pgMock.query
      .mockResolvedValueOnce([
        {
          group_key: 'finance',
          value: {
            hotel_commission_rate: 18,
            bus_commission_rate: 11,
          },
          updated_at: '2026-07-14T12:30:00.000Z',
        },
      ])
      .mockResolvedValueOnce([]);

    await expect(
      service.settingsGroup(actor, 'finance', {
        hotel_commission_rate: 18,
        bus_commission_rate: 11,
      }),
    ).resolves.toMatchObject({
      group: 'finance',
      hotel_commission_rate: 18,
      bus_commission_rate: 11,
    });
    expect(pgMock.query).toHaveBeenCalledTimes(2);
  });
});
