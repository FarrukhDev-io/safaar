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
UZUM_CHECKOUT_HTTPS_PROXY           # IXTIYORIY chiquvchi forward-proxy (statik IP)
```

`isConfigured()` = `BASE_URL && MERCHANT_ID && API_KEY` (chiquvchi metodlar
uchun). `isCallbackVerificationConfigured()` = `CALLBACK_SIGN_KEY && SCHEME!='none'`.
`.env.example`'da bo'sh qiymatlar bilan hujjatlangan (`backend.env` production
o'zgartirilmadi).

Secret/imzo/Authorization **log qilinmaydi** (faqat `orderId`/state — non-secret
korrelyatsiya).

## Statik chiquvchi IP (`UZUM_CHECKOUT_HTTPS_PROXY`)

Uzum Checkout merchant tomonda chiquvchi so'rovlar uchun **barqaror manba
IP** talab qilishi mumkin (allowlist). SAFAAR production backend'i uy/ofis
ISP'i orqali chiqadi (`188.113.198.155`) — bu IP ISP tomonidan o'zgarishi
mumkin. Yechim: **faqat Uzum Checkout so'rovlarini** `safaar-gateway`
(Yandex Cloud) dagi forward-proxy orqali chiqarish → Yandex statik IP.

**Arxitektura**

```
safaar-backend konteyner (baito hostida)
     │  faqat Uzum Checkout HTTP so'rovlari (register/getOrderStatus/
     │  getOperationState/refund) — dispatcher: outboundDispatcher()
     ▼
Tailscale (backend 100.109.46.108  →  gateway 100.105.86.75)
     ▼
