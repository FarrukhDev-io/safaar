import { Role } from '@safaar/types';
import type { RequestActor } from '../common/actor';
import {
  PostgresService,
  type PostgresTransaction,
} from '../infrastructure/postgres.service';
import { PaymentsService } from './payments.service';
import { UzumProvider } from './providers/uzum.provider';
import {
  UzumCheckoutProvider,
  normalizeCheckoutCallback,
  type NormalizedCheckoutCallback,
} from './providers/uzum-checkout.provider';

/**
 * PaymentsService.uzumCheckoutCallback() — SAFAAR ICHKI, normallashtirilgan
 * callback shakli ustidan test.
 *
 * MUHIM: bu fixture'lar Uzum production kontrakti EMAS. Uzum Checkout'ning
 * rasmiy callback payload + `operationState` + imzo spec'i bizda hali YO'Q.
 * Bu testlar service qatlamining ICHKI shartnomasini (`NormalizedCheckoutCallback`)
 * va mavjud `processPaymentEvent()` bilan integratsiyasini tekshiradi.
 */

type QueryCall = [sql: string, params?: readonly unknown[]];
const callsOf = (m: jest.Mock): QueryCall[] => m.mock.calls as QueryCall[];
const findCall = (m: jest.Mock, needle: string): QueryCall | undefined =>
  callsOf(m).find(([sql]) => String(sql).includes(needle));
const countCalls = (m: jest.Mock, needle: string): number =>
  callsOf(m).filter(([sql]) => String(sql).includes(needle)).length;

const ORDER_ID = 'uzc-88817263';

const openBooking = {
  id: 'booking-1',
  booking_number: 'UZB-QATEST01',
  status: 'pending',
  user_id: 'user-1',
  partner_organization_id: 'partner-1',
  confirmation_mode: 'instant_confirmation',
  total_amount: '150000',
  partner_payable: '135000',
  currency: 'UZS',
  expires_at: new Date(Date.now() + 20 * 60_000).toISOString(),
};

