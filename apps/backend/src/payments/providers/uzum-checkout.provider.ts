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
 * SPEC HOLATI — UZUM'NING O'Z PORTALIDAN TO'G'RIDAN-TO'G'RI OLINMAGAN
 * ─────────────────────────────────────────────────────────────────────────────
 * `developer.uzumbank.uz/en/checkout/` — client-side (JS) render qiluvchi
 * portal; OpenAPI sxemasi runtime'da yuklanadi va oddiy HTTP fetch bilan
 * olib bo'lmaydi (Merchant sahifasi ham xuddi shunday — bu portal darajasidagi
 * cheklov, faqat Checkout'ga xos emas).
 *
 * `AcquiringCallbackData`/`CallbackOperationState` pastdagi mapping —
 * `github.com/vsevalid/uzum-payments` (`checkout_openapi.yaml`, "Uzum
 * Checkout" v1.10.3) UCHINCHI TOMON ombori orqali topilgan. Bu Uzum'ning
 * o'zidan TO'G'RIDAN-TO'G'RI olinmagan — shuning uchun KUCHLI DALIL, lekin
 * RASMIY TASDIQLANGAN EMAS deb belgilanadi. Ichki izchillik yuqori (bizning
 * repo'dagi mustaqil o'rganilgan bir/ikki bosqichli to'lov terminologiyasi —
 * hold/complete/reverse/refund/3ds/autofiskalizatsiya — bilan to'liq mos
 * keladi), lekin Uzum'dan rasmiy tasdiq (yoki hujjatning o'zi) ALINMAGUNCHA
 * production'da signature tekshiruvi hali ham FAIL-CLOSED qoladi.
 *
 * Shu manbadan TOPILGAN narsalar (callback yo'nalishi uchun):
 *   - `AcquiringCallbackData`: {orderId, operationState, operationType,
 *     orderNumber, merchantOperationId?, rrn?, bindingId?} — AMOUNT/CURRENCY
 *     YO'Q (buyurtma summasi faqat register/getOrderStatus orqali ma'lum).
 *   - `CallbackOperationState` enum: FAQAT `SUCCESS` | `FAIL`.
 *   - `operationType` enum: `AUTHORIZE | COMPLETE | REFUND | REVERSE | TOP_UP_COMPLETED`.
 *   - Callback POST operatsiyasining o'zida (OpenAPI `callbacks:` bloki)
 *     HECH QANDAY sarlavha/imzo talabi HUJJATLASHTIRILMAGAN — topilgan
 *     yagona imzo eslatmasi (`X-Signature`, xato 1000) umumiy xato jadvalida,
 *     merchant->Uzum yo'nalishiga tegishli bo'lishi ehtimoli yuqori, callback
 *     (Uzum->merchant)ga emas. Shuning uchun callback'ning haqiqiy
 *     autentifikatsiya mexanizmi HALI HAM NOMA'LUM — bu QASDDAN
 *     production'da fail-closed qolishning asosiy sababi.
 *   - Sandbox/test muhiti (alohida base URL, IP diapazoni, retry siyosati)
 *     HAQIDA HECH NARSA topilmadi — bu spec'da `servers:` bo'limi umuman yo'q.
 *
 * Shuning uchun:
 *   - callback imzo tekshiruvi **fail-closed** — sxema aniq sozlanmaguncha
 *     HAR QANDAY callback rad etiladi (`verifyCallback` throw qiladi);
 *   - `UZUM_CHECKOUT_TEST_MODE=true` — FAQAT production BO'LMAGANDA — imzo
 *     sozlanmagan holatda callback'ni QA/test uchun o'tkazishga ruxsat beradi
 *     (order lookup/amount/currency/idempotency/terminal-holat HAMMASI
 *     ishlayveradi — faqat imzo tekshiruvi o'tkazib yuboriladi);
 *   - `operationType:operationState` -> internal state mapping'i (`STATE_MAP`)
 *     yuqoridagi uchinchi-tomon manbadan, lekin FAQAT AUTHORIZE/COMPLETE
 *     SUCCESS/FAIL uchun to'ldirilgan — REFUND/REVERSE/TOP_UP_COMPLETED
 *     ATAYLAB xaritalanmagan (pul CHIQISHI/PAID EMAS bilan aralashtirmaslik
 *     uchun), shuning uchun ular hamon `UNKNOWN` bo'lib qoladi;
 *   - chiquvchi metodlar (`register` / `getOrderStatus` / `getOperationState`
 *     / `refund`) **fail-closed** — konfiguratsiya bo'lmasa `NOT_CONFIGURED`,
 *     konfiguratsiya bo'lsa ham rasmiy wire-format tasdiqlanmagani uchun
 *     `SPEC_REQUIRED` throw qiladi (TAXMINIY so'rov YUBORILMAYDI) — bu
 *     o'zgarmadi, chunki uchinchi-tomon spec'da ularning request/response
 *     shakli ham bor, lekin BIZ hali TASDIQLAMAGANMIZ va real pul harakati
 *     bilan bog'liq (register/refund) — bu yerda xato narxi yuqori.
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
 * EMAS. Xom -> ichki mapping `STATE_MAP`da (`operationType:operationState`
 * kaliti bilan — pastdagi izohga qarang; manba UCHINCHI TOMON, rasmiy
 * tasdiqlanmagan).
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
  /**
   * `rrn`/`bindingId` FAQAT audit/debug uchun best-effort o'qiladi — hech
   * biri talab qilinmaydi. `operationType` esa `state`ni HISOBLASH uchun
   * ISHLATILADI (`STATE_MAP` orqali, `operationState` bilan birga) — lekin
   * bu maydonning o'zi hech qachon to'g'ridan-to'g'ri talab qilinmaydi;
   * yo'q bo'lsa xaritalash shunchaki `UNKNOWN`ga tushadi (xavfsiz default).
   */
  /**
   * Xom operatsiya turi. Uchinchi-tomon manba (yuqoridagi fayl izohi)
   * bo'yicha mumkin bo'lgan qiymatlar: `AUTHORIZE | COMPLETE | REFUND |
   * REVERSE | TOP_UP_COMPLETED` — lekin bu ro'yxat RASMIY TASDIQLANMAGAN,
   * shuning uchun bu yerda `string` (qattiq enum emas).
   */
  operationType?: string;
  /** Karta operatsiyasi retrieval reference number — faqat audit. */
  rrn?: string;
  /** Saqlangan karta/tokenizatsiya identifikatori — faqat audit. */
  bindingId?: string;
  /** Auditga saqlanadigan TO'LIQ xom payload — hech bir maydon tashlab yuborilmaydi. */
  raw: Record<string, unknown>;
}

/**
 * `operationType:operationState` (KATTA harf, ikkalasi ham) -> ICHKI holat.
 *
 * NEGA ikkita maydon birga (faqat `operationState` emas): `operationState`
 * yolg'iz o'zi ikkiyuzlamachi — `SUCCESS` bir xilda muvaffaqiyatli TO'LOV
 * (AUTHORIZE/COMPLETE) yoki muvaffaqiyatli QAYTARISH (REFUND/REVERSE)ni ham
 * anglatishi mumkin. Faqat `operationState`ga qarab xaritalasak, muvaffaqiyatli
 * REFUND callback'i xatolik bilan booking'ni "to'landi" deb belgilab qo'yishi
 * mumkin edi — bu jiddiy xato bo'lardi.
 *
 * Manba: `github.com/vsevalid/uzum-payments` (`checkout_openapi.yaml`,
 * "Uzum Checkout" v1.10.3) — UCHINCHI TOMON, Uzum'dan to'g'ridan-to'g'ri
 * olinmagan (yuqoridagi fayl izohiga qarang). Shu sabab bu yerda FAQAT eng
 * ishonchli, bir ma'noli holatlar xaritalangan:
 *   - AUTHORIZE:SUCCESS / COMPLETE:SUCCESS -> PAID (bir bosqichli to'lovda
 *     AUTHORIZE = pul yechish bilan bir vaqtda sodir bo'ladi, spec matniga
 *     ko'ra)
 *   - AUTHORIZE:FAIL / COMPLETE:FAIL -> FAILED
 * REFUND/REVERSE/TOP_UP_COMPLETED ATAYLAB YO'Q — pul CHIQISHI yoki mutlaqo
 * boshqa mahsulot (mobil balans to'ldirish) hodisalarini hech qachon PAID
 * bilan aralashtirmaslik uchun; ular `UNKNOWN` bo'lib qoladi (audit-only,
 * hech qanday holat o'zgarmaydi).
 */
export const STATE_MAP: Readonly<
  Record<string, NormalizedCheckoutCallback['state']>
> = Object.freeze({
  'AUTHORIZE:SUCCESS': 'PAID',
  'COMPLETE:SUCCESS': 'PAID',
  'AUTHORIZE:FAIL': 'FAILED',
  'COMPLETE:FAIL': 'FAILED',
});

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

  // Uzum'ning haqiqiy (uchinchi-tomon manba orqali topilgan) callback
  // maydoni — `operationState`. Eski keng-tarqalgan aliaslar (`state`/
  // `status`) orqaga moslik uchun hamon o'qiladi (agar Uzum kelajakda
  // boshqacha nomlasa yoki boshqa test payload kelsa).
  const rawOperationState = str(
    raw.operationState ?? raw.operation_state ?? raw.state ?? raw.status,
  ).toUpperCase();
  const rawOperationType = str(
    raw.operationType ?? raw.operation_type,
  ).toUpperCase();
  // `operationType` yo'q bo'lsa kalit hech qachon STATE_MAP'ga mos
  // kelmaydi (masalan `":SUCCESS"`) -> xavfsiz `UNKNOWN` default.
  const stateKey = `${rawOperationType}:${rawOperationState}`;

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
    state: STATE_MAP[stateKey] ?? 'UNKNOWN',
    operationType: optionalStr(raw.operationType ?? raw.operation_type),
    rrn: optionalStr(raw.rrn ?? raw.RRN),
    bindingId: optionalStr(raw.bindingId ?? raw.binding_id),
    raw,
  };
}

