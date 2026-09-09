/**
 * Uzum Checkout REAL callback fixture'lari.
 *
 * MUHIM — MANBA VA ISHONCH DARAJASI:
 * Bu shakl Uzum'ning o'z portalidan (`developer.uzumbank.uz/en/checkout/`)
 * TO'G'RIDAN-TO'G'RI olinmagan — portal client-side JS render qiladi va
 * oddiy HTTP fetch bilan spec matnini olib bo'lmaydi (buni Merchant sahifasi
 * bilan ham qayta tekshirdik — xuddi shu cheklov, faqat Checkout'ga xos
 * emas).
 *
 * Bu yerdagi maydonlar UCHINCHI TOMON ombori orqali topildi:
 *   https://github.com/vsevalid/uzum-payments/blob/main/checkout_openapi.yaml
 *   (OpenAPI 3.0.2, `info.title: "Uzum Checkout"`, `info.version: 1.10.3`)
 *
 * Bu RASMIY Uzum tomonidan tasdiqlanmagan, lekin quyidagi sabablarga ko'ra
 * KUCHLI DALIL deb baholanadi:
 *   - repo'dagi PyPI paket tavsifi ham xuddi shu nom+versiyani ("Uzum
 *     Checkout API v1.10.1") mustaqil eslaydi;
 *   - spec matni (bir/ikki bosqichli to'lov, hold/complete/reverse/refund,
 *     3ds, avtofiskalizatsiya, karta bog'lash) SAFAAR'ning ILGARI (bu
 *     fayldan mustaqil) yozilgan `docs/payments-uzum-checkout.md`
 *     hujjatidagi terminologiya bilan to'liq mos keladi;
 *   - spec ichki izchil (masalan `MerchantPaymentStatus` — order darajasi —
 *     va `CallbackOperationState` — operatsiya darajasi — bir-biriga
 *     ziddiyatsiz mos keladi).
 *
 * Shunga qaramay: Uzum'ning O'ZIDAN yozma tasdiq YO'Q. Production'da
 * signature tekshiruvi shu sababdan ham FAIL-CLOSED qoladi (bu fayl faqat
 * PARSER/QA-mode uchun, autentifikatsiya sxemasi uchun EMAS — spec'da
 * callback yo'nalishi uchun hujjatlashtirilgan header/imzo TOPILMADI).
 *
 * Schema (`AcquiringCallbackData`, majburiy: orderId, operationState,
 * operationType, orderNumber):
 *   orderId              string  — Uzum tomonidagi buyurtma identifikatori
 *   operationState        enum   — FAQAT "SUCCESS" | "FAIL"
 *   operationType          enum   — "AUTHORIZE" | "COMPLETE" | "REFUND" |
 *                                   "REVERSE" | "TOP_UP_COMPLETED"
 *   orderNumber           string  — merchant tomonidagi buyurtma identifikatori
 *   merchantOperationId?  string  — merchant tomonidagi operatsiya ID (ixtiyoriy)
 *   rrn?                  string  — bank operatsiyasining noyob identifikatori
 *   bindingId?             string  — saqlangan karta bog'lanishi identifikatori
 * AMOUNT/CURRENCY YO'Q — bu spec bo'yicha callback'ning o'zida yo'q, faqat
 * `/payment/getOrderStatus` javobida bor (va u yerda "minimal birlikda",
 * ya'ni tiyin).
 */

/** Bir bosqichli (one-step) to'lov muvaffaqiyatli o'tdi — real shakl bo'yicha. */
export const REAL_UZUM_CHECKOUT_SUCCESS_FIXTURE: Record<string, unknown> = {
  orderId: 'b6f1c2a4-3e1a-4c2b-9f0d-7a2e5c9d1234',
  operationState: 'SUCCESS',
  operationType: 'AUTHORIZE',
  orderNumber: 'UZB-QAFIXTURE01',
  merchantOperationId: 'payment-qa-fixture-01',
  rrn: '123456789012',
};

/** Bir bosqichli to'lov muvaffaqiyatsiz (declined) — real shakl bo'yicha. */
export const REAL_UZUM_CHECKOUT_FAIL_FIXTURE: Record<string, unknown> = {
  orderId: 'c7a2d3b5-4f2b-5d3c-a01e-8b3f6d0e2345',
  operationState: 'FAIL',
  operationType: 'AUTHORIZE',
  orderNumber: 'UZB-QAFIXTURE02',
  merchantOperationId: 'payment-qa-fixture-02',
};

/**
 * Muvaffaqiyatli REFUND — ATAYLAB "PAID" bilan aralashtirilmaydi (pul
 * CHIQISHI). `STATE_MAP`da yo'q, shuning uchun `state` doim `UNKNOWN` bo'lib
 * qoladi va hech qanday payment/booking holati o'zgarmaydi.
 */
export const REAL_UZUM_CHECKOUT_REFUND_FIXTURE: Record<string, unknown> = {
  orderId: 'd8b3e4c6-5a3c-6e4d-b12f-9c4a7e1f3456',
  operationState: 'SUCCESS',
  operationType: 'REFUND',
  orderNumber: 'UZB-QAFIXTURE03',
  merchantOperationId: 'payment-qa-fixture-03',
};

/** Ikki bosqichli to'lovning tasdiqlash (COMPLETE) bosqichi muvaffaqiyatli. */
export const REAL_UZUM_CHECKOUT_COMPLETE_SUCCESS_FIXTURE: Record<
  string,
  unknown
> = {
  orderId: 'e9c4f5d7-6b4d-7f5e-c23a-0d5b8f2a4567',
  operationState: 'SUCCESS',
  operationType: 'COMPLETE',
  orderNumber: 'UZB-QAFIXTURE04',
  merchantOperationId: 'payment-qa-fixture-04',
  bindingId: 'binding-qa-fixture-04',
};