tinyproxy @ safaar-gateway  (100.105.86.75:3128, FAQAT tailscale0'ga bind)
     │  CONNECT :443, faqat Uzum domenlariga (Filter allowlist)
     ▼
eth0 → Yandex Cloud 1:1 NAT → <statik IP>   ← Uzum'ga shu IP beriladi
```

**Backend tomoni (kod)**

- `UzumCheckoutProvider.outboundDispatcher()` — `UZUM_CHECKOUT_HTTPS_PROXY`
  bo'sh bo'lsa `undefined` (so'rov to'g'ridan-to'g'ri), sozlangan bo'lsa
  **keshlangan** undici `ProxyAgent`. Chiquvchi metodlar `fetch(url, {
  dispatcher: this.outboundDispatcher(), signal: … })` bilan chaqiradi.
- **`setGlobalDispatcher` ISHLATILMAYDI** — jarayondagi boshqa har qanday
  `fetch()` (SMS, email, CBU kurs, webhook yetkazish, OAuth) va boshqa
  host'dagi Baito trafigi **umuman o'zgarmaydi**.
- Proxy URL yaroqsiz bo'lsa: `env.validation.ts` ilovani ishga tushirmaydi
  (birlamchi), `outboundDispatcher()` `PROXY_MISCONFIGURED` throw qiladi
  (ikkilamchi). Credential logga **userinfo yashirilgan** holda chiqadi
  (`redactProxyUrl` / `outboundProxyUrlForLog`).

**Infra tomoni** (repo'dan tashqarida — sirlar Git'da emas): tinyproxy
konfiguratsiyasi, Tailscale bind, `Allow 100.109.46.108`, `Filter`
allowlist, nft qoidasi va statik-IP tekshiruvi
`docs/infra/uzum-checkout-egress-proxy.md` da (yoki infra runbook'da)
hujjatlashtiriladi. `backend.env` ga faqat `UZUM_CHECKOUT_HTTPS_PROXY=…`
qatori qo'shiladi.

## Uzum Checkout komissiyasi (1.5%) — SAFAAR ICHKI accounting

Biznes kelishuv: Uzum Checkout komissiyasi = to'lov summasining **1.5%i**
(`UZUM_CHECKOUT_COMMISSION_RATE = 0.015`,
`src/payments/providers/uzum-checkout-commission.ts`). Bu **Uzum API
maydoni EMAS** — bizga ma'lum (uchinchi-tomon, rasmiy tasdiqlanmagan)
OpenAPI sxemasida commission/fee degan hech qanday maydon yo'q (na
callback'da, na register so'rovida). Shuning uchun bu hisob-kitob Uzum'ga
HECH NARSA YUBORMAYDI — faqat SAFAAR'ning o'z hisobotlari (admin/export)
uchun `gross` / `commission` / `net` ni ajratib beradi.

```
calculateUzumCheckoutCommission(grossAmountSom) -> {
  grossAmountSom, commissionRate, commissionAmountSom, netSettlementAmountSom
}
```
Butun-tiyin arifmetikasi (`UzumProvider.toTiyin()` bilan bir xil `Math.round`
yaxlitlash siyosati) — suzuvchi nuqta xatosiz. Nol/manfiy/NaN/Infinity ->
`RangeError`.

**`REQUIRES_UZUM_CONFIRMATION`** (`UZUM_CHECKOUT_SETTLEMENT_MODEL`,
kodda taxmin qilinmagan, rasmiy shartnoma/spec kelganda tasdiqlanishi
SHART):
- Uzum settlement'dan 1.5%ni **avtomatik ushlab qoladimi** (bankka NET
  keladi) yoki **to'liq GROSS'ni o'tkazib**, komissiyani alohida
  invoice bilan so'raydimi.
- Refund'da Uzum o'z komissiyasini **qaytaradimi yoki ushlab qoladimi**.
- Uzum'ning o'zi yaxlitlashda qanday qoida ishlatishi (bu yerdagi
  round-half-up — FAQAT SAFAAR'ning ICHKI konventsiyasi).

**DB**: `payments.provider_fee_rate` / `provider_fee_amount` /
`net_settlement_amount` (uchtasi ham NULLABLE, `Payment` modeliga
qo'shildi) — migratsiya **`20260911000000_uzum_checkout_commission_fields`
DIZAYN QILINGAN, LEKIN productionga QO'LLANILMAGAN** (avvalgi Uzum Checkout
migratsiyalari bilan bir xil siyosat — `register()` hali fail-closed stub,
haqiqiy to'lov yo'q, to'ldiriladigan kod yo'q). Ular to'ldirilishi kerak
bo'lgan joy: `register()` spec bilan tasdiqlangach, `createUzumCheckoutPayment()`
ichidagi `payments` INSERT'i `calculateUzumCheckoutCommission(amountSom)`
natijasini shu uchta ustunga yozadi.

**Mijozga ko'rsatish**: hech qanday customer-facing summa/UI
o'zgartirilmadi — `web-user`/`web-partner`da komissiya/fee ko'rsatuvchi
joy avvaldan ham yo'q edi. Komissiyani mijozga qo'shish yoki merchant
o'zi ko'tarishi — BIZNES qaror, tasdiqlanmaguncha kod hech narsani
o'zgartirmaydi.

## TEST muhitidan tasdiqlangan wire-format (2026-09-11)

⚠️ Bu bo'lim uchinchi-tomon spec EMAS — Uzum'ning **haqiqiy TEST
serveridan** (`test-chk-api.uzumcheckout.uz`), sinov so'rovlariga
qaytargan **haqiqiy validatsiya xatolari** orqali tasdiqlangan (kredential
qiymatlari, karta ma'lumotlari va terminal ID HECH QACHON bu faylga
yozilmagan/yozilmaydi).

**MUHIM TUZATISH**: avvalgi taxmin (`${baseUrl}/payment/register`) —
NOTO'G'RI edi. Haqiqiy yo'l prefiksi **`/api/v1/`** talab qiladi:
```
${UZUM_CHECKOUT_BASE_URL}/api/v1/payment/register
${UZUM_CHECKOUT_BASE_URL}/api/v1/payment/getOrderStatus
${UZUM_CHECKOUT_BASE_URL}/api/v1/payment/getOperationState
${UZUM_CHECKOUT_BASE_URL}/api/v1/acquiring/refund
```
Prefikssiz variant (`/payment/register`, va umuman `/api/v1/` bilan
boshlanmagan HAR QANDAY yo'l — `/checkout`, `/pay`, `/session` kabi
taxminiy nomlar ham) nginx darajasida `403`ga tushadi — bu **IP allowlist
EMAS** (avvalgi sessiyaning xulosasi shu qismda noto'g'ri edi): haqiqiy
kredential bilan ham, `/api/v1/` prefiksisiz so'ralgan HAR QANDAY yo'l
xuddi shu 403'ga tushadi, `/api/v1/...` esa kredentialsiz ham ilovaga
yetib boradi (`200` + validatsiya xatosi JSON'i). IP allowlist masalasi
hali ham NOMA'LUM (chunki hozircha faqat `51.250.78.204`dan sinalgan) —
lekin bu 403'larning sababi ENDI aniq: noto'g'ri yo'l, IP emas.

**Tasdiqlangan majburiy sarlavhalar** (`{}` bo'sh body bilan
so'ralganda "Field required" deb qaytgan):
- `X-Terminal-Id` — hamma endpoint uchun
- `X-Api-Key` — yuborilganda hech qachon "missing" deb qaytmadi (talab
  qilinishi mumkin, lekin bu tekshiruv qatlamida alohida qayd etilmagan)
- `Content-Language` — `register`da talab qilinadi (qiymat sifatida
  `en` yuborilganda ham ba'zan hamon "missing" ko'rinishi kuzatildi —
  aniq qabul qilinadigan qiymat/format TASDIQLANMAGAN)
- `X-Operation-Id` — FAQAT `refund`da talab qilinadi

**Tasdiqlangan majburiy body maydonlari** (nomlar — TIPI/semantikasi
HALI HAM NOMA'LUM, taxmin qilinmagan):
- `register` (`OrderPaymentRequest` varianti — bir martalik karta
  to'lovi, ko'rinadi): `viewType`, `clientId`, `currency`, `orderNumber`,
  `sessionTimeoutSecs`, `amount`, `paymentParams`, `merchantParams`.
  (Server bir nechta muqobil sxema — `OrderBindingRequest` (karta
  bog'lash), `OrderMobileTopUpRegisterRequest`, `OrderTechCardRequest`,
  `SBPPaymentRequest`, `OrderMunisTopUpRequest` — bilan ham solishtiradi;
  bularning barchasi BITTA `/api/v1/payment/register` endpoint orqali
  ishlaydi, alohida "registerless" endpoint TOPILMADI.)
- `getOrderStatus`: `orderId` (shu bitta maydon)
- `getOperationState`: `operationId` (shu bitta maydon)
- `refund`: `orderId`, `amount` (+ yuqoridagi `X-Operation-Id` sarlavhasi)

Bularning HAMMASI `{}` (bo'sh) body bilan qaytgan "field required"
xatolaridan yig'ilgan — HAQIQIY qiymat/format/enum HALI HAM
TASDIQLANMAGAN (masalan `viewType`ning mumkin qiymatlari, `paymentParams`/
`merchantParams` ichki shakli, `amount` birligi — so'm yoki tiyin).
Shu sabab `register()`/`getOrderStatus()`/`getOperationState()`/`refund()`
hamon `SPEC_REQUIRED` bilan fail-closed qoladi — bu FAQAT maydon
NOMLARINI tasdiqlaydi, TO'LIQ kontraktni emas.

### 2026-09-11 — real REGISTER urinishi: enumlar tasdiqlandi, AUTOFISCALIZATION bloker

Sandbox terminalga (test kredentiallar bilan, faqat test summasi —
haqiqiy pul YO'Q) ketma-ket 5 ta `POST /api/v1/payment/register`
so'rovi yuborildi, har birida Uzum'ning HAQIQIY validatsiya xatosidan
keyingisi tuzatildi. Yakuniy holat — quyidagilar HAQIQIY, ISHLAYDIGAN
qiymatlar sifatida TASDIQLANDI (kredential/karta qiymatlari YO'Q):

- `Content-Language` sarlavhasi: `'ru-RU'` | `'uz-UZ'` | `'en-EN'`
  (aniq shu formatda — oddiy `'uz'`/`'en'` RAD ETILADI).
- `viewType`: `'WEB_VIEW'` | `'IFRAME'` | `'REDIRECT'`.
  `'REDIRECT'` tanlansa, body'da **`successUrl` va `failureUrl`
  MAJBURIY** (bu bizning ichki domen maydonlarimiz bilan ALLAQACHON
  mos — `RegisterCheckoutInput.successUrl/failureUrl`).
- `currency`: ISO-4217 **RAQAMLI** kod, ALFA KOD EMAS —
  UZS = **`860`** (`'UZS'` string RAD ETILADI). Boshqa ko'rilgan
  qiymatlar: `643`=RUB, `840`=USD, `978`=EUR.
- `paymentParams.payType`: `'ONE_STEP'` | `'TWO_STEP'` (bir/ikki
  bosqichli to'lov — repo'dagi eski terminologiya bilan mos keladi).
- `clientId` (ixtiyoriy client-generated UUID) va `amount` (butun son)
  — HECH QANDAY qo'shimcha validatsiya xatosi bermadi (format/tip
  to'g'ri, lekin bu ularning SEMANTIKASINI — masalan `amount` birligi
  so'mmi yoki tiyinmi — TASDIQLAMAYDI, faqat qabul qilinishini
  ko'rsatadi).

Yuqoridagi HAMMA maydon to'g'ri bo'lgach (5-urinish), javob endi
Pydantic validatsiya xatosi EMAS, balki **biznes-qoida xatosi**:
```
errorCode: 3045
"[AUTOFISCALIZATION] You need to provide a cart with fiscalization
 params for your operation"
```
Ya'ni: **bu test terminal avtofiskalizatsiya YOQILGAN holda
sozlangan** — har bir `register` so'rovi fiskal `cart` (tovar/xizmat
ro'yxati, IKPU/MXIK kodlari, SPIC, QQS stavkasi) talab qiladi. `cart`
maydonini bo'sh `{}` bilan yuborish xatoni O'ZGARTIRMADI (bu
struktura darajasidagi emas, biznes-qoida darajasidagi tekshiruv —
Pydantic kabi "missing field" ro'yxatini bermaydi).

**2026-09-11, qo'shimcha struktura probe'i**: `cart`ni turli
shakllarda yuborish (noto'g'ri tip — string; array + placeholder
element; `{items:[...]}` + placeholder element — hech birida haqiqiy
IKPU/MXIK/narx qiymati YO'Q, faqat `___SAFAAR_PROBE___` markerlar)
BARCHASI bir xil `3045` xatosini qaytardi — hatto `cart` NOTO'G'RI
TIPDA (string) bo'lsa ham Pydantic darajasidagi tip-xatosi
CHIQMADI. Bu shuni ko'rsatadiki: (a) tekshiruv `cart`ning ICHKI
tarkibidan qat'i nazar ishlaydi — ya'ni haqiqiy IKPU/MXIK/narx
qiymatlarisiz HECH QANDAY struktura o'tmaydi, VA/YOKI (b) haqiqiy
maydon nomi/joylashuvi `cart` emas (masalan `paymentParams` ichida
yoki butunlay boshqa nom bo'lishi mumkin) — buni ANIQLASH uchun
haqiqiy IKPU kodi kerak bo'ladi, bu esa `tasnif.soliq.uz`dan
(O'zbekiston rasmiy soliq tasnifi) BIZNES/BUXGALTERIYA tomonidan
tanlanishi kerak bo'lgan real klassifikatsiya — bu yerda O'YLAB
TOPILMAYDI. Qo'shimcha struktura probe'lari shu nuqtada TO'XTATILDI
(keyingi tasodifiy nom taxminlari "cheksiz urinish"ga aylanib
ketardi, foydasi kam).

**2026-09-11 (davomi) — REAL MXIK bilan urinish, hamon aniqlanmagan**:
Biznes tomondan `tasnif.soliq.uz` rasmiy katalogidan haqiqiy
klassifikatsiya olindi:
  - MXIK: `10204001010000000` ("Mehmonxona xizmatlari (yashab
    turish uchun)")
  - O'lchov birligi kodi: `1504157` ("tunu-kun")

Shu haqiqiy qiymatlar bilan `cart.items[{name, mxik, packageCode,
quantity, price}]` shaklida (VAT/vatPercent ATAYLAB QO'SHILMADI —
haqiqiy stavka noma'lum) yuborilgan so'rov ham AYNAN bir xil `3045`
xatosini qaytardi — maydon nomlari (`mxik`/`packageCode` bo'lishi
mumkin yoki bo'lmasligi mumkin) Pydantic darajasida HECH QACHON
tasdiqlanmadi/rad etilmadi. Xulosa: **cart/fiscalization maydonining
aniq JSON kaliti (nomi va joylashuvi) hamon NOMA'LUM** — buni
faqat rasmiy Uzum Checkout hujjati yoki Uzum texnik yordami orqali
aniqlash mumkin, keyingi tasodifiy kalit-nom taxminlari bilan EMAS.

**BU YERDA TO'XTATILDI — taxminiy IKPU/MXIK kod yoki soxta
`cart` tarkibi O'YLAB TOPILMADI.** Sabab: `docs/payments-uzum-checkout.md`
"Uzum Checkout komissiyasi" bo'limida va oldingi fiskalizatsiya
auditida (2026-09-10) allaqachon qayd etilganidek, **SAFAAR'da
fiskalizatsiya/IKPU/MXIK/cart-line-item infratuzilmasi UMUMAN YO'Q**
— qaysi IKPU kodi mehmonxona bronlash yoki avtobus chiptasiga mos
kelishini BIZNES/BUXGALTERIYA hal qilishi kerak, bu kod tomonidan
taxmin qilinadigan narsa emas. Bu — real, texnik jihatdan aniqlangan
BLOKER, IP yoki credential muammosi EMAS.

**Xulosa**: `register()`ning to'liq WIRE-FORMATI (majburiy
maydonlar+enumlar darajasida) endi katta ishonch bilan MA'LUM.
Yagona qolgan bloker — fiskalizatsiya `cart` tarkibi — BIZNES qarorga
bog'liq. `outboundBlocker()` guard shu sabab hamon OLIB
TASHLANMAYDI.

## Fayllar

- `src/payments/providers/uzum-checkout.provider.ts` — provider: fail-closed imzo
  abstraction, `normalizeCheckoutCallback`, `NormalizedCheckoutCallback`,
  `UzumCheckoutError`, `stableStringify`, hamda chiquvchi seam'lar (`register` /
  `getOrderStatus` / `getOperationState` / `refund` — hammasi `NOT_CONFIGURED` /
  `SPEC_REQUIRED` bilan fail-closed, `@example` mapping bilan). **Statik-IP
  seam**: `outboundDispatcher()` / `isOutboundProxyConfigured()` /
  `outboundProxyUrlForLog()` + `buildUzumCheckoutProxyDispatcher()` /
  `redactProxyUrl()` (`UZUM_CHECKOUT_HTTPS_PROXY`).
- `src/payments/providers/uzum-checkout-commission.ts` — 1.5% komissiya
  hisob-kitobi (`calculateUzumCheckoutCommission`), SAFAAR ICHKI accounting,
  Uzum API'ga bog'liq emas. `UZUM_CHECKOUT_SETTLEMENT_MODEL =
  'REQUIRES_UZUM_CONFIRMATION'`.
- `prisma/migrations/20260911000000_uzum_checkout_commission_fields/` —
  `payments.provider_fee_rate/provider_fee_amount/net_settlement_amount`
  (nullable) — **qo'llanilmagan**.
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

## 2026-09-11 — CART sxemasi RASMIY manbadan (developer.uzumbank.uz) topildi va tasdiqlandi

`developer.uzumbank.uz/en/checkout` sahifasining o'zi JS SPA (render
qilinmagan holda o'qib bo'lmaydi — avvalgi izohlarda qayd etilgan), LEKIN
uning **JS bundle'i** (`https://developer.uzumbank.uz/en/assets/js/main.*.js`)
to'liq OpenAPI spec matnini (tavsiflar, sxemalar, ishlaydigan misollar
bilan) satr-literal sifatida o'zida saqlaydi — bu orqali RASMIY sxema
to'g'ridan-to'g'ri o'qib olindi (fetch/curl bilan, hech qanday
avtorizatsiyasiz — bu HAR KIM ochiq ko'rishi mumkin bo'lgan public bundle).

