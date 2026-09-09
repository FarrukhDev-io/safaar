import { hmacSha256 } from '../../auth/security';
import {
  UZUM_CHECKOUT_ERROR,
  UzumCheckoutError,
  UzumCheckoutProvider,
  normalizeCheckoutCallback,
  pickDebugHeaders,
  stableStringify,
} from './uzum-checkout.provider';

/**
 * Uzum'ning RASMIY Checkout imzo algoritmi bizda YO'Q. Bu testlar faqat
 * abstraction'ning FAIL-CLOSED xulqini va joy-egallovchi `hmac-sha256`
 * sxemasini tekshiradi — Uzum production kontrakti EMAS.
 */

const mkConfig = (cfg: Record<string, string | undefined>) =>
  ({ get: <T>(k: string) => cfg[k] as unknown as T }) as never;

const SIGN_KEY = 'test-callback-sign-key-0123456789';
const body = { orderId: 'A1', state: 'X', amount: '1000' };

describe('UzumCheckoutProvider.verifyCallback — FAIL-CLOSED', () => {
  it('sxema sozlanmagan (default) => har qanday callback rad etiladi', () => {
    const p = new UzumCheckoutProvider(mkConfig({}));
    expect(p.isCallbackVerificationConfigured()).toBe(false);
    expect(() => p.verifyCallback(body, { 'x-signature': 'anything' })).toThrow(
      UzumCheckoutError,
    );
    try {
      p.verifyCallback(body, { 'x-signature': 'anything' });
    } catch (e) {
      expect((e as UzumCheckoutError).code).toBe(
        UZUM_CHECKOUT_ERROR.VERIFICATION_NOT_CONFIGURED,
      );
    }
  });

  it('sign key bor, lekin scheme=none => hali ham fail-closed', () => {
    const p = new UzumCheckoutProvider(
      mkConfig({ UZUM_CHECKOUT_CALLBACK_SIGN_KEY: SIGN_KEY }),
    );
    expect(p.isCallbackVerificationConfigured()).toBe(false);
    expect(() => p.verifyCallback(body, {})).toThrow(UzumCheckoutError);
  });

  it('scheme=hmac-sha256, imzo header yo‘q => SIGNATURE_MISSING', () => {
    const p = new UzumCheckoutProvider(
      mkConfig({
        UZUM_CHECKOUT_CALLBACK_SIGN_KEY: SIGN_KEY,
        UZUM_CHECKOUT_SIGNATURE_SCHEME: 'hmac-sha256',
      }),
    );
    expect(p.isCallbackVerificationConfigured()).toBe(true);
    try {
      p.verifyCallback(body, {});
      throw new Error('should have thrown');
    } catch (e) {
      expect((e as UzumCheckoutError).code).toBe(
        UZUM_CHECKOUT_ERROR.SIGNATURE_MISSING,
      );
    }
  });

  it('scheme=hmac-sha256, noto‘g‘ri imzo => SIGNATURE_INVALID', () => {
    const p = new UzumCheckoutProvider(
      mkConfig({
        UZUM_CHECKOUT_CALLBACK_SIGN_KEY: SIGN_KEY,
        UZUM_CHECKOUT_SIGNATURE_SCHEME: 'hmac-sha256',
      }),
    );
    try {
      p.verifyCallback(body, { 'x-signature': 'deadbeef' });
      throw new Error('should have thrown');
    } catch (e) {
      expect((e as UzumCheckoutError).code).toBe(
        UZUM_CHECKOUT_ERROR.SIGNATURE_INVALID,
      );
    }
  });

  it('scheme=hmac-sha256, to‘g‘ri imzo => o‘tadi (joy-egallovchi sxema)', () => {
    const p = new UzumCheckoutProvider(
      mkConfig({
        UZUM_CHECKOUT_CALLBACK_SIGN_KEY: SIGN_KEY,
        UZUM_CHECKOUT_SIGNATURE_SCHEME: 'hmac-sha256',
      }),
    );
    const sig = hmacSha256(stableStringify(body), SIGN_KEY);
    expect(() => p.verifyCallback(body, { 'x-signature': sig })).not.toThrow();
  });

  it('custom header nomi (UZUM_CHECKOUT_SIGNATURE_HEADER)', () => {
    const p = new UzumCheckoutProvider(
      mkConfig({
        UZUM_CHECKOUT_CALLBACK_SIGN_KEY: SIGN_KEY,
        UZUM_CHECKOUT_SIGNATURE_SCHEME: 'hmac-sha256',
        UZUM_CHECKOUT_SIGNATURE_HEADER: 'X-Uzum-Signature',
      }),
    );
    const sig = hmacSha256(stableStringify(body), SIGN_KEY);
    expect(() =>
      p.verifyCallback(body, { 'x-uzum-signature': sig }),
    ).not.toThrow();
    expect(() => p.verifyCallback(body, { 'x-signature': sig })).toThrow(); // eski header nomi endi qabul qilinmaydi
  });

  it('noma‘lum scheme nomi => fail-closed', () => {
    const p = new UzumCheckoutProvider(
      mkConfig({
        UZUM_CHECKOUT_CALLBACK_SIGN_KEY: SIGN_KEY,
        UZUM_CHECKOUT_SIGNATURE_SCHEME: 'rsa-magic',
      }),
    );
    expect(() => p.verifyCallback(body, { 'x-signature': 'x' })).toThrow(
      UzumCheckoutError,
    );
  });
});

