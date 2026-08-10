import { Role } from '@safaar/types';
import type { RequestActor } from '../common/actor';
import {
  PostgresService,
  type PostgresTransaction,
} from '../infrastructure/postgres.service';
import { PaymentsService } from './payments.service';
import { hmacSha256 } from '../auth/security';

const secret = 'test-payment-webhook-secret-32-characters';

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

describe('PaymentsService.providerWebhook (regression: C-3 paid-vs-expiry race, H-4 concurrent duplicate 500)', () => {
  const originalEnv = { ...process.env };
  let pg: { query: jest.Mock; transaction: jest.Mock };
  let service: PaymentsService;

  const payment = {
    id: 'payment-1',
    booking_id: 'booking-1',
    amount: '650000',
    currency: 'UZS',
    status: 'pending',
  };

  beforeEach(() => {
    process.env.PAYMENT_WEBHOOK_SECRET = secret;
    pg = { query: jest.fn(), transaction: jest.fn() };
    pg.transaction.mockImplementation(
      (operation: (tx: PostgresTransaction) => unknown) =>
        operation({ query: pg.query } as unknown as PostgresTransaction),
    );
    service = new PaymentsService(pg as unknown as PostgresService);
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  function sign(
    provider: string,
    event: string,
    body: Record<string, unknown>,
  ) {
    const eventKey = `${provider}:${event}:${String(
      body.transaction_id ?? body.id ?? body.booking_id ?? '',
    )}`;
    const canonical = `${provider}.${event}.${eventKey}.${JSON.stringify(
      Object.fromEntries(
        Object.entries(body).sort(([a], [b]) => a.localeCompare(b)),
      ),
    )}`;
    return hmacSha256(canonical, secret);
  }

  it('clears the booking hold (expires_at) once payment is confirmed paid', async () => {
    const body = {
      booking_id: 'booking-1',
      transaction_id: 'tx-1',
      amount: 650000,
      currency: 'UZS',
    };
    pg.query
      .mockResolvedValueOnce([{ id: 'event-1', payment_id: null }]) // INSERT ... ON CONFLICT claim
      .mockResolvedValueOnce([payment]) // SELECT payment FOR UPDATE
      .mockResolvedValueOnce([]) // UPDATE payments
      .mockResolvedValueOnce([]) // UPDATE payment_events
      .mockResolvedValueOnce([]); // UPDATE bookings SET expires_at = NULL

    await service.providerWebhook('click', 'complete', body, {
      'x-safaar-signature': sign('click', 'complete', body),
    });

    const expiryClearCall = pg.query.mock.calls.find(([sql]) =>
      String(sql).includes('UPDATE bookings SET expires_at = NULL'),
    );
    expect(expiryClearCall).toBeDefined();
    expect(expiryClearCall?.[1]).toEqual(['booking-1', expect.any(String)]);
  });

  it('does not touch bookings.expires_at for a non-final (prepare) event', async () => {
    const body = {
      booking_id: 'booking-1',
      transaction_id: 'tx-2',
      amount: 650000,
      currency: 'UZS',
    };
    pg.query
      .mockResolvedValueOnce([{ id: 'event-2', payment_id: null }])
      .mockResolvedValueOnce([payment])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    await service.providerWebhook('click', 'prepare', body, {
      'x-safaar-signature': sign('click', 'prepare', body),
    });

    const expiryClearCall = pg.query.mock.calls.find(([sql]) =>
      String(sql).includes('bookings'),
    );
    expect(expiryClearCall).toBeUndefined();
  });

  it('a webhook that loses the event_key race returns duplicate:true instead of crashing', async () => {
    const body = {
      booking_id: 'booking-1',
      transaction_id: 'tx-3',
      amount: 650000,
      currency: 'UZS',
    };
    pg.query
      .mockResolvedValueOnce([]) // INSERT ... ON CONFLICT DO NOTHING -> lost the race
      .mockResolvedValueOnce([
        { payment_id: 'payment-1', processed_at: '2026-08-10T00:00:00.000Z' },
      ]) // SELECT existing event
      .mockResolvedValueOnce([{ ...payment, status: 'paid' }]); // SELECT payment

    const result = await service.providerWebhook('click', 'complete', body, {
      'x-safaar-signature': sign('click', 'complete', body),
    });

    expect(result).toMatchObject({ accepted: true, duplicate: true });
  });
});
