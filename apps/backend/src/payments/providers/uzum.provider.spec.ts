import {
  UZUM_ERROR,
  UZUM_STATUS,
  UzumProvider,
  UzumWebhookError,
} from './uzum.provider';

const CFG = {
  UZUM_SERVICE_ID: '101202',
  UZUM_USERNAME: 'safaar-test',
  UZUM_PASSWORD: 's3cr3t-p@ss',
} as Record<string, string>;

function makeProvider(overrides: Partial<typeof CFG> = {}): UzumProvider {
  const cfg = { ...CFG, ...overrides };
  return new UzumProvider({
    get: (key: string) => cfg[key],
  } as never);
}

function basic(user: string, pass: string): string {
  return `Basic ${Buffer.from(`${user}:${pass}`, 'utf8').toString('base64')}`;
}

describe('UzumProvider — Basic Auth', () => {
  it('to‘g‘ri credential — xato tashlamaydi', () => {
    const p = makeProvider();
    expect(() =>
      p.assertBasicAuth(basic('safaar-test', 's3cr3t-p@ss')),
    ).not.toThrow();
  });

  it('noto‘g‘ri parol — 10001', () => {
    const p = makeProvider();
    expect(() => p.assertBasicAuth(basic('safaar-test', 'wrong'))).toThrow(
      expect.objectContaining({ errorCode: UZUM_ERROR.AUTH }),
    );
  });

  it('noto‘g‘ri login — 10001', () => {
    const p = makeProvider();
    expect(() => p.assertBasicAuth(basic('nope', 's3cr3t-p@ss'))).toThrow(
      expect.objectContaining({ errorCode: UZUM_ERROR.AUTH }),
    );
  });

  it('sarlavha yo‘q — 10001', () => {
    const p = makeProvider();
    expect(() => p.assertBasicAuth(undefined)).toThrow(UzumWebhookError);
  });

  it('sxema Basic emas — 10001', () => {
    const p = makeProvider();
    expect(() => p.assertBasicAuth('Bearer abc.def.ghi')).toThrow(
      expect.objectContaining({ errorCode: UZUM_ERROR.AUTH }),
    );
  });

  it('buzuq base64 / ikki nuqta yo‘q — 10001', () => {
    const p = makeProvider();
    expect(() =>
      p.assertBasicAuth(
        `Basic ${Buffer.from('nocolonhere', 'utf8').toString('base64')}`,
      ),
    ).toThrow(expect.objectContaining({ errorCode: UZUM_ERROR.AUTH }));
  });

  it('credential umuman sozlanmagan — har qanday so‘rov 10001', () => {
    const p = makeProvider({ UZUM_PASSWORD: '' });
    expect(p.isConfigured()).toBe(false);
    expect(() =>
      p.assertBasicAuth(basic('safaar-test', 's3cr3t-p@ss')),
    ).toThrow(expect.objectContaining({ errorCode: UZUM_ERROR.AUTH }));
  });
});

describe('UzumProvider — serviceId', () => {
  it('mos serviceId — kelgan qiymatni qaytaradi (number)', () => {
    const p = makeProvider();
    expect(p.assertServiceId(101202)).toBe(101202);
  });

  it('mos serviceId — string ham qabul qilinadi (int64 precision xavfsizligi)', () => {
    const p = makeProvider();
    expect(p.assertServiceId('101202')).toBe('101202');
  });

  it('nomos serviceId — 10006', () => {
    const p = makeProvider();
    expect(() => p.assertServiceId(999)).toThrow(
      expect.objectContaining({ errorCode: UZUM_ERROR.INVALID_SERVICE_ID }),
    );
  });

  it('serviceId yo‘q — 10005', () => {
    const p = makeProvider();
    expect(() => p.assertServiceId(undefined)).toThrow(
      expect.objectContaining({ errorCode: UZUM_ERROR.MISSING_PARAMS }),
    );
  });
});

describe('UzumProvider — tiyin konvertatsiyasi', () => {
  it('25000.00 so‘m → 2 500 000 tiyin', () => {
    expect(makeProvider().toTiyin('25000.00')).toBe(2_500_000);
  });
  it('kasr yaxlitlanadi', () => {
    expect(makeProvider().toTiyin(1234.005)).toBe(123_401);
  });
});

describe('UzumProvider — javob quruvchilar', () => {
  const p = makeProvider();

  it('checkOk — { serviceId, timestamp, status: OK, data }', () => {
    const r = p.checkOk(101202, { amount: 2_500_000 });
    expect(r).toMatchObject({ serviceId: 101202, status: UZUM_STATUS.OK });
    expect(typeof r.timestamp).toBe('number');
    expect(r.data).toEqual({ amount: 2_500_000 });
  });

  it('created — status CREATED + transTime + amount(tiyin)', () => {
    const r = p.created(101202, 'uuid-1', 2_500_000);
    expect(r).toMatchObject({
      serviceId: 101202,
      transId: 'uuid-1',
      status: UZUM_STATUS.CREATED,
      amount: 2_500_000,
    });
    expect(typeof r.transTime).toBe('number');
  });

  it('confirmed — status CONFIRMED + confirmTime', () => {
    const r = p.confirmed(101202, 'uuid-1', 2_500_000);
    expect(r.status).toBe(UZUM_STATUS.CONFIRMED);
    expect(typeof r.confirmTime).toBe('number');
  });

  it('reversed — status REVERSED + reverseTime', () => {
    const r = p.reversed(101202, 'uuid-1', 2_500_000);
    expect(r.status).toBe(UZUM_STATUS.REVERSED);
    expect(typeof r.reverseTime).toBe('number');
  });

  it('statusResult — transTime/confirmTime/reverseTime null bo‘lishi mumkin', () => {
    const r = p.statusResult(
      101202,
      'uuid-1',
      UZUM_STATUS.CREATED,
      { transTime: 111 },
      2_500_000,
    );
    expect(r).toMatchObject({
      status: UZUM_STATUS.CREATED,
      transTime: 111,
      confirmTime: null,
      reverseTime: null,
      amount: 2_500_000,
    });
  });

  it('errorBody — AYNAN { serviceId, status: FAILED, errorCode } — errorMessage YO‘Q', () => {
    const r = p.errorBody(101202, UZUM_ERROR.INVALID_AMOUNT);
    expect(r).toEqual({
      serviceId: 101202,
      status: UZUM_STATUS.FAILED,
      errorCode: '10011',
    });
    expect(r).not.toHaveProperty('errorMessage');
  });

  it('errorBody — serviceId noma‘lum bo‘lsa null', () => {
    expect(p.errorBody(undefined, UZUM_ERROR.AUTH)).toEqual({
      serviceId: null,
      status: 'FAILED',
      errorCode: '10001',
    });
  });
});
