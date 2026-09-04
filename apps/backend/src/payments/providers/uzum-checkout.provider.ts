import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { hmacSha256, timingSafeEqualString } from '../../auth/security';

/**
 * Uzum **Checkout** provayderi (Merchant API'dan MUTLAQO ALOHIDA).
 *
 * Merchant flow (`/check /create /confirm /reverse /status`, `UzumProvider`,
 * `UzumWebhookController`) bu yerga umuman aloqador emas va o'zgartirilmaydi.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * MUHIM CHEKLOV — RASMIY SPEC OLINMAGAN
 * ─────────────────────────────────────────────────────────────────────────────
 * `developer.uzumbank.uz/en/checkout/` — client-side (JS) render qiluvchi
 * portal; OpenAPI sxemasi runtime'da yuklanadi va oddiy HTTP fetch bilan
 * olib bo'lmadi. Shu sabab Uzum Checkout'ning quyidagilari BIZDA TASDIQLANGAN
 * HOLDA YO'Q:
 *   - `/payment/register` so'rov/javob maydonlari va auth sxemasi;
 *   - callback payload maydonlari, `operationState` qiymatlari, imzo algoritmi;
 *   - `/payment/getOrderStatus`, `/payment/getOperationState`, `/acquiring/refund`.
 *
 * Shuning uchun:
 *   - callback imzo tekshiruvi **fail-closed** — sxema aniq sozlanmaguncha
 *     HAR QANDAY callback rad etiladi (`verifyCallback` throw qiladi);
 *   - `operationState` -> internal state mapping'i BO'SH (`STATE_MAP`) —
 *     spec kelmaguncha hech bir callback to'lovni PAID qilmaydi;
 *   - chiquvchi metodlar (`register` / `getOrderStatus` / `getOperationState`
 *     / `refund`) **fail-closed** — konfiguratsiya bo'lmasa `NOT_CONFIGURED`,
 *     konfiguratsiya bo'lsa ham rasmiy wire-format tasdiqlanmagani uchun
 *     `SPEC_REQUIRED` throw qiladi (TAXMINIY so'rov YUBORILMAYDI).
 *
 * Barcha sirlar faqat env orqali (`UZUM_CHECKOUT_*`). Kodga hardcode YO'Q,
 * logga chiqarilmaydi.
 */

export const UZUM_CHECKOUT_ERROR = {
  /** Callback imzo sxemasi sozlanmagan (default) — fail-closed. */
  VERIFICATION_NOT_CONFIGURED: 'verification_not_configured',
  SIGNATURE_MISSING: 'signature_missing',
  SIGNATURE_INVALID: 'signature_invalid',
  MALFORMED_BODY: 'malformed_body',
  /** Chiquvchi (register/status/refund) — env sozlanmagan. */
  NOT_CONFIGURED: 'not_configured',
  /**
   * Env sozlangan, LEKIN rasmiy Uzum Checkout wire-format (endpoint yo'li,
   * auth sarlavhasi, so'rov/javob maydonlari) tasdiqlanmagan — taxminiy
   * so'rov yubormaymiz. Rasmiy spec kelgach shu guard olib tashlanadi.
   */
  SPEC_REQUIRED: 'spec_required',
  REGISTER_FAILED: 'register_failed',
  STATUS_FAILED: 'status_failed',
  REFUND_FAILED: 'refund_failed',
} as const;

export type UzumCheckoutErrorCode =
  (typeof UZUM_CHECKOUT_ERROR)[keyof typeof UZUM_CHECKOUT_ERROR];

export class UzumCheckoutError extends Error {
  constructor(
    public readonly code: UzumCheckoutErrorCode,
    message?: string,
  ) {
    super(message ?? `UZUM_CHECKOUT_${code}`);
    this.name = 'UzumCheckoutError';
  }
}

/**
 * SAFAAR ichki, normallashtirilgan callback shakli.
 * `state` — BIZNING ichki enum'imiz, Uzum'ning xom `operationState` qiymati
 * EMAS (uni bilmaymiz). Xom -> ichki mapping `STATE_MAP`da (hozircha bo'sh).
 */
