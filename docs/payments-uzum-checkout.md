# Uzum Checkout — integratsiya (skeleton + seams)

**Merchant API'dan (`/v1/uzum/webhook/*`) MUTLAQO ALOHIDA.** Merchant flow
(`/check /create /confirm /reverse /status`, `UzumProvider`,
`UzumWebhookController`, `payments.service.ts` `uzum*` metodlari) o'zgartirilmadi.

## ⚠️ Rasmiy spec holati

`https://developer.uzumbank.uz/en/checkout/` — client-side (JS) render qiluvchi
portal; OpenAPI sxemasi runtime'da yuklanadi va oddiy HTTP fetch bilan olib
bo'lmaydi (`web.archive.org` ham bu muhitda bloklangan). Shu sabab Uzum
Checkout'ning **`/payment/register` / callback / `getOrderStatus` /
`getOperationState` / `acquiring/refund` wire-format'i BIZDA TASDIQLANMAGAN**.

Natijada butun integratsiya **fail-closed**:

| Qism                                                 | Holati                        | Bloklovchi                              |
| ---------------------------------------------------- | ----------------------------- | --------------------------------------- |
| Callback qabul qilish (`/v1/uzum/checkout/callback`) | skeleton + wired + tested     | payload + imzo algoritmi                |
| `register()` seam (`createUzumCheckoutPayment`)      | wired + tested, 503 qaytaradi | `/payment/register` shakli + credential |
| `getOrderStatus` / `getOperationState`               | typed stub, `SPEC_REQUIRED`   | endpoint shakli + credential            |
| `refund()`                                           | typed stub, `SPEC_REQUIRED`   | `/acquiring/refund` shakli + credential |
| Reconciliation (`reconcileUzumCheckoutPayments`)     | metod tayyor, `@Cron`SIZ      | Uzum status enum                        |
| `PaymentMethod` enum + backend allowlistlar          | ✅ tayyor (migration bilan)   | —                                       |

## Route

```
POST  https://api.safaar.uz/v1/uzum/checkout/callback
Content-Type: application/json
```

`UzumCheckoutController` (`@Controller()` + `@Post('uzum/checkout/callback')`,
global prefiks `v1`). `@Res()` (passthrough EMAS) — global envelope/filter
chetlab o'tiladi, status kodlar Uzum retry mantig'i uchun aniq.

Javob (hozircha; Uzum'ning kutgan aniq shakli MA'LUM EMAS):

| Holat                                | HTTP | Body                                                |
| ------------------------------------ | ---- | --------------------------------------------------- |
| A) valid callback qabul qilindi      | 200  | `{ status: "OK", duplicate: false, applied: true }` |
| B) duplicate callback                | 200  | `{ status: "OK", duplicate: true, applied: false }` |
| C) noma'lum orderId                  | 404  | `{ status: "FAILED", code: "unknown_order" }`       |
| D) amount mismatch                   | 422  | `{ status: "FAILED", code: "amount_mismatch" }`     |
| E) currency mismatch                 | 422  | `{ status: "FAILED", code: "currency_mismatch" }`   |
| F) imzo yaroqsiz / sxema sozlanmagan | 401  | `{ status: "FAILED", code: "<...>" }`               |
| G) noto'g'ri/bo'sh JSON              | 400  | `{ status: "FAILED", code: "malformed_body" }`      |

## ⚠️ BLOKER — Uzum Checkout spec YO'Q

Bizda Uzum Checkout'ning **rasmiy callback payload formati, `operationState`
qiymatlari va imzo (signature) algoritmi YO'Q**. Shu sabab skeleton **fail-closed**:

- **Imzo** (`UzumCheckoutProvider.verifyCallback`) — default holatda
  (`UZUM_CHECKOUT_SIGNATURE_SCHEME` unset / `none`) **har qanday callback rad
  etiladi** (401). Faqat `UZUM_CHECKOUT_SIGNATURE_SCHEME=hmac-sha256` +
  `UZUM_CHECKOUT_CALLBACK_SIGN_KEY` sozlanganda JOY-EGALLOVCHI HMAC-SHA256
  sxema ishlaydi — bu Uzum'ning tasdiqlangan algoritmi EMAS.
- **`operationState` -> ichki holat** mapping'i (`STATE_MAP`) **BO'SH** — spec
  kelmaguncha har qanday callback `state = 'UNKNOWN'` bo'ladi va **hech bir
  callback to'lovni PAID qilmaydi**.
- **Payload maydonlari** — `normalizeCheckoutCallback()` faqat "best-effort"
  (keng tarqalgan nomlar: `orderId`/`order_id`, `orderNumber`/`order_number`,
  `merchantOperationId`, `amount`/`total`, `currency`, `operationState`/`state`).
- **Undocumented maydon YO'Q**: `partnerId`, `settlementAccount`,
  `recipientAccount`, `subMerchantId` — o'qilmaydi, yozilmaydi.