**Rasmiy `merchantParams.cart` joylashuvi va sxemasi** (`OrderPaymentRequest`
uchun, ishlaydigan rasmiy misoldan):
```
merchantParams: {
  cart: {
    cartId: <uuid>,
    receiptType: "PURCHASE",
    total: <butun summa>,
    items: [
      {
        title: <mahsulot/xizmat nomi>,
        productId: <uuid>,
        quantity: <son>,
        unitPrice: <bir dona narxi>,
        total: <shu qatorning umumiy narxi>,
        receiptParams: {          // = "UZReceiptParams" sxemasi
          spic: <IKPU/MXIK, ANIQ 17 ta belgi>,
          packageCode: <qadoqlash/o'lchov birligi kodi, 1-20 belgi>,
          vatPercent: <QQS foizi, 0-99 oralig'idagi BUTUN son>,   // MAJBURIY
          TIN: <STIR, 1-9 belgi>,      // ixtiyoriy, PINFL bilan birga BO'LMAYDI
          PINFL: <JSHSHIR, 1-14 belgi> // ixtiyoriy, TIN bilan birga BO'LMAYDI
        }
      }
    ]
  }
}
```
(Rasmiy misolda `paymentParams` ichida yana `force3ds: true` va
`phoneNumber` ham ko'rsatilgan — ikkalasi ham `OrderPaymentRequest` uchun
MAJBURIY emas edi, lekin `force3ds` 3DS oqimini sinash uchun foydali.)