export interface NormalizedCheckoutCallback {
  /** Uzum tomonidagi to'lov/operatsiya identifikatori. */
  orderId: string;
  /** Bizning `bookings.booking_number`. */
  orderNumber: string;
  /** Bizning `payments.id` (register paytida yuborilgan). */
  merchantOperationId: string;
  /** SAFAAR domen valyutasidagi summa (so'm, Decimal(18,2)). */
  amountSom: number;
  /** ISO valyuta kodi, katta harf. */
  currency: string;
  /** ICHKI normallashtirilgan holat (Uzum'ning xom holati emas). */
  state: 'PAID' | 'FAILED' | 'PENDING' | 'UNKNOWN';
  /** Auditga saqlanadigan xom payload. */
  raw: Record<string, unknown>;
}

/**
 * Uzum'ning HAQIQIY `operationState` qiymatlari MA'LUM EMAS — shu sabab bo'sh.
 * Rasmiy spec kelganda shu yerga (masalan) yoziladi:
 *   `{ COMPLETED: 'PAID', SUCCESS: 'PAID', DECLINED: 'FAILED', ... }`
 * Toki bo'sh ekan — har qanday callback `UNKNOWN` bo'ladi va PAID qilinmaydi.
 */
export const STATE_MAP: Readonly<
  Record<string, NormalizedCheckoutCallback['state']>
> = Object.freeze({});

/**
 * SAFAAR -> Uzum `/payment/register` uchun kirish (BIZNING domen maydonlarimiz).
 * Bu maydonlar SAFAAR tomonida — ular "taxmin" emas. Uzum tomondagi aniq
 * maydon nomlariga bog'lash `register()` ichida, rasmiy spec kelgach.
 */
export interface RegisterCheckoutInput {
  /** `bookings.id` — korrelyatsiya/return URL uchun. */
  bookingId: string;
  /** `bookings.booking_number` -> Uzum `orderNumber`. */
  orderNumber: string;
  /** `payments.id` -> Uzum `merchantOperationId`. */
  merchantOperationId: string;
  /** SAFAAR domen summasi (so'm, Decimal(18,2)). Uzum birligi spec'da. */
  amountSom: number;
  /** ISO valyuta kodi (`UZS`). */
  currency: string;
  /** To'lov muvaffaqiyatli tugagach foydalanuvchi qaytadigan URL. */
  successUrl: string;
  /** To'lov bekor/muvaffaqiyatsiz bo'lsa qaytadigan URL. */
  failureUrl: string;
}

export interface RegisterCheckoutResult {
  /** Uzum qaytargan buyurtma identifikatori -> `payments.provider_reference`. */
  orderId: string;
  /** Foydalanuvchi yo'naltiriladigan Uzum Checkout to'lov sahifasi URL'i. */
  paymentUrl: string;
  /** Xom javob (audit uchun). */
  raw: Record<string, unknown>;
}

export interface CheckoutOrderStatus {
  orderId: string;
  /** Uzum qaytargan xom holat qiymati (spec'siz — faqat log/audit uchun). */
  rawStatus: string;
  /** `STATE_MAP` orqali normallashtirilgan holat (spec yo'q -> `UNKNOWN`). */
  state: NormalizedCheckoutCallback['state'];
  amountSom: number | null;
  raw: Record<string, unknown>;
}

export interface RefundCheckoutInput {
  /** Uzum `orderId` (`payments.provider_reference`). */
  orderId: string;
  /** Qaytariladigan summa (so'm). To'liq refund uchun payment summasi. */
  amountSom: number;
  /** SAFAAR ichki refund sababi (audit uchun; secret emas). */
  reason?: string;
}

export interface RefundCheckoutResult {
  orderId: string;
  refundId: string | null;
  rawStatus: string;
  raw: Record<string, unknown>;
}

function str(value: unknown): string {
  return value === undefined || value === null ? '' : String(value).trim();
}

