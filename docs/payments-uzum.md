# Uzum Bank Merchant API — integratsiya

Manba: **rasmiy Uzum Merchant API contract** (developer.uzumbank.uz, `Merchant API 1.0.0`).
Uzum bizga 5 ta webhook yuboradi (HTTPS `POST`, `application/json`, HTTP Basic Auth);
javob ham JSON. Bizda **outbound** chaqiruv yo'q — faqat qabul qilamiz.

## Marshrutlar

Global prefiks `v1` bilan:

| Uzum operatsiyasi | SAFAAR route |
|---|---|
| `/check` | `POST /v1/uzum/webhook/check` |
| `/create` | `POST /v1/uzum/webhook/create` |
| `/confirm` | `POST /v1/uzum/webhook/confirm` |
| `/reverse` | `POST /v1/uzum/webhook/reverse` |
| `/status` | `POST /v1/uzum/webhook/status` |

Uzum'ga beriladigan **base URL**: `<PUBLIC_API_ORIGIN>/v1/uzum/webhook`
(Uzum unga `/check` va h.k. qo'shadi). `https://testtest.uzz/uzum/webhook` —
faqat contractdagi *placeholder*, real endpoint emas.

## Javob shakli (rasmiy contract)

- **Muvaffaqiyat: HTTP 200**
  - `/check`   → `{ serviceId, timestamp, status: "OK", data }`
  - `/create`  → `{ serviceId, transId, status: "CREATED", transTime, data, amount }`
  - `/confirm` → `{ serviceId, transId, status: "CONFIRMED", confirmTime, data, amount }`
  - `/reverse` → `{ serviceId, transId, status: "REVERSED", reverseTime, data, amount }`
  - `/status`  → `{ serviceId, transId, status, transTime, confirmTime, reverseTime, data, amount }`
- **Biznes-xato: HTTP 400** → `{ serviceId, status: "FAILED", errorCode: "<string>" }`
  — `errorMessage` **YO'Q**, `errorCode` **string**.

`amount` — **tiyin** (`so'm * 100`). SAFAAR ichida esa so'm (`Decimal(18,2)`).
Konvertatsiya faqat `UzumProvider` chegarasida.

## Error-code'lar (rasmiy jadval)

`10001` auth · `10002` JSON/struktura · `10003` noto'g'ri operatsiya ·
`10005` majburiy parametr yo'q · `10006` noto'g'ri `serviceId` ·
`10007` account topilmadi · `10008` allaqachon to'langan · `10009` bekor qilingan ·
`10010` `transId` allaqachon yaratilgan · `10011` noto'g'ri summa ·
`10012` minimaldan kam · `10013` maksimaldan ko'p · `10014` tranzaksiya topilmadi ·
`10015` bekor qilingan — tasdiqlab bo'lmaydi · `10016` allaqachon tasdiqlangan ·
`10017` bekor qilib bo'lmaydi (holat) · `10018` allaqachon bekor qilingan ·
`99999` ichki xato.

## Mapping (SAFAAR qarorlari)

- `params.account` = **`bookings.booking_number`** (foydalanuvchi Uzum ilovasida
  shu raqamni kiritadi). UUID `booking.id` ishlatilmaydi.
- `params.user_id` (agar Uzum yuborsa) — mehmon bronlarida `NULL` bo'lgani uchun
  **majburiy shart emas** (contract mandatory demagan).
- Payment `provider = 'uzum'`, `provider_reference = transId`,
  `idempotency_key = 'uzum:' + transId` (`@unique`).
- `/status` mapping: `processing/pending → CREATED`, `paid → CONFIRMED`,
  `reversed/refunded → REVERSED`, `failed → FAILED`.

## Idempotentlik

`payment_events.event_key` (`@unique`) claim: `uzum:create:<transId>`,
`uzum:confirm:<transId>`, `uzum:reverse:<transId>`.
Takroriy chaqiruvda contract bo'yicha **aniq kod** qaytariladi (jim replay emas):

| Holat | Kod |
|---|---|
| `/create` bir xil `transId` | `10010` |
| `/confirm` allaqachon tasdiqlangan | `10016` |
| `/confirm` bekor qilingan tranzaksiya | `10015` |
| `/reverse` allaqachon bekor qilingan | `10018` |
| `/reverse` holat yo'l qo'ymaydi | `10017` |

Yon-ta'sir (booking confirm, ledger kredit, kompensatsiya) **bir martadan ko'p
bajarilmaydi** — `event_key` UNIQUE + booking qatorini `FOR UPDATE` qulflash.

## Booking muddati

Uzum `/confirm` oynasi **30 daqiqa**; SAFAAR default booking muddati 15 daqiqa.
`/create` muvaffaqiyatli bo'lganda `bookings.expires_at = now + 35 min`
(30 + 5 daqiqa bufer) — faqat bron hali OCHIQ bo'lsa. Muddati o'tgan bronni
`/create` **qayta tiriltirmaydi** — `10009` bilan rad etadi.

`failStaleUzumTransactions` cron (har daqiqa): `/create`dan 30 daqiqadan keyin
hali `processing/pending` bo'lgan Uzum to'lovini `failed`ga o'tkazadi
(contract talabi).

## `/reverse` semantikasi

Uzum pulni **o'zi qaytaradi** — SAFAAR ichida `refunds` qatori
**YARATILMAYDI** (u admin tomonidan boshlanadigan refund oqimi uchun).
`/reverse` da: payment → `reversed`, bron → `cancelled`, ledger'ga manfiy
`booking_reversed` kompensatsiya yozuvi, avtobus o'rindiq hold'lari bo'shatiladi.

## Autentifikatsiya

`Authorization: Basic base64(login:password)` — har bir so'rovda.
Solishtirish doimiy vaqtda (`timingSafeEqualString`). Credential:

```
UZUM_SERVICE_ID
UZUM_USERNAME
UZUM_PASSWORD
```

Bo'sh bo'lsa barcha Uzum webhooklari `10001` bilan rad etiladi (fail-closed).
`Authorization`, parol, karta/telefon ma'lumotlari **log qilinmaydi**.
Kelgan raw tana `payment_events.payload` (JSONB) da audit uchun saqlanadi.

## Fayllar

- `src/payments/providers/uzum.provider.ts` — adapter (auth, serviceId,
  tiyin, `UZUM_ERROR`, javob quruvchilar).
- `src/payments/uzum-webhook.controller.ts` — 5 route, `@Res()` orqali global
  interceptor/filter chetlab o'tiladi (200/400 to'g'ridan-to'g'ri).
- `src/payments/payments.service.ts` — `uzumCheck/Create/Confirm/Reverse/Status`
  + `failStaleUzumTransactions` cron. `/confirm` mavjud `processPaymentEvent()`ni
  qayta ishlatadi.
- `prisma/migrations/20260901000000_uzum_payment_method/` — `PaymentMethod += uzum`,
  `PaymentStatus += reversed`.

## Test qilish (keyingi qadam)

Rasmiy Uzum TEST sandbox base URL + real test credential kelgach:
`POST <sandbox>/check` bilan real round-trip. Hozircha faqat unit testlar
(`*.uzum.spec.ts`) — jonli Uzum ulanishi TEKSHIRILMAGAN.