**Sandboxda haqiqiy MXIK/unit kod bilan tasdiqlandi** (2026-09-11, real
`/api/v1/payment/register` so'rovi, `vatPercent` ATAYLAB qo'shilmadi):
- `spic: "10204001010000000"` (MXIK — tasnif.soliq.uz'dan, biznes
  tomonidan berilgan) — **HECH QANDAY xato QAYTMADI** (uzunlik/format
  to'g'ri deb qabul qilindi).
- `packageCode: "1504157"` (o'lchov birligi kodi — tasnif.soliq.uz
  "Conditional Unit" bo'limidan, biznes tomonidan berilgan) — **HECH
  QANDAY xato QAYTMADI**.
- Javobda **YAGONA** qolgan xato: `receiptParams.vatPercent` — "Field
  required". Boshqa hech bir maydon (`cartId`, `receiptType`, `total`,
  `title`, `productId`, `quantity`, `unitPrice`, `force3ds`,
  `paymentDetails`) qayd etilmadi — demak ULARNING HAMMASI to'g'ri.

**VAT (`vatPercent`) — rasmiy hujjatda ANIQ ko'rsatilgan qiymat YO'Q.**
Rasmiy misolda `vatPercent: 0` bor, lekin bu boshqa mahsulot ("Almond")
uchun — umumiy/standart stavka sifatida hujjatlashtirilmagan. Docs matni
IKPU/packaging kodini `tasnif.soliq.uz`dan olishni ko'rsatadi, lekin QQS
stavkasini QAYERDAN olish kerakligi haqida HECH NARSA demaydi (bu —
soliq/buxgalteriya masalasi, mahsulot katalogidan emas). Shu sabab
`vatPercent` **BLOCKED** — o'ylab topilmadi, boshqa hech qayerda
tasdiqlangan qiymat yo'q.

**Xulosa**: `register()`ning FISKAL qismi (cart tuzilishi + IKPU/unit
maydon nomlari/joylashuvi) endi 100% RASMIY manbadan TASDIQLANGAN.
Yagona qolgan bloker — `vatPercent` uchun mehmonxona xizmati bo'yicha
haqiqiy QQS stavkasi (0%, 12%, yoki boshqa) — bu BIZNES/BUXGALTERIYA
tasdig'ini talab qiladi.