describe('UzumCheckoutProvider.isConfigured (outbound /payment/register)', () => {
  it('base+merchant+apiKey barchasi kerak', () => {
    expect(new UzumCheckoutProvider(mkConfig({})).isConfigured()).toBe(false);
    expect(
      new UzumCheckoutProvider(
        mkConfig({
          UZUM_CHECKOUT_BASE_URL: 'https://x',
          UZUM_CHECKOUT_MERCHANT_ID: 'm',
        }),
      ).isConfigured(),
    ).toBe(false);
    expect(
      new UzumCheckoutProvider(
        mkConfig({
          UZUM_CHECKOUT_BASE_URL: 'https://x',
          UZUM_CHECKOUT_MERCHANT_ID: 'm',
          UZUM_CHECKOUT_API_KEY: 'k',
        }),
      ).isConfigured(),
    ).toBe(true);
  });
});

describe('UzumCheckoutProvider outbound (register/getOrderStatus/refund) — FAIL-CLOSED', () => {
  const registerInput = {
    bookingId: 'booking-1',
    orderNumber: 'UZB-1',
    merchantOperationId: 'payment-1',
    amountSom: 150000,
    currency: 'UZS',
    successUrl: 'https://safaar.uz/booking/booking-1?payment=success',
    failureUrl: 'https://safaar.uz/booking/booking-1?payment=failed',
  };

  it('env sozlanmagan => NOT_CONFIGURED (tashqi so‘rov yo‘q)', async () => {
    const p = new UzumCheckoutProvider(mkConfig({}));
    await expect(p.register(registerInput)).rejects.toMatchObject({
      code: UZUM_CHECKOUT_ERROR.NOT_CONFIGURED,
    });
    await expect(p.getOrderStatus('order-1')).rejects.toMatchObject({
      code: UZUM_CHECKOUT_ERROR.NOT_CONFIGURED,
    });
    await expect(p.getOperationState('order-1')).rejects.toMatchObject({
      code: UZUM_CHECKOUT_ERROR.NOT_CONFIGURED,
    });
    await expect(
      p.refund({ orderId: 'order-1', amountSom: 150000 }),
    ).rejects.toMatchObject({ code: UZUM_CHECKOUT_ERROR.NOT_CONFIGURED });
  });

  it('env sozlangan, lekin rasmiy wire-format yo‘q => SPEC_REQUIRED (taxminiy so‘rov YUBORILMAYDI)', async () => {
    const fetchSpy = jest.spyOn(globalThis, 'fetch');
    const p = new UzumCheckoutProvider(
      mkConfig({
        UZUM_CHECKOUT_BASE_URL: 'https://checkout.example',
        UZUM_CHECKOUT_MERCHANT_ID: 'm',
        UZUM_CHECKOUT_API_KEY: 'k',
      }),
    );
    await expect(p.register(registerInput)).rejects.toMatchObject({
      code: UZUM_CHECKOUT_ERROR.SPEC_REQUIRED,
    });
    await expect(p.getOrderStatus('order-1')).rejects.toMatchObject({
      code: UZUM_CHECKOUT_ERROR.SPEC_REQUIRED,
    });
    await expect(
      p.refund({ orderId: 'order-1', amountSom: 150000 }),
    ).rejects.toMatchObject({ code: UZUM_CHECKOUT_ERROR.SPEC_REQUIRED });
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });
});