/**
 * Xom Uzum Checkout callback -> `NormalizedCheckoutCallback`.
 *
 * MUHIM: maydon nomlari faqat KENG TARQALGAN variantlar bo'yicha "best-effort"
 * o'qiladi — bu Uzum production kontrakti EMAS. Rasmiy spec kelganda aniq
 * nomlarga qattiq bog'lanadi. Hech qanday undocumented maydon (partnerId,
 * settlementAccount, ...) o'qilmaydi/talab qilinmaydi.
 */
export function normalizeCheckoutCallback(
  raw: Record<string, unknown>,
): NormalizedCheckoutCallback {
  const amountRaw =
    raw.amount ??
    raw.total ??
    raw.sum ??
    raw.paymentAmount ??
    raw.payment_amount;
  // TODO(uzum-checkout-spec): summa birligini (so'm vs tiyin) tasdiqlash.
  // Agar Uzum tiyin yuborsa — bu yerda `/100` qilinadi.
  const amountSom =
    amountRaw === undefined || amountRaw === null ? NaN : Number(amountRaw);

  const rawState = str(
    raw.operationState ?? raw.operation_state ?? raw.state ?? raw.status,
  ).toUpperCase();

  return {
    orderId: str(
      raw.orderId ?? raw.order_id ?? raw.paymentId ?? raw.payment_id,
    ),
    orderNumber: str(
      raw.orderNumber ??
        raw.order_number ??
        raw.merchantOrderId ??
        raw.merchant_order_id,
    ),
    merchantOperationId: str(
      raw.merchantOperationId ??
        raw.merchant_operation_id ??
        raw.operationId ??
        raw.operation_id,
    ),
    amountSom,
    currency: str(raw.currency ?? 'UZS').toUpperCase() || 'UZS',
    state: STATE_MAP[rawState] ?? 'UNKNOWN',
    raw,
  };
}

type HeaderMap = Record<string, string | string[] | undefined>;

@Injectable()
export class UzumCheckoutProvider {
  private readonly baseUrl?: string;
  private readonly merchantId?: string;
  private readonly terminalId?: string;
  private readonly apiKey?: string;
  private readonly callbackSignKey?: string;
  private readonly signatureHeader: string;
  /** 'none' (default, fail-closed) | 'hmac-sha256' (joy-egallovchi sxema). */
  private readonly signatureScheme: string;

  constructor(config: ConfigService) {
    const baseUrl = (
      config.get<string>('UZUM_CHECKOUT_BASE_URL') || ''
    ).replace(/\/$/, '');
    this.baseUrl = baseUrl || undefined;
    this.merchantId =
      config.get<string>('UZUM_CHECKOUT_MERCHANT_ID') || undefined;
    this.terminalId =
      config.get<string>('UZUM_CHECKOUT_TERMINAL_ID') || undefined;
    this.apiKey = config.get<string>('UZUM_CHECKOUT_API_KEY') || undefined;
    this.callbackSignKey =
      config.get<string>('UZUM_CHECKOUT_CALLBACK_SIGN_KEY') || undefined;
    this.signatureHeader = (
      config.get<string>('UZUM_CHECKOUT_SIGNATURE_HEADER') || 'x-signature'
    )
      .trim()
      .toLowerCase();
    this.signatureScheme = (
      config.get<string>('UZUM_CHECKOUT_SIGNATURE_SCHEME') || 'none'
    )
      .trim()
      .toLowerCase();
  }

  /** `payment/register` (chiquvchi) uchun konfiguratsiya to'liqmi. */
  isConfigured(): boolean {
    return Boolean(this.baseUrl && this.merchantId && this.apiKey);
  }

  /** Callback imzo tekshiruvi ishga tushirilishi mumkinmi. */
  isCallbackVerificationConfigured(): boolean {
    return Boolean(this.callbackSignKey) && this.signatureScheme !== 'none';
  }

