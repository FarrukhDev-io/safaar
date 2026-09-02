import { Role } from '@safaar/types';
import { ForbiddenException } from '@nestjs/common';
import type { RequestActor } from '../common/actor';
import type { PostgresService } from '../infrastructure/postgres.service';
import { RefundsService } from './refunds.service';

function userActor(id: string): RequestActor {
  return { id, actorType: 'user', role: Role.USER, roles: [Role.USER] };
}

function adminActor(role: Role): RequestActor {
  return { id: 'admin-1', actorType: 'admin', role, roles: [role] };
}

const bookingRow = {
  id: 'booking-1',
  user_id: 'customer-1',
  total_amount: 1000000,
  currency: 'UZS',
};

describe('RefundsService.create', () => {
  let pg: jest.Mocked<Pick<PostgresService, 'query'>>;
  let service: RefundsService;

  beforeEach(() => {
    pg = { query: jest.fn() };
    service = new RefundsService(pg as unknown as PostgresService);
  });

  it('lets a user create a refund for their own booking (regression)', async () => {
    pg.query
      .mockResolvedValueOnce([bookingRow]) // booking lookup
      .mockResolvedValueOnce([]) // no existing refund
      .mockResolvedValueOnce([]); // insert

    const result = await service.create(userActor('customer-1'), {
      booking_id: 'booking-1',
      reason: 'test',
    });

    expect(result.status).toBe('requested');
    expect(result.user_id).toBe('customer-1');
    expect(result.requested_amount).toBe(800000);
  });

  it("blocks a user from creating a refund for someone else's booking (regression)", async () => {
    pg.query.mockResolvedValueOnce([bookingRow]);

    await expect(
      service.create(userActor('other-user'), { booking_id: 'booking-1' }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('lets an admin with finance permission create a refund on behalf of the real owner', async () => {
    pg.query
      .mockResolvedValueOnce([bookingRow])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    const result = await service.create(adminActor(Role.SUPER_ADMIN), {
      booking_id: 'booking-1',
      reason: 'admin-initiated',
    });

    expect(result.user_id).toBe('customer-1');
    expect(result.status).toBe('requested');
  });

  it('blocks an admin role without finance permission (e.g. CONTENT_ADMIN) from creating refunds', async () => {
    await expect(
      service.create(adminActor(Role.CONTENT_ADMIN), {
        booking_id: 'booking-1',
      }),
    ).rejects.toThrow(ForbiddenException);
    expect(pg.query).not.toHaveBeenCalled();
  });

  it('returns the existing non-rejected refund instead of creating a duplicate', async () => {
    const existing = { id: 'refund-1', status: 'requested' };
    pg.query
      .mockResolvedValueOnce([bookingRow])
      .mockResolvedValueOnce([existing]);

    const result = await service.create(adminActor(Role.SUPER_ADMIN), {
      booking_id: 'booking-1',
    });

    expect(result).toBe(existing);
    expect(pg.query).toHaveBeenCalledTimes(2);
  });
});