const checkoutPayment = {
  id: 'payment-uzc-1',
  booking_id: 'booking-1',
  amount: '150000',
  currency: 'UZS',
  status: 'processing',
  provider: 'uzum_checkout',
  provider_reference: ORDER_ID,
  idempotency_key: `uzum_checkout:${ORDER_ID}`,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const normalized = (
  over: Partial<NormalizedCheckoutCallback> = {},
): NormalizedCheckoutCallback => ({
  orderId: ORDER_ID,
  orderNumber: 'UZB-QATEST01',
  merchantOperationId: 'payment-uzc-1',
  amountSom: 150000,
  currency: 'UZS',
  state: 'PAID',
  raw: { orderId: ORDER_ID, state: 'X' },
  ...over,
});

describe('PaymentsService.uzumCheckoutCallback (INTERNAL contract layer)', () => {
  let pg: { query: jest.Mock; transaction: jest.Mock };
  let service: PaymentsService;

  beforeEach(() => {
    pg = { query: jest.fn(), transaction: jest.fn() };
    pg.transaction.mockImplementation(
      (op: (tx: PostgresTransaction) => unknown) => op({ query: pg.query }),
    );
    service = new PaymentsService(
      pg as unknown as PostgresService,
      { get: jest.fn() } as never,
      { isConfigured: () => false } as never,
      { isConfigured: () => false } as never,
      new UzumProvider({ get: jest.fn() } as never),
      new UzumCheckoutProvider({ get: () => undefined } as never),
    );
  });

  it('8/9) state=PAID — payment paid, booking confirmed, ledger bir marta', async () => {
    pg.query
      .mockResolvedValueOnce([checkoutPayment]) // 1: locate checkout payment
      // processPaymentEvent(...):
      .mockResolvedValueOnce([{ id: 'evt-1', payment_id: null }]) // claim event
      .mockResolvedValueOnce([openBooking]) // booking FOR UPDATE
      .mockResolvedValueOnce([checkoutPayment]) // payment FOR UPDATE
      .mockResolvedValueOnce([]) // UPDATE payments -> paid
      .mockResolvedValueOnce([]) // UPDATE payment_events
      .mockResolvedValueOnce([]) // UPDATE bookings -> confirmed
      .mockResolvedValueOnce([]) // INSERT booking_status_history
      .mockResolvedValueOnce([]); // INSERT partner_ledger_entries

    const res = await service.uzumCheckoutCallback(normalized());
    expect(res).toEqual({ received: true, duplicate: false, applied: true });

    const paidUpd = findCall(pg.query, 'SET status = $1, provider_reference');
    expect(paidUpd?.[1]?.[0]).toBe('paid');
    expect(countCalls(pg.query, 'INSERT INTO partner_ledger_entries')).toBe(1);
    // event_key uzum_checkout:confirm:<orderId>
    const claim = findCall(pg.query, 'INSERT INTO payment_events');
    expect(String(claim?.[1]?.[3])).toBe(`uzum_checkout:confirm:${ORDER_ID}`);
  });

  it('2/10) duplicate callback — ikkinchi marta PAID/ledger qilinmaydi, applied=false', async () => {
    pg.query
      .mockResolvedValueOnce([checkoutPayment]) // locate payment
      .mockResolvedValueOnce([]) // claim -> ON CONFLICT DO NOTHING (0 rows)
      .mockResolvedValueOnce([{ id: 'evt-1', payment_id: 'payment-uzc-1' }]) // existing event
      .mockResolvedValueOnce([{ ...checkoutPayment, status: 'paid' }]); // existing payment

    const res = await service.uzumCheckoutCallback(normalized());
    expect(res).toEqual({ received: true, duplicate: true, applied: false });
    expect(countCalls(pg.query, 'INSERT INTO partner_ledger_entries')).toBe(0);
    expect(
      findCall(pg.query, 'SET status = $1, provider_reference'),
    ).toBeUndefined();
  });

  it('3) unknown order — hech narsa yozilmaydi, code=unknown_order', async () => {
    pg.query.mockResolvedValueOnce([]); // no payment
    const res = await service.uzumCheckoutCallback(normalized());
    expect(res).toMatchObject({ applied: false, code: 'unknown_order' });
    expect(pg.query).toHaveBeenCalledTimes(1);
  });

  it('3b) matched payment is NOT a checkout payment — treated as unknown_order', async () => {
    pg.query.mockResolvedValueOnce([
      { ...checkoutPayment, provider: 'click', idempotency_key: 'click:x' },
    ]);
    const res = await service.uzumCheckoutCallback(normalized());
    expect(res).toMatchObject({ applied: false, code: 'unknown_order' });
  });

  it('4) amount mismatch — reject, PAID qilinmaydi', async () => {
    pg.query
      .mockResolvedValueOnce([checkoutPayment])
      .mockResolvedValueOnce([{ id: 'evt-1', payment_id: null }]) // claim
      .mockResolvedValueOnce([openBooking]) // booking
      .mockResolvedValueOnce([checkoutPayment]); // payment FOR UPDATE (amount 150000)

    const res = await service.uzumCheckoutCallback(
      normalized({ amountSom: 999999 }),
    );
    expect(res).toMatchObject({ applied: false, code: 'amount_mismatch' });
    expect(
      findCall(pg.query, 'SET status = $1, provider_reference'),
    ).toBeUndefined();
  });

  it('5) currency mismatch — reject, PAID qilinmaydi', async () => {
    pg.query
      .mockResolvedValueOnce([checkoutPayment])
      .mockResolvedValueOnce([{ id: 'evt-1', payment_id: null }])
      .mockResolvedValueOnce([openBooking])
      .mockResolvedValueOnce([checkoutPayment]); // currency UZS

    const res = await service.uzumCheckoutCallback(
      normalized({ currency: 'USD' }),
    );
    expect(res).toMatchObject({ applied: false, code: 'currency_mismatch' });
    expect(
      findCall(pg.query, 'SET status = $1, provider_reference'),
    ).toBeUndefined();
  });

  it('11) non-PAID state — audit event claim, payment/booking TEGILMAYDI', async () => {
    pg.query
      .mockResolvedValueOnce([checkoutPayment]) // locate payment
      .mockResolvedValueOnce([]); // INSERT payment_events (audit)

    const res = await service.uzumCheckoutCallback(
      normalized({ state: 'FAILED' }),
    );
    expect(res).toEqual({ received: true, duplicate: false, applied: false });
    expect(
      findCall(pg.query, 'SET status = $1, provider_reference'),
    ).toBeUndefined();
    expect(countCalls(pg.query, 'INSERT INTO partner_ledger_entries')).toBe(0);
    const audit = findCall(pg.query, 'INSERT INTO payment_events');
    // audit INSERT params: [id, event_type, event_key, payload, hash, ts]
    expect(String(audit?.[1]?.[2])).toBe(`uzum_checkout:${ORDER_ID}:FAILED`);
    expect(String(audit?.[1]?.[1])).toBe('callback:failed');
  });

  it('UNKNOWN state (spec yo‘q) — hech narsa PAID bo‘lmaydi', async () => {
    pg.query.mockResolvedValueOnce([checkoutPayment]).mockResolvedValueOnce([]); // audit insert
    const res = await service.uzumCheckoutCallback(
      normalized({ state: 'UNKNOWN' }),
    );
    expect(res.applied).toBe(false);
    expect(
      findCall(pg.query, 'SET status = $1, provider_reference'),
    ).toBeUndefined();
  });
});

describe('normalizeCheckoutCallback (raw -> internal, best-effort, fail-closed state)', () => {
  it('noma‘lum xom state => UNKNOWN (STATE_MAP bo‘sh — Uzum spec yo‘q)', () => {
    for (const s of [
      'COMPLETED',
      'SUCCESS',
      'PAID',
      'DECLINED',
      'random',
      '',
    ]) {
      expect(normalizeCheckoutCallback({ state: s }).state).toBe('UNKNOWN');
    }
  });

  it('keng tarqalgan maydon nomlarini best-effort o‘qiydi', () => {
    const n = normalizeCheckoutCallback({
      orderId: 'A1',
      orderNumber: 'UZB-1',
      merchantOperationId: 'P1',
      amount: '150000',
      currency: 'uzs',
    });
    expect(n).toMatchObject({
      orderId: 'A1',
      orderNumber: 'UZB-1',
      merchantOperationId: 'P1',
      amountSom: 150000,
      currency: 'UZS',
      state: 'UNKNOWN',
    });
  });

  it('snake_case aliaslar', () => {
    const n = normalizeCheckoutCallback({
      order_id: 'A2',
      order_number: 'UZB-2',
      merchant_operation_id: 'P2',
      total: 300000,
    });
    expect(n).toMatchObject({
      orderId: 'A2',
      orderNumber: 'UZB-2',
      merchantOperationId: 'P2',
      amountSom: 300000,
    });
  });

  it('amount yo‘q => NaN (assertPaymentMatchesPayload tekshiruvi o‘tkazib yuboriladi)', () => {
    expect(Number.isNaN(normalizeCheckoutCallback({}).amountSom)).toBe(true);
  });
});

/**
 * Register-flow (`createPayment({ provider: 'uzum_checkout' })` ->
 * `createUzumCheckoutPayment`) — INTERNAL seam. Uzum wire-format kelmaguncha
 * `UzumCheckoutProvider.register()` FAIL-CLOSED, shu sabab bu yerda oqim
 * aniq 503 qaytaradi va HECH QANDAY `payments` qatori yozilmaydi.
 */
describe('PaymentsService.createUzumCheckoutPayment (register seam — fail-closed)', () => {
  const admin: RequestActor = {
    id: 'admin-1',
    actorType: 'admin',
    role: Role.SUPER_ADMIN,
    roles: [Role.SUPER_ADMIN],
  };
  const bookingRow = {
    id: 'booking-1',
    booking_number: 'UZB-QATEST01',
    user_id: 'user-1',
    partner_organization_id: 'partner-1',
    total_amount: '150000',
    currency: 'UZS',
    status: 'pending',
  };

  const makeService = (cfg: Record<string, string | undefined>) => {
    const pg = { query: jest.fn(), transaction: jest.fn() };
    const service = new PaymentsService(
      pg as unknown as PostgresService,
      { get: jest.fn() } as never,
      { isConfigured: () => false } as never,
      { isConfigured: () => false } as never,
      new UzumProvider({ get: jest.fn() } as never),
      new UzumCheckoutProvider({ get: (k: string) => cfg[k] } as never),
    );
    return { pg, service };
  };

  it('konfiguratsiya yo‘q => 503 PAYMENT_PROVIDER_NOT_CONFIGURED, INSERT yo‘q', async () => {
    const { pg, service } = makeService({});
    pg.query
      .mockResolvedValueOnce([bookingRow]) // assertBookingVisible
      .mockResolvedValueOnce([]) // createPayment: no open payment
      .mockResolvedValueOnce([]); // createUzumCheckoutPayment: no open payment

    await expect(
      service.createPayment(admin, 'booking-1', { provider: 'uzum_checkout' }),
    ).rejects.toMatchObject({
      status: 503,
      response: { code: 'PAYMENT_PROVIDER_NOT_CONFIGURED' },
    });

    const insertCall = (pg.query.mock.calls as Array<[string]>).find(([sql]) =>
      String(sql).includes('INSERT INTO payments'),
    );
    expect(insertCall).toBeUndefined();
  });

  it('mavjud ochiq to‘lov bo‘lsa — o‘shani qaytaradi, register chaqirilmaydi', async () => {
    const { pg, service } = makeService({});
    const open = { ...checkoutPayment, status: 'processing' };
    pg.query
      .mockResolvedValueOnce([bookingRow]) // assertBookingVisible
      .mockResolvedValueOnce([]) // createPayment: no open payment
      .mockResolvedValueOnce([open]); // createUzumCheckoutPayment: existing open

    const res = await service.createPayment(admin, 'booking-1', {
      provider: 'uzum_checkout',
    });
    expect(res).toEqual(open);
    const insertCall = (pg.query.mock.calls as Array<[string]>).find(([sql]) =>
      String(sql).includes('INSERT INTO payments'),
    );
    expect(insertCall).toBeUndefined();
  });
});

describe('PaymentsService.reconcileUzumCheckoutPayments (fail-closed)', () => {
  it('checkout sozlanmagan => no-op ({scanned:0,updated:0}), DB so‘rovsiz', async () => {
    const pg = { query: jest.fn(), transaction: jest.fn() };
    const service = new PaymentsService(
      pg as unknown as PostgresService,
      { get: jest.fn() } as never,
      { isConfigured: () => false } as never,
      { isConfigured: () => false } as never,
      new UzumProvider({ get: jest.fn() } as never),
      new UzumCheckoutProvider({ get: () => undefined } as never),
    );

    const res = await service.reconcileUzumCheckoutPayments();
    expect(res).toEqual({ scanned: 0, updated: 0 });
    expect(pg.query).not.toHaveBeenCalled();
  });
});
