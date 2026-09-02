import type { NextFunction, Request, Response } from 'express';
import { PaymentsService } from './payments.service';
import { UzumWebhookController } from './uzum-webhook.controller';
import { uzumJsonErrorMiddleware } from './uzum-json-error.middleware';
import {
  UZUM_ERROR,
  UzumProvider,
  UzumWebhookError,
} from './providers/uzum.provider';

const UZUM_CFG: Record<string, string> = {
  UZUM_SERVICE_ID: '101202',
  UZUM_USERNAME: 'safaar-test',
  UZUM_PASSWORD: 's3cr3t',
};

function basic(user: string, pass: string): string {
  return `Basic ${Buffer.from(`${user}:${pass}`, 'utf8').toString('base64')}`;
}

interface FakeRes {
  statusCode?: number;
  body?: unknown;
  status: jest.Mock;
  json: jest.Mock;
}

function makeRes(): FakeRes {
  const res = {} as FakeRes;
  res.status = jest.fn((code: number) => {
    res.statusCode = code;
    return res;
  });
  res.json = jest.fn((payload: unknown) => {
    res.body = payload;
    return res;
  });
  return res;
}

function makeReq(authorization?: string): Request {
  return { headers: { authorization } } as unknown as Request;
}

describe('UzumWebhookController', () => {
  let payments: jest.Mocked<
    Pick<
      PaymentsService,
      'uzumCheck' | 'uzumCreate' | 'uzumConfirm' | 'uzumReverse' | 'uzumStatus'
    >
  >;
  let controller: UzumWebhookController;

  const auth = basic('safaar-test', 's3cr3t');

  beforeEach(() => {
    payments = {
      uzumCheck: jest.fn(),
      uzumCreate: jest.fn(),
      uzumConfirm: jest.fn(),
      uzumReverse: jest.fn(),
      uzumStatus: jest.fn(),
    };
    controller = new UzumWebhookController(
      payments as unknown as PaymentsService,
      new UzumProvider({ get: (k: string) => UZUM_CFG[k] } as never),
    );
  });

  it('muvaffaqiyat — HTTP 200, javob AYNAN service qaytargan obyekt (envelope YO‘Q)', async () => {
    const raw = {
      serviceId: 101202,
      status: 'OK',
      timestamp: 123,
      data: {},
    };
    payments.uzumCheck.mockResolvedValueOnce(raw as never);
    const res = makeRes();

    await controller.handle(
      'check',
      makeReq(auth),
      res as unknown as Response,
      { serviceId: 101202, params: { account: 'SAF-1' } },
    );

    expect(res.status).toHaveBeenCalledWith(200);
    // Aynan o'sha reference — hech qanday `{ success, data }` o'ramasi yo'q.
    expect(res.json).toHaveBeenCalledWith(raw);
    expect(res.body).toBe(raw);
    expect(res.body).not.toHaveProperty('success');
  });

  it('service UzumWebhookError tashlasa — HTTP 400 + { serviceId, status: FAILED, errorCode }', async () => {
    payments.uzumConfirm.mockRejectedValueOnce(
      new UzumWebhookError(UZUM_ERROR.TRANS_NOT_FOUND, 101202),
    );
    const res = makeRes();

    await controller.handle(
      'confirm',
      makeReq(auth),
      res as unknown as Response,
      { serviceId: 101202, transId: 'x' },
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.body).toEqual({
      serviceId: 101202,
      status: 'FAILED',
      errorCode: '10014',
    });
    expect(res.body).not.toHaveProperty('errorMessage');
  });

  it('noto‘g‘ri Basic Auth — HTTP 400 / 10001, service CHAQIRILMAYDI', async () => {
    const res = makeRes();

    await controller.handle(
      'check',
      makeReq(basic('safaar-test', 'WRONG')),
      res as unknown as Response,
      { serviceId: 101202 },
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.body).toEqual({
      serviceId: null,
      status: 'FAILED',
      errorCode: '10001',
    });
    expect(payments.uzumCheck).not.toHaveBeenCalled();
  });

  it('Authorization sarlavhasi umuman yo‘q — 10001', async () => {
    const res = makeRes();
    await controller.handle(
      'status',
      makeReq(undefined),
      res as unknown as Response,
      { serviceId: 101202, transId: 'x' },
    );
    expect(res.statusCode).toBe(400);
    expect((res.body as Record<string, unknown>).errorCode).toBe('10001');
    expect(payments.uzumStatus).not.toHaveBeenCalled();
  });

  it('noma‘lum operatsiya — 10003, serviceId echo qilinadi', async () => {
    const res = makeRes();

    await controller.handle(
      'refund',
      makeReq(auth),
      res as unknown as Response,
      { serviceId: 777 },
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.body).toEqual({
      serviceId: 777,
      status: 'FAILED',
      errorCode: '10003',
    });
  });

  it.each([
    ['massiv', [] as unknown],
    ['null', null],
    ['string', 'not-json'],
  ])('tana obyekt emas (%s) — 10002', async (_label, badRaw) => {
    const res = makeRes();
    await controller.handle(
      'check',
      makeReq(auth),
      res as unknown as Response,
      badRaw,
    );
    expect(res.statusCode).toBe(400);
    expect((res.body as Record<string, unknown>).errorCode).toBe('10002');
    expect(payments.uzumCheck).not.toHaveBeenCalled();
  });

  it('Postgres UNIQUE buzilishi (23505) service’dan chiqsa — 10010', async () => {
    payments.uzumCreate.mockRejectedValueOnce(
      Object.assign(new Error('duplicate key'), { code: '23505' }),
    );
    const res = makeRes();

    await controller.handle(
      'create',
      makeReq(auth),
      res as unknown as Response,
      {
        serviceId: 101202,
        transId: 'x',
        amount: 100,
        params: { account: 'A' },
      },
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.body).toEqual({
      serviceId: 101202,
      status: 'FAILED',
      errorCode: '10010',
    });
  });

  it('kutilmagan xato — 99999 (HTTP 400), xato matni javob tanasiga tushmaydi', async () => {
    payments.uzumReverse.mockRejectedValueOnce(
      new Error('internal detail should not leak to response'),
    );
    const res = makeRes();

    await controller.handle(
      'reverse',
      makeReq(auth),
      res as unknown as Response,
      { serviceId: 101202, transId: 'x' },
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.body).toEqual({
      serviceId: 101202,
      status: 'FAILED',
      errorCode: '99999',
    });
    expect(JSON.stringify(res.body)).not.toContain('internal detail');
  });

  it('operatsiya routing — har biri o‘z service metodiga boradi', async () => {
    const ok = { ok: true };
    payments.uzumCheck.mockResolvedValue(ok as never);
    payments.uzumCreate.mockResolvedValue(ok as never);
    payments.uzumConfirm.mockResolvedValue(ok as never);
    payments.uzumReverse.mockResolvedValue(ok as never);
    payments.uzumStatus.mockResolvedValue(ok as never);

    for (const op of ['check', 'create', 'confirm', 'reverse', 'status']) {
      await controller.handle(
        op,
        makeReq(auth),
        makeRes() as unknown as Response,
        { serviceId: 101202 },
      );
    }

    expect(payments.uzumCheck).toHaveBeenCalledTimes(1);
    expect(payments.uzumCreate).toHaveBeenCalledTimes(1);
    expect(payments.uzumConfirm).toHaveBeenCalledTimes(1);
    expect(payments.uzumReverse).toHaveBeenCalledTimes(1);
    expect(payments.uzumStatus).toHaveBeenCalledTimes(1);
  });
});