  /**
   * Imzo uchun kanonik matn. JOY-EGALLOVCHI: Uzum'ning haqiqiy kanonizatsiyasi
   * (xom baytlar, maydon konkatenatsiyasi, ...) MA'LUM EMAS. Spec kelganda
   * FAQAT shu metod + header nomi + sxema o'zgaradi.
   */
  canonicalPayload(body: Record<string, unknown>): string {
    return stableStringify(body);
  }

  /**
   * Callback imzosini FAIL-CLOSED tekshiradi.
   *  - sxema sozlanmagan (default) => throw (endpoint xavfsiz "deny-all").
   *  - imzo yo'q / noto'g'ri => throw.
   *  - hech qachon "o'tdi" deb qaytmaydi, imzo mos kelmasa.
   * Secret / imzo / Authorization LOG QILINMAYDI.
   */
  verifyCallback(body: Record<string, unknown>, headers: HeaderMap): void {
    if (!this.isCallbackVerificationConfigured()) {
      throw new UzumCheckoutError(
        UZUM_CHECKOUT_ERROR.VERIFICATION_NOT_CONFIGURED,
        'Uzum Checkout callback imzo sxemasi sozlanmagan — rasmiy spec ' +
          'kelmaguncha callback fail-closed rad etiladi',
      );
    }
    const provided = firstHeader(headers[this.signatureHeader]);
    if (!provided) {
      throw new UzumCheckoutError(UZUM_CHECKOUT_ERROR.SIGNATURE_MISSING);
    }

    if (this.signatureScheme === 'hmac-sha256') {
      // JOY-EGALLOVCHI sxema — Uzum'ning haqiqiy algoritmi tasdiqlanmagan.
      const expected = hmacSha256(
        this.canonicalPayload(body),
        this.callbackSignKey as string,
      );
      if (!timingSafeEqualString(provided, expected)) {
        throw new UzumCheckoutError(UZUM_CHECKOUT_ERROR.SIGNATURE_INVALID);
      }
      return;
    }

    // Noma'lum sxema nomi — fail-closed.
    throw new UzumCheckoutError(
      UZUM_CHECKOUT_ERROR.VERIFICATION_NOT_CONFIGURED,
      `noma'lum imzo sxemasi: ${this.signatureScheme}`,
    );
  }

  // ==========================================================================
  //  CHIQUVCHI (outbound) — FAIL-CLOSED, rasmiy wire-format kutilmoqda.
  // ==========================================================================

  /**
   * Chiquvchi metod nima uchun bloklanganini bildiruvchi xato.
   *
   *  - env sozlanmagan  -> `NOT_CONFIGURED`
   *  - env sozlangan     -> `SPEC_REQUIRED` (taxminiy so'rov YUBORILMAYDI —
   *    rasmiy Uzum Checkout wire-format tasdiqlangach shu guard olib
   *    tashlanadi va metodlar `fetch` bilan ishlaydi).
   */
  private outboundBlocker(): UzumCheckoutError {
    if (!this.isConfigured()) {
      return new UzumCheckoutError(
        UZUM_CHECKOUT_ERROR.NOT_CONFIGURED,
        'Uzum Checkout chiquvchi integratsiyasi sozlanmagan ' +
          '(UZUM_CHECKOUT_BASE_URL / UZUM_CHECKOUT_MERCHANT_ID / UZUM_CHECKOUT_API_KEY)',
      );
    }
    return new UzumCheckoutError(
      UZUM_CHECKOUT_ERROR.SPEC_REQUIRED,
      "Uzum Checkout rasmiy wire-format tasdiqlanmagan — taxminiy so'rov " +
        'yuborilmaydi. developer.uzumbank.uz/en/checkout/ spec olgach ' +
        'outboundBlocker() guard olib tashlanadi.',
    );
  }

