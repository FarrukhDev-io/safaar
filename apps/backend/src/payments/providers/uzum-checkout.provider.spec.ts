import { hmacSha256 } from '../../auth/security';
import {
  UZUM_CHECKOUT_ERROR,
  UzumCheckoutError,
  UzumCheckoutProvider,
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
