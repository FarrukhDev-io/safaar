import { Role } from '@safaar/types';
import type { RequestActor } from '../common/actor';
import { PostgresService } from '../infrastructure/postgres.service';
import { PaymentsService } from './payments.service';

describe('PaymentsService — authorization (regression: unauthenticated IDOR)', () => {
  let service: PaymentsService;
  let pg: jest.Mocked<Pick<PostgresService, 'query'>>;

  const bookingRow = {
    id: 'booking-1',
    user_id: 'user-owner',
    partner_organization_id: 'partner-1',
    total_amount: 100000,
    currency: 'UZS',
  };

  beforeEach(() => {
    pg = { query: jest.fn() };
    service = new PaymentsService(pg as unknown as PostgresService);
  });

  it('anonim (actor yo‘q) chaqiruv 401 bilan rad etiladi', async () => {
    pg.query.mockResolvedValueOnce([bookingRow]);

    await expect(
      service.payment(undefined, 'booking-1'),
    ).rejects.toMatchObject({ status: 401 });
  });

  it('boshqa foydalanuvchi bron to‘lovini ko‘ra olmaydi (403)', async () => {
    pg.query.mockResolvedValueOnce([bookingRow]);
    const otherUser: RequestActor = {
      id: 'user-other',
      actorType: 'user',
      role: Role.USER,
      roles: [Role.USER],
    };

    await expect(
      service.payment(otherUser, 'booking-1'),
    ).rejects.toMatchObject({ status: 403 });
  });

  it('bron egasi o‘z to‘lovini ko‘ra oladi', async () => {
    pg.query
      .mockResolvedValueOnce([bookingRow])
      .mockResolvedValueOnce([{ id: 'payment-1', booking_id: 'booking-1' }]);
    const owner: RequestActor = {
      id: 'user-owner',
      actorType: 'user',
      role: Role.USER,
      roles: [Role.USER],
    };

    const result = await service.payment(owner, 'booking-1');
    expect(result.id).toBe('payment-1');
  });

  it('anonim POST /payments/:id/create ham 401 bilan rad etiladi', async () => {
    pg.query.mockResolvedValueOnce([bookingRow]);

    await expect(
      service.createPayment(undefined, 'booking-1', { provider: 'cash' }),
    ).rejects.toMatchObject({ status: 401 });
  });
});