describe('UzumCheckoutProvider.signatureHeaderName', () => {
  it('default => x-signature', () => {
    expect(new UzumCheckoutProvider(mkConfig({})).signatureHeaderName()).toBe(
      'x-signature',
    );
  });
  it('custom sozlangan bo‘lsa — kichik harfga normallashtirilgan holda qaytadi', () => {
    expect(
      new UzumCheckoutProvider(
        mkConfig({ UZUM_CHECKOUT_SIGNATURE_HEADER: 'X-Uzum-Signature' }),
      ).signatureHeaderName(),
    ).toBe('x-uzum-signature');
  });
});

describe('normalizeCheckoutCallback — audit-only qo‘shimcha maydonlar (operationType/rrn/bindingId)', () => {
  it('mavjud bo‘lsa o‘qiladi (camelCase)', () => {
    const n = normalizeCheckoutCallback({
      orderId: 'A1',
      operationType: 'PAYMENT',
      rrn: '123456789012',
      bindingId: 'bind-1',
    });
    expect(n.operationType).toBe('PAYMENT');
    expect(n.rrn).toBe('123456789012');
    expect(n.bindingId).toBe('bind-1');
  });

  it('mavjud bo‘lsa o‘qiladi (snake_case / RRN)', () => {
    const n = normalizeCheckoutCallback({
      order_id: 'A1',
      operation_type: 'REFUND',
      RRN: '000000000001',
      binding_id: 'bind-2',
    });
    expect(n.operationType).toBe('REFUND');
    expect(n.rrn).toBe('000000000001');
    expect(n.bindingId).toBe('bind-2');
  });

  it('yo‘q bo‘lsa undefined (talab qilinmaydi)', () => {
    const n = normalizeCheckoutCallback({ orderId: 'A1' });
    expect(n.operationType).toBeUndefined();
    expect(n.rrn).toBeUndefined();
    expect(n.bindingId).toBeUndefined();
  });

  it('hech bir maydon xom payloaddan (`raw`) tashlab yuborilmaydi — noma‘lum/kelajakdagi maydonlar ham', () => {
    const raw = {
      orderId: 'A1',
      totallyUnknownFutureField: { nested: [1, 2, 3] },
      anotherOne: 42,
    };
    const n = normalizeCheckoutCallback(raw);
    expect(n.raw).toEqual(raw);
  });
});

describe('pickDebugHeaders — faqat kichik xavfsiz allowlist, imzo/authorization/cookie hech qachon', () => {
  it('allowlist’dagi sarlavhalarni oladi', () => {
    const picked = pickDebugHeaders({
      'content-type': 'application/json',
      'user-agent': 'UzumBot/1.0',
      'x-request-id': 'req-1',
      'x-forwarded-for': '1.2.3.4',
      'x-real-ip': '1.2.3.4',
    });
    expect(picked).toEqual({
      'content-type': 'application/json',
      'user-agent': 'UzumBot/1.0',
      'x-request-id': 'req-1',
      'x-forwarded-for': '1.2.3.4',
      'x-real-ip': '1.2.3.4',
    });
  });

  it('authorization/cookie hech qachon qaytarilmaydi, ular allowlist’da bo‘lmasa ham', () => {
    const picked = pickDebugHeaders({
      authorization: 'Bearer secret',
      cookie: 'session=secret',
      'content-type': 'application/json',
    });
    expect(picked).toEqual({ 'content-type': 'application/json' });
  });

  it('qo‘shimcha istisno ro‘yxati (imzo sarlavhasi) ham chetlab o‘tiladi', () => {
    const picked = pickDebugHeaders(
      { 'x-signature': 'abc123', 'content-type': 'application/json' },
      ['x-signature'],
    );
    expect(picked).toEqual({ 'content-type': 'application/json' });
  });

  it('array qiymatli sarlavha bo‘lsa birinchisini oladi', () => {
    const picked = pickDebugHeaders({ 'x-request-id': ['a', 'b'] });
    expect(picked['x-request-id']).toBe('a');
  });

  it('mavjud bo‘lmagan/bo‘sh sarlavhalar chiqarilmaydi', () => {
    const picked = pickDebugHeaders({ 'x-request-id': '' });
    expect(picked).toEqual({});
  });
});

describe('stableStringify — deterministik (kalitlar tartiblangan)', () => {
  it('kalit tartibidan qat‘i nazar bir xil natija', () => {
    expect(stableStringify({ b: 1, a: 2 })).toBe(
      stableStringify({ a: 2, b: 1 }),
    );
    expect(stableStringify({ a: 2, b: 1 })).toBe('{"a":2,"b":1}');
  });
  it('undefined qiymatli kalitlar chiqarib tashlanadi', () => {
    expect(stableStringify({ a: 1, b: undefined })).toBe('{"a":1}');
  });
});
