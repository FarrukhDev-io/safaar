import { hmacSha256 } from '../auth/security';
import { UzumCheckoutController } from './uzum-checkout.controller';
import {
  UzumCheckoutProvider,
  stableStringify,
  type NormalizedCheckoutCallback,
} from './providers/uzum-checkout.provider';
import type { PaymentsService } from './payments.service';

/**
 * Controller-level tekshiruv: route mavjud, javob statuslari nazorat ostida,
 * server crash bo'lmaydi. Uzum production kontrakti EMAS — imzo/payload spec'i
 * bizda yo'q, shu sabab default holatda callback FAIL-CLOSED rad etiladi.
 * `hmac-sha256` — spec kelmaguncha ishlatiladigan JOY-EGALLOVCHI sxema.
 */

type Sent = { status?: number; body?: unknown };

function fakeRes(): { res: never; sent: Sent } {
  const sent: Sent = {};
  const res = {
    status(code: number) {
      sent.status = code;
      return res;
    },
    json(body: unknown) {
      sent.body = body;
      return res;
    },
  };
  return { res: res as never, sent };
}

const req = (headers: Record<string, string> = {}): never =>
  ({ headers }) as never;

const KEY = 'test-checkout-sign-key-0123456789';
const CFG_HMAC: Record<string, string> = {
  UZUM_CHECKOUT_CALLBACK_SIGN_KEY: KEY,
  UZUM_CHECKOUT_SIGNATURE_SCHEME: 'hmac-sha256',
};

function sign(body: Record<string, unknown>): string {
  return hmacSha256(stableStringify(body), KEY);
}

function makeController(
  uzumCheckoutCallback: jest.Mock,
  cfg: Record<string, string | undefined> = {},
): UzumCheckoutController {
  return new UzumCheckoutController(
    { uzumCheckoutCallback } as unknown as PaymentsService,
    new UzumCheckoutProvider({
      get: (k: string) => cfg[k],
    } as never),
  );
}