function optionalStr(value: unknown): string | undefined {
  const s = str(value);
  return s === '' ? undefined : s;
}

/**
 * Callback so'rov sarlavhalaridan FAQAT debug/audit uchun xavfsiz bo'lgan
 * kichik ro'yxatni ajratib oladi. Imzo sarlavhasi (`excludeHeaderNames`
 * orqali beriladi) va `authorization`/`cookie` HECH QACHON qaytarilmaydi —
 * bu himoya ikki marta ta'minlangan: (1) allowlist o'zi tor, (2) yana
 * qo'shimcha aniq istisno ro'yxati.
 */
const DEBUG_SAFE_HEADER_NAMES = [
  'content-type',
  'user-agent',
  'x-request-id',
  'x-forwarded-for',
  'x-real-ip',
] as const;
const ALWAYS_EXCLUDED_HEADER_NAMES = ['authorization', 'cookie'];

export function pickDebugHeaders(
  headers: HeaderMap,
  excludeHeaderNames: readonly string[] = [],
): Record<string, string> {
  const excluded = new Set(
    [...ALWAYS_EXCLUDED_HEADER_NAMES, ...excludeHeaderNames].map((n) =>
      n.toLowerCase(),
    ),
  );
  const picked: Record<string, string> = {};
  for (const name of DEBUG_SAFE_HEADER_NAMES) {
    if (excluded.has(name)) continue;
    const value = firstHeader(headers[name]);
    if (value) picked[name] = value;
  }
  return picked;
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
  /**
   * QA/test-only. `isTestModeEnabled()` orqali o'qiladi — u yerda
   * `NODE_ENV==='production'` bo'lsa BU MAYDONDAN QAT'I NAZAR har doim
   * `false` qaytariladi (ikkinchi himoya qatlami; birinchisi —
   * `env.validation.ts`'dagi qattiq throw, production'da ilova umuman
   * ishga tushmaydi).
   */
  private readonly testModeRaw: string;

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
    this.testModeRaw = (
      config.get<string>('UZUM_CHECKOUT_TEST_MODE') || 'false'
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
   * QA/test-only signature-bypass yoqilganmi. `NODE_ENV==='production'`
   * bo'lsa har doim `false` — `UZUM_CHECKOUT_TEST_MODE` qiymatidan qat'i
   * nazar (birinchi himoya qatlami — `env.validation.ts`'dagi qattiq throw
   * — allaqachon buni production'da ilova ishga tushmasligi bilan
   * ta'minlaydi; bu YERDAGI tekshiruv shunga QARAMASDAN mustaqil ikkinchi
   * qatlam).
   */
  isTestModeEnabled(): boolean {
    if (process.env.NODE_ENV === 'production') {
      return false;
    }
    return this.testModeRaw === 'true';
  }

  /**
   * Sozlangan imzo sarlavhasi nomi (masalan `x-signature`). Faqat audit/debug
   * log'lardan uni chetlab o'tish uchun ochilgan — hech qanday sir qaytarmaydi.
   */
  signatureHeaderName(): string {
    return this.signatureHeader;
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
   *  - sxema sozlanmagan (default) => throw (endpoint xavfsiz "deny-all"),
   *    FAQAT `isTestModeEnabled()` bo'lsa BUNDAN MUSTASNO (QA-only, pastga
   *    qarang — production'da bu yo'l HECH QACHON tanlanmaydi).
   *  - imzo yo'q / noto'g'ri => throw (test mode bunga TA'SIR QILMAYDI —
   *    haqiqiy sxema sozlangan bo'lsa u har doim TO'LIQ ishlaydi).
   *  - hech qachon "o'tdi" deb qaytmaydi, imzo mos kelmasa.
   * Secret / imzo / Authorization LOG QILINMAYDI.
   */
  verifyCallback(body: Record<string, unknown>, headers: HeaderMap): void {
    if (!this.isCallbackVerificationConfigured()) {
      if (this.isTestModeEnabled()) {
        // QA-only: haqiqiy Uzum imzo sxemasi hali sozlanmagan (rasmiy spec
        // yo'q), shuning uchun QA integratsion testlarini bloklamaslik
        // uchun signature bosqichi shu yerda o'tkazib yuboriladi. Boshqa
        // HECH QANDAY himoya (order lookup/amount/currency/idempotency/
        // terminal-holat) bilan ALOQASI YO'Q — ular chaqiruvchida
        // (`PaymentsService.uzumCheckoutCallback`) o'zgarishsiz ishlayveradi.
        return;
      }
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