describe('uzumJsonErrorMiddleware (M-4: noto‘g‘ri JSON tanasi → 10002)', () => {
  // `express.json()` `http-errors` orqali AYNAN shunday xato tashlaydi:
  // asl `SyntaxError` obyekti, `type: 'entity.parse.failed'` va
  // `status`/`statusCode` = 400 bilan boyitilgan.
  function parseError(): Error {
    return Object.assign(
      new SyntaxError('Unexpected token } in JSON at position 5'),
      {
        type: 'entity.parse.failed',
        status: 400,
        statusCode: 400,
        expose: true,
        body: '{"serviceId":101202,}',
      },
    );
  }

  function ctx(url: string) {
    const res = makeRes() as FakeRes & { headersSent: boolean };
    res.headersSent = false;
    const req = { url, originalUrl: url } as unknown as Request;
    const next = jest.fn() as unknown as NextFunction;
    return { res, req, next };
  }

  it('Uzum webhook route + parse xatosi → HTTP 400, { serviceId:null, status:FAILED, errorCode:10002 }', () => {
    const { res, req, next } = ctx('/v1/uzum/webhook/create');

    uzumJsonErrorMiddleware(
      parseError(),
      req,
      res as unknown as Response,
      next,
    );

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.body).toEqual({
      serviceId: null,
      status: 'FAILED',
      errorCode: '10002',
    });
    expect(res.body).not.toHaveProperty('errorMessage');
    // Generic SAFAAR envelope chiqmasin.
    expect(res.body).not.toHaveProperty('success');
    expect(res.body).not.toHaveProperty('error');
  });

  it('legacy `/api/uzum/webhook/...` prefiksi ham qamrab olinadi', () => {
    const { res, req, next } = ctx('/api/uzum/webhook/check');

    uzumJsonErrorMiddleware(
      parseError(),
      req,
      res as unknown as Response,
      next,
    );

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(400);
    expect((res.body as Record<string, unknown>).errorCode).toBe('10002');
  });

  it('Uzum bo‘lmagan route — xato O‘ZGARTIRILMASDAN uzatiladi (global filter tegilmaydi)', () => {
    const err = parseError();
    const { res, req, next } = ctx('/v1/bookings');

    uzumJsonErrorMiddleware(err, req, res as unknown as Response, next);

    expect(next).toHaveBeenCalledWith(err);
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });

  it('Uzum route, lekin parse xatosi EMAS — xato uzatiladi', () => {
    const err = new Error('some downstream failure');
    const { res, req, next } = ctx('/v1/uzum/webhook/confirm');

    uzumJsonErrorMiddleware(err, req, res as unknown as Response, next);

    expect(next).toHaveBeenCalledWith(err);
    expect(res.status).not.toHaveBeenCalled();
  });

  it('javob allaqachon yuborilgan bo‘lsa — ikkinchi marta yozmaydi', () => {
    const err = parseError();
    const { res, req, next } = ctx('/v1/uzum/webhook/create');
    res.headersSent = true;

    uzumJsonErrorMiddleware(err, req, res as unknown as Response, next);

    expect(next).toHaveBeenCalledWith(err);
    expect(res.json).not.toHaveBeenCalled();
  });
});