describe('UzumCheckoutController POST /uzum/checkout/callback', () => {
  it('G) malformed body ([]) => 400, service chaqirilmaydi, crash yo‘q', async () => {
    const svc = jest.fn();
    const { res, sent } = fakeRes();
    await makeController(svc).callback(req(), res, [] as unknown);
    expect(sent.status).toBe(400);
    expect(sent.body).toMatchObject({ status: 'FAILED' });
    expect(svc).not.toHaveBeenCalled();
  });

  it('F) imzo sxemasi sozlanmagan (default) => 401 fail-closed, service chaqirilmaydi', async () => {
    const svc = jest.fn();
    const { res, sent } = fakeRes();
    await makeController(svc).callback(req({ 'x-signature': 'x' }), res, {
      orderId: 'A',
    });
    expect(sent.status).toBe(401);
    expect(sent.body).toMatchObject({
      status: 'FAILED',
      code: 'verification_not_configured',
    });
    expect(svc).not.toHaveBeenCalled();
  });

  it('F) noto‘g‘ri imzo => 401, service chaqirilmaydi', async () => {
    const svc = jest.fn();
    const { res, sent } = fakeRes();
    await makeController(svc, CFG_HMAC).callback(
      req({ 'x-signature': 'deadbeef' }),
      res,
      { orderId: 'A' },
    );
    expect(sent.status).toBe(401);
    expect(svc).not.toHaveBeenCalled();
  });

  it('C) unknown_order => 404', async () => {
    const body = { orderId: 'A', state: 'X' };
    const svc = jest.fn().mockResolvedValue({
      received: true,
      duplicate: false,
      applied: false,
      code: 'unknown_order',
    });
    const { res, sent } = fakeRes();
    await makeController(svc, CFG_HMAC).callback(
      req({ 'x-signature': sign(body) }),
      res,
      body,
    );
    expect(sent.status).toBe(404);
    // controllerda `normalizeCheckoutCallback` ishlagan, `state` UNKNOWN
    const [passed] = svc.mock.calls[0] as [NormalizedCheckoutCallback];
    expect(passed.orderId).toBe('A');
    expect(passed.state).toBe('UNKNOWN');
  });

  it('D/E) amount/currency mismatch => 422', async () => {
    const body = { orderId: 'A' };
    const svc = jest.fn().mockResolvedValue({
      received: true,
      duplicate: false,
      applied: false,
      code: 'amount_mismatch',
    });
    const { res, sent } = fakeRes();
    await makeController(svc, CFG_HMAC).callback(
      req({ 'x-signature': sign(body) }),
      res,
      body,
    );
    expect(sent.status).toBe(422);
  });

  it('A/B) accepted / duplicate => 200', async () => {
    const body = { orderId: 'A' };
    const svc = jest.fn().mockResolvedValue({
      received: true,
      duplicate: true,
      applied: false,
    });
    const { res, sent } = fakeRes();
    await makeController(svc, CFG_HMAC).callback(
      req({ 'x-signature': sign(body) }),
      res,
      body,
    );
    expect(sent.status).toBe(200);
    expect(sent.body).toMatchObject({ status: 'OK', duplicate: true });
  });

  it('imzo rad etilganda — xavfsiz (tipizatsiya qilingan) preview logga yoziladi, lekin imzo/authorization qiymati HECH QACHON', async () => {
    const svc = jest.fn();
    const { res } = fakeRes();
    const controller = makeController(svc);
    const logger = (controller as unknown as { logger: { warn: jest.Mock } })
      .logger;
    const warnSpy = jest.spyOn(logger, 'warn');
    await controller.callback(
      req({
        'x-signature': 'super-secret-signature-value',
        authorization: 'Bearer should-never-be-logged',
      }),
      res,
      { orderId: 'ORD-1', operationType: 'PAYMENT' },
    );
    const logged = warnSpy.mock.calls.map((c) => String(c[0])).join('\n');
    expect(logged).toContain('orderId=ORD-1');
    expect(logged).toContain('operationType=PAYMENT');
    expect(logged).not.toContain('super-secret-signature-value');
    expect(logged).not.toContain('should-never-be-logged');
    warnSpy.mockRestore();
  });

  it('soxta "SUCCESS" callback autentifikatsiyasiz => 401, service chaqirilmaydi (imzo yo‘q bo‘lsa qiymat qanday bo‘lishidan qat‘i nazar)', async () => {
    const svc = jest.fn();
    const { res, sent } = fakeRes();
    await makeController(svc).callback(req(), res, {
      orderId: 'A',
      state: 'SUCCESS',
      operationState: 'COMPLETED',
      status: 'PAID',
    });
    expect(sent.status).toBe(401);
    expect(svc).not.toHaveBeenCalled();
  });

  it('kelajakdagi noma‘lum maydonlar bilan callback — to‘liq xom payload service’ga o‘zgarishsiz uzatiladi', async () => {
    const body = {
      orderId: 'A',
      rrn: '123456789012',
      bindingId: 'bind-xyz',
      operationType: 'PAYMENT',
      someFutureField: { nested: true, arr: [1, 2, 3] },
    };
    const svc = jest.fn().mockResolvedValue({
      received: true,
      duplicate: false,
      applied: false,
      code: 'unknown_order',
    });
    const { res } = fakeRes();
    await makeController(svc, CFG_HMAC).callback(
      req({ 'x-signature': sign(body) }),
      res,
      body,
    );
    const [passed] = svc.mock.calls[0] as [NormalizedCheckoutCallback];
    expect(passed.rrn).toBe('123456789012');
    expect(passed.bindingId).toBe('bind-xyz');
    expect(passed.operationType).toBe('PAYMENT');
    // Xom payload HECH BIR maydon tashlab yuborilmasdan to'liq saqlanadi.
    expect(passed.raw).toEqual(body);
  });

  it('debug sarlavhalar service’ga uzatiladi, lekin imzo/authorization/cookie HECH QACHON', async () => {
    const body = { orderId: 'A' };
    const svc = jest.fn().mockResolvedValue({
      received: true,
      duplicate: false,
      applied: false,
      code: 'unknown_order',
    });
    const { res } = fakeRes();
    await makeController(svc, CFG_HMAC).callback(
      req({
        'x-signature': sign(body),
        'content-type': 'application/json',
        'x-request-id': 'req-123',
        authorization: 'Bearer top-secret-should-never-appear',
        cookie: 'session=super-secret',
      }),
      res,
      body,
    );
    const [, debugHeaders] = svc.mock.calls[0] as [
      NormalizedCheckoutCallback,
      Record<string, string>,
    ];
    expect(debugHeaders).toMatchObject({
      'content-type': 'application/json',
      'x-request-id': 'req-123',
    });
    expect(debugHeaders['x-signature']).toBeUndefined();
    expect(debugHeaders.authorization).toBeUndefined();
    expect(debugHeaders.cookie).toBeUndefined();
    expect(JSON.stringify(debugHeaders)).not.toContain('top-secret');
    expect(JSON.stringify(debugHeaders)).not.toContain('super-secret');
  });

  it('service kutilmagan xato => 500, crash yo‘q', async () => {
    const body = { orderId: 'A' };
    const svc = jest.fn().mockRejectedValue(new Error('boom'));
    const { res, sent } = fakeRes();
    await expect(
      makeController(svc, CFG_HMAC).callback(
        req({ 'x-signature': sign(body) }),
        res,
        body,
      ),
    ).resolves.toBeUndefined();
    expect(sent.status).toBe(500);
    expect(sent.body).toMatchObject({
      status: 'FAILED',
      code: 'internal_error',
    });
  });
});