  /**
   * `POST {baseUrl}/payment/register` — SAFAAR to'lovini Uzum Checkout'da
   * ro'yxatga oladi, `orderId` + to'lov sahifasi URL'ini qaytaradi.
   *
   * MAPPING (rasmiy spec kelgach tasdiqlanadi):
   *   input.orderNumber          -> Uzum `orderNumber`
   *   input.merchantOperationId  -> Uzum `merchantOperationId`
   *   input.amountSom            -> Uzum `amount`  (birlik: so'm/tiyin — SPEC)
   *   input.currency             -> Uzum `currency`
   *   input.successUrl           -> Uzum `successUrl`
   *   input.failureUrl           -> Uzum `failureUrl`
   *   (this.merchantId/terminalId + this.apiKey -> auth — SPEC)
   *   Uzum javob `orderId`       -> result.orderId (-> payments.provider_reference)
   *   Uzum javob `paymentUrl`/`checkoutUrl` -> result.paymentUrl
   *
   * @example  // TODO(uzum-checkout-spec): rasmiy hujjat bilan tasdiqlang
   *   const res = await fetch(`${this.baseUrl}/payment/register`, {
   *     method: 'POST',
   *     signal: AbortSignal.timeout(15_000),
   *     headers: {
   *       'Content-Type': 'application/json',
   *       // auth sarlavhasi nomi/sxemasi — SPEC (masalan 'Authorization: Bearer'
   *       // yoki 'X-Api-Key' + 'X-Terminal-Id')
   *     },
   *     body: JSON.stringify({
   *       orderNumber: input.orderNumber,
   *       merchantOperationId: input.merchantOperationId,
   *       amount: input.amountSom,        // birlik — SPEC
   *       currency: input.currency,
   *       successUrl: input.successUrl,
   *       failureUrl: input.failureUrl,
   *       // viewType / sessionTimeoutSecs / clientId / paymentParams —
   *       // ixtiyoriy, faqat SPEC tasdiqlasa
   *     }),
   *   });
   *   if (!res.ok) throw new UzumCheckoutError(REGISTER_FAILED, `HTTP ${res.status}`);
   *   const body = await res.json();
   *   return { orderId: String(body.orderId), paymentUrl: String(body.paymentUrl), raw: body };
   */
  register(input: RegisterCheckoutInput): Promise<RegisterCheckoutResult> {
    void input;
    return Promise.reject(this.outboundBlocker());
  }

  /**
   * `POST {baseUrl}/payment/getOrderStatus` — buyurtma holatini so'raydi
   * (rekonsiliatsiya uchun). Xom holat `STATE_MAP` orqali normallashtiriladi;
   * spec yo'q ekan — `state = 'UNKNOWN'`, ya'ni rekonsiliatsiya hech narsani
   * PAID qilmaydi.
   */
  getOrderStatus(orderId: string): Promise<CheckoutOrderStatus> {
    void orderId;
    return Promise.reject(this.outboundBlocker());
  }

  /**
   * `POST {baseUrl}/payment/getOperationState` — alohida operatsiya holati.
   */
  getOperationState(
    orderId: string,
    operationId?: string,
  ): Promise<CheckoutOrderStatus> {
    void orderId;
    void operationId;
    return Promise.reject(this.outboundBlocker());
  }

  /**
   * `POST {baseUrl}/acquiring/refund` — to'lovni (qisman/to'liq) qaytarish.
   * SAFAAR refund modulidan (admin tasdig'idan keyin) chaqirilishi kerak —
   * bu metodning o'zi hech qachon avtomatik refund yubormaydi.
   */
  refund(input: RefundCheckoutInput): Promise<RefundCheckoutResult> {
    void input;
    return Promise.reject(this.outboundBlocker());
  }
}

function firstHeader(value: string | string[] | undefined): string | undefined {
  const v = Array.isArray(value) ? value[0] : value;
  return v && v.trim() ? v.trim() : undefined;
}

/** Kalitlar bo'yicha tartiblangan, deterministik JSON (imzo kanonizatsiyasi uchun). */
export function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(',')}]`;
  }
  if (value && typeof value === 'object') {
    return `{${Object.entries(value as Record<string, unknown>)
      .filter(([, entry]) => entry !== undefined)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, entry]) => `${JSON.stringify(k)}:${stableStringify(entry)}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
}