- **Summa birligi** (so'm vs tiyin) tasdiqlanmagan — `normalizeCheckoutCallback`
  da `TODO(uzum-checkout-spec)`.

Spec kelganda o'zgaradigan joylar: `STATE_MAP`,
`UzumCheckoutProvider.canonicalPayload()` + `signatureScheme`,
`normalizeCheckoutCallback()` maydon nomlari, summa birligi konversiyasi.

## Register flow (chiquvchi)

```
POST /v1/payments/:bookingId/create   { "provider": "uzum_checkout" }
        │
        ▼
PaymentsService.createPayment()  ──(provider==='uzum_checkout')──►  createUzumCheckoutPayment(booking)
        │
        ├─ mavjud ochiq (pending/processing) payment bo'lsa → o'shani qaytaradi (idempotent)
        │
        ├─ UzumCheckoutProvider.register({ orderNumber, merchantOperationId, amountSom, currency, successUrl, failureUrl })
        │        │
        │        ├─ konfiguratsiya yo'q  → UzumCheckoutError('not_configured')
        │        └─ konfiguratsiya bor   → UzumCheckoutError('spec_required')   ← taxminiy so'rov YUBORILMAYDI
        │
        └─ ikkala holatda ham → 503 { code: 'PAYMENT_PROVIDER_NOT_CONFIGURED' }, HECH QANDAY payments qatori yozilmaydi
```

Spec + credential kelgach `register()` javobi bilan `payments` qatori yoziladi:
`provider='uzum_checkout'`, `status='processing'`, `provider_reference=<orderId>`,
`idempotency_key='uzum_checkout:<orderId>'`, `payment_url=<Uzum checkout URL>`.

`buildCheckoutUrl('uzum_checkout', …)` — sinxron yordamchi (masalan
`bookings.service.createPayment` ishlatadi) ATAYLAB 503 tashlaydi (jim `null`
emas) — Checkout URL faqat async `register()` javobidan keladi.

**Click / Payme / Merchant-Uzum oqimlari tegilmadi** — `createPayment()` ichiga
faqat erta `return` qo'shildi.

## Payment mapping

| SAFAAR                        | Uzum                       | Joy                              |
| ----------------------------- | -------------------------- | -------------------------------- |
| `bookings.booking_number`     | `orderNumber`              | `register()` so'rovida (SPEC)    |
| `payments.id`                 | `merchantOperationId`      | `register()` so'rovida (SPEC)    |
| `payments.provider_reference` | `orderId` (Uzum qaytaradi) | `register()` javobida saqlanadi  |
| `payments.idempotency_key`    | `uzum_checkout:<orderId>`  | `@unique`                        |
| `payments.provider`           | —                          | `uzum_checkout` enum (migration) |

## Reconciliation

`PaymentsService.reconcileUzumCheckoutPayments(olderThanMinutes=15)`:

- `checkout.isConfigured()` FALSE → darhol `{ scanned: 0, updated: 0 }` (no-op, DB so'rovsiz);
- aks holda `pending`/`processing` `uzum_checkout` to'lovlar (>N daqiqa) uchun
  `getOrderStatus()` → `PAID` bo'lsa mavjud `uzumCheckoutCallback()` oqimi,
  `FAILED` bo'lsa `payments.status='failed'`;
- `STATE_MAP` bo'sh ekan har qanday holat `UNKNOWN` → hech narsa o'zgarmaydi.

Ataylab **`@Cron`SIZ** — Uzum status enum'i tasdiqlangach
`@Cron(EVERY_5_MINUTES)` qo'shiladi.

Callback to'lovni topadi: `idempotency_key = 'uzum_checkout:<orderId>'` **yoki**
`provider_reference = <orderId>` **yoki** `payments.id = <merchantOperationId>`
**yoki** `booking_number = <orderNumber>` orqali; keyin `provider='uzum_checkout'`
/ `idempotency_key` prefiksi bilan Checkout to'lovi ekanini tasdiqlaydi
(Merchant `provider='uzum'` bilan aralashmaydi).

## Qayta ishlatilgan mavjud logika (yangi parallel mexanizm YO'Q)

`state === 'PAID'` bo'lganda `PaymentsService.uzumCheckoutCallback()`:

```
processPaymentEvent('uzum_checkout', 'confirm',
  'uzum_checkout:confirm:<orderId>',
  { booking_id, transaction_id: orderId, amount, currency })
```

Bu quyidagilarni beradi (o'zgarishsiz):

- **Idempotentlik** — `payment_events.event_key` UNIQUE + `ON CONFLICT DO NOTHING`
  → duplicate `{ duplicate: true }`, HTTP 200, ledger/booking qayta tegilmaydi.
- **`assertPaymentMatchesPayload`** — amount (`=== payments.amount`, so'm) va
  currency tekshiruvi.
- **Terminal-holat qo'riqchi** (`TERMINAL_PAYMENT_STATUSES`).
- **Booking o'tishi** — `bookings.status = confirmed` (yoki
  `awaiting_partner_confirmation`), `expires_at = NULL`,
  `booking_status_history` yozuvi.
- **Partner ledger** — `creditPartnerLedger()` (`booking_earned`,
  `+partner_payable`) bir marta.

`state !== 'PAID'` — faqat audit uchun `payment_events`
(`uzum_checkout:<orderId>:<state>`) yoziladi, biznes holat TEGILMAYDI.

**Redirect success/failure URL to'lovni PAID QILMAYDI** — faqat imzosi
tasdiqlangan callback + normallashtirilgan `PAID` holati.

## Env (Uzum onboarding'dan; hech biri majburiy emas, secret env orqali)

```
UZUM_CHECKOUT_BASE_URL              # /payment/register bazasi (chiquvchi)
UZUM_CHECKOUT_MERCHANT_ID
UZUM_CHECKOUT_TERMINAL_ID           # nomi rasmiy spec bilan tasdiqlanishi kerak
UZUM_CHECKOUT_API_KEY
UZUM_CHECKOUT_CALLBACK_SIGN_KEY     # callback imzo kaliti (faqat spec tasdiqlasa)
UZUM_CHECKOUT_SIGNATURE_SCHEME      # 'none' (default, fail-closed) | 'hmac-sha256'
UZUM_CHECKOUT_SIGNATURE_HEADER      # default 'x-signature'
```

`isConfigured()` = `BASE_URL && MERCHANT_ID && API_KEY` (chiquvchi metodlar
uchun). `isCallbackVerificationConfigured()` = `CALLBACK_SIGN_KEY && SCHEME!='none'`.
`.env.example`'da bo'sh qiymatlar bilan hujjatlangan (`backend.env` production
o'zgartirilmadi).

Secret/imzo/Authorization **log qilinmaydi** (faqat `orderId`/state — non-secret
korrelyatsiya).

## Fayllar

- `src/payments/providers/uzum-checkout.provider.ts` — provider: fail-closed imzo
  abstraction, `normalizeCheckoutCallback`, `NormalizedCheckoutCallback`,
  `UzumCheckoutError`, `stableStringify`, hamda chiquvchi seam'lar (`register` /
  `getOrderStatus` / `getOperationState` / `refund` — hammasi `NOT_CONFIGURED` /
  `SPEC_REQUIRED` bilan fail-closed, `@example` mapping bilan).
- `src/payments/uzum-checkout.controller.ts` — `POST /v1/uzum/checkout/callback`.
- `src/payments/payments.service.ts` — `uzumCheckoutCallback()` +
  `createUzumCheckoutPayment()` (register seam) + `buildCheckoutUrl` branch +
  `reconcileUzumCheckoutPayments()` + `provider()` allowlist'ga `uzum_checkout`.
- `src/payments/payments.module.ts` — controller + provider ro'yxatga olindi.
- `src/payments/dto/payment.dto.ts` — `CreatePaymentDto` allowlist'ga `uzum_checkout`.
- `src/config/env.validation.ts` + `.env.example` — `UZUM_CHECKOUT_*` (optional,
  `+ UZUM_CHECKOUT_TERMINAL_ID`).
- `prisma/migrations/20260903120000_uzum_checkout_payment_method/migration.sql`
  — `ALTER TYPE "PaymentMethod" ADD VALUE IF NOT EXISTS 'uzum_checkout'`
  (**qo'llanilmagan** — deploy alohida tasdiq talab qiladi).
- Testlar: `providers/uzum-checkout.provider.spec.ts`,
  `payments.service.uzum-checkout.spec.ts`, `uzum-checkout.controller.spec.ts`
  — **ICHKI/abstraction shartnoma ustidan**, Uzum production kontrakti EMAS.

## Keyingi qadamlar (rasmiy Checkout spec + credential kelganda)

1. `providers/uzum-checkout.provider.ts` → `outboundBlocker()` guard'ini olib
   tashlash; `register` / `getOrderStatus` / `getOperationState` / `refund`
   ichiga `@example` bo'yicha real `fetch` yozish (endpoint yo'li, auth
   sarlavhasi, so'rov/javob maydonlari — rasmiy hujjatdan).
2. `STATE_MAP` to'ldirish (Uzum `operationState` -> `PAID`/`FAILED`/`PENDING`).
3. `canonicalPayload()` + `signatureScheme` + header nomini Uzum imzo sxemasiga
   moslash; kerak bo'lsa raw-body baytlarini ushlash (`json({ verify })`).
4. Summa birligini tasdiqlash (so'm/tiyin) — `normalizeCheckoutCallback` va
   `register()` da konversiya.
5. `reconcileUzumCheckoutPayments()` ga `@Cron(EVERY_5_MINUTES)` qo'shish.
6. Frontend to'lov tanlash: `apps/web-user` (`PaymentProvider` /
   `PaymentSelector` / `RetryPaymentForm`) + `bookings.service.paymentMethod()` /
   `bookings/dto/booking.dto.ts` allowlistlari (hozircha `uzum` ham yo'q —
   ikkalasi birga qo'shiladi).
7. SAFAAR refund modulini (`refunds` + admin tasdiq) `checkout.refund()` bilan
   ulash.
8. `UZUM_CHECKOUT_*` credential'larni `backend.env`ga qo'yish + migration'ni
   `develop → production` orqali qo'llash.
9. Real Uzum sandbox bilan round-trip test.
