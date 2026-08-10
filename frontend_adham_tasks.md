# Admin panel uchun vazifa: Admin 2FA (ikki bosqichli tasdiqlash)

**Assalomu alaykum Frontend Developer!**

Backend tomonda admin panel uchun 2FA (Google Authenticator/Authy orqali) to'liq ishlab chiqildi va production'da tekshirilib, ishlayotgani tasdiqlandi. Lekin admin panel frontend'ida bunga mos hech qanday interfeys yo'q.

## ⚠️ Muhim — bu shunchaki "yetishmayotgan feature" emas

Hozirgi login sahifasi (`app/(auth)/login/page.tsx`) va `AdminApi.login()` (`lib/api/admin-api.ts`) faqat `data.accessToken` kelishini kutadi. Agar kelajakda (yoki hozir) biror admin akkauntda 2FA yoqilgan bo'lsa, backend token qaytarmaydi — o'rniga `{ requires_2fa: true, challenge_id, ... }` qaytaradi. Hozirgi kodda bu holat uchun faqat:

```ts
if (data.requires_2fa) {
  throw new Error('2FA kerak');
}
```

— ya'ni admin ekranda faqat "2FA kerak" degan xato ko'radi va **kira olmay qoladi, chunki kodni kiritadigan joy umuman yo'q**. Bu bosqich albatta qo'shilishi kerak, aks holda 2FA yoqilgan har qanday admin akkaunti login qila olmaydi.

---

## 1-qism: Login oqimiga 2FA bosqichini qo'shish

### Oqim sxemasi

```
1. Admin login/parol kiritadi
   → POST /v1/auth/admin/login

2a. Agar admin'da 2FA YO'Q bo'lsa:
    → javobda accessToken/refreshToken keladi — hozirgidek davom etaveradi.

2b. Agar admin'da 2FA YOQILGAN bo'lsa:
    → javobda token YO'Q, o'rniga { requires_2fa: true, challenge_id, expires_in_seconds } keladi.
    → Frontend "6 xonali kodni kiriting" ekranini ko'rsatishi kerak.
    → Admin Google Authenticator'dagi 6 xonali kodni kiritadi.
    → POST /v1/auth/admin/verify-2fa { challenge_id, code }
    → Muvaffaqiyatli bo'lsa — endi accessToken/refreshToken keladi.
```

### API — Login

**`POST /v1/auth/admin/login`**

So'rov:
```json
{ "username": "admin", "password": "..." }
```
(`username` o'rniga `email` ham yuborish mumkin)

Javob variant A — 2FA yo'q (hozirgidek):
```json
{
  "accessToken": "...",
  "refreshToken": "...",
  "admin": {
    "id": "...",
    "email": "admin@safaar.uz",
    "full_name": "...",
    "role": "SUPER_ADMIN",
    "status": "active",
    "has_2fa": false
  }
}
```

Javob variant B — 2FA talab qilinadi (**yangi, hozir handle qilinmayapti**):
```json
{
  "requires_2fa": true,
  "challenge_id": "b1a2c3d4-...",
  "expires_in_seconds": 300
}
```

### API — 2FA kodni tasdiqlash (login'ni yakunlash)

**`POST /v1/auth/admin/verify-2fa`**

So'rov:
```json
{ "challenge_id": "b1a2c3d4-...", "code": "482913" }
```

Javob (muvaffaqiyatli) — login variant A bilan bir xil shaklda (`accessToken`, `refreshToken`, `admin`).

Xato holatlari:
| Kod | Ma'no | Frontend nima qilishi kerak |
|---|---|---|
| `AUTH_2FA_EXPIRED` (401) | `challenge_id` 5 daqiqadan keyin eskiradi | "Vaqt tugadi, qaytadan kiring" — login sahifasiga qaytarish |
| `AUTH_2FA_INVALID` (401) | Kod noto'g'ri | "Kod noto'g'ri" xatoligini ko'rsatib, qayta kiritishga ruxsat berish (challenge_id o'zgarmaydi, qayta urinish mumkin) |

**Eslatma:** hozircha recovery kod orqali login qilish backendda yo'q (faqat pastda tasvirlangan "yaratish" bor) — shuning uchun bu ekranda "recovery kod bilan kirish" tugmasi hozircha qo'shilmasin.

---

## 2-qism: Sozlamalarda "2FA yoqish/o'chirish" bo'limi

Bu — admin o'zi (login qilgandan keyin) 2FA'ni yoqadigan/o'chiradigan joy. Eng mos joy: `app/(dashboard)/settings/page.tsx` yoki profil sahifasi (o'zingiz belgilaysiz).

`admin` obyektidagi `has_2fa: boolean` maydonidan foydalanib, "Yoqilgan"/"O'chirilgan" holatini ko'rsating.

### Yoqish oqimi (3 qadam)

**1-qadam — sozlashni boshlash:**

`POST /v1/auth/admin/2fa/setup` (Authorization header — login token bilan)

Javob:
```json
{
  "setup_id": "6e4057f0-...",
  "otpauth_url": "otpauth://totp/safaar:admin%40safaar.uz?secret=...&issuer=safaar&algorithm=SHA1&digits=6&period=30",
  "secret": "66ISUEWTIFZECZCRXPRCNAX72M62XLX5",
  "recovery_codes": ["Nm6PWYsMYFkY", "oGizWlyKTFQx", "...", "..."],
  "expires_in_seconds": 600
}
```

- `otpauth_url`ni QR kod qilib chizing (masalan `qrcode.react` yoki `react-qr-code` kutubxonasi bilan) — admin buni Google Authenticator/Authy bilan skanerlaydi.
- Agar kamera/skanerlashda muammo bo'lsa, `secret`ni matn sifatida ham ko'rsating ("qo'lda kiritish" varianti uchun).
- **`recovery_codes` — bu javobda FAQAT BIR MARTA keladi.** Backend faqat hash'ini saqlaydi, keyinroq qayta so'rab bo'lmaydi. Admin'ga aniq ogohlantirish bilan ko'rsating: *"Bu kodlarni xavfsiz joyga saqlab qo'ying — bu sahifani yopgandan keyin qayta ko'rsatib bo'lmaydi"* (nusxalash tugmasi/yuklab olish qo'shsangiz yaxshi bo'ladi).
- `setup_id` 10 daqiqa amal qiladi — shu vaqt ichida 2-qadam bajarilishi kerak.

**2-qadam — tasdiqlash (haqiqatan yoqish):**

Admin authenticator ilovasidan 6 xonali kodni kiritadi:

`POST /v1/auth/admin/2fa/confirm`
```json
{ "setup_id": "6e4057f0-...", "code": "482913" }
```

Javob: `{ "enabled": true }`

Xato: `AUTH_2FA_EXPIRED` (setup_id eskirgan — 1-qadamdan qaytadan boshlash kerak) yoki `AUTH_2FA_INVALID` (kod noto'g'ri — qayta kiritishga ruxsat bering).

### O'chirish

`POST /v1/auth/admin/2fa/disable` (Authorization header bilan, boshqa parametr shart emas)

Javob: `{ "disabled": true, "sessions_revoked": true }`

**Muhim:** `sessions_revoked: true` — bu chaqiruvdan keyin admin'ning BARCHA sessiyalari (shu jumladan hozirgi) bekor qilinadi. Ya'ni disable qilingandan keyin frontend darhol logout qilib, login sahifasiga qaytarishi kerak (keyingi so'rovlar `401`/`AUTH_SESSION_REVOKED` qaytaradi).

---

## Yakuniy endpoint jadvali

| Endpoint | Method | Auth | Vazifa |
|---|---|---|---|
| `/v1/auth/admin/login` | POST | Yo'q | Login (token yoki 2FA challenge qaytaradi) |
| `/v1/auth/admin/verify-2fa` | POST | Yo'q | 2FA kodni tasdiqlab, login'ni yakunlash |
| `/v1/auth/admin/2fa/setup` | POST | Ha (login token) | QR/secret/recovery kodlarni generatsiya qilish |
| `/v1/auth/admin/2fa/confirm` | POST | Ha (login token) | Kodni tasdiqlab, 2FA'ni haqiqatan yoqish |
| `/v1/auth/admin/2fa/disable` | POST | Ha (login token) | 2FA'ni o'chirish (barcha sessiyalarni bekor qiladi) |

Savol chiqsa yozing — rahmat!

---
---

# Qo'shimcha vazifa: Admin va Partner panellarda backendda bor, frontendda yo'q funksiyalar

Backend va frontend to'liq audit qilindi. Quyidagilar — backend tomonda TO'LIQ ishlab chiqilgan va ishlaydigan, lekin frontendda hech qanday ekrani/tugmasi yo'q funksiyalar. Deyarli hech qayerda mock/soxta ma'lumot bilan ishlash holati topilmadi — muammo har doim UI'ning umuman yo'qligida.

Har bir band uchun: qaysi endpoint(lar), backendda qayerda (`fayl:qator`), va nima qilishi kerakligi ko'rsatilgan.

## A) Admin panel (`apps/web-admin`)

### A1. Admin xodimlar va ruxsatlar boshqaruvi — butunlay yo'q
- `GET/POST /v1/admin/admin-users`, `PATCH /v1/admin/admin-users/:id`, `PATCH /v1/admin/admin-users/:id/status`, `POST /v1/admin/admin-users/:id/reset-2fa` — `admin.controller.ts:656-689`
- `GET /v1/admin/roles`, `PATCH /v1/admin/roles/:id/permissions` — `admin.controller.ts:691-703`
- Kerak: boshqa admin/moderator akkauntlarni yaratish, ro'yxatini ko'rish, holatini o'zgartirish, huquqlarini (rol) tahrirlash, kerak bo'lsa 2FA'sini reset qilish uchun sahifa.

### A2. Bildirishnoma/broadcast yuborish — butunlay yo'q
- `POST /v1/admin/notifications/broadcast`, `GET /v1/admin/notifications/broadcasts`, `GET /v1/admin/notifications/broadcasts/:id`, `POST /v1/admin/notifications/broadcasts/:id/:action` — `admin.controller.ts:632-654`
- Kerak: barcha foydalanuvchilarga (yoki segmentga) push/in-app xabar yozib yuborish, yuborilgan xabarlar tarixini ko'rish ekrani.

### A3. To'lovlar va qaytarishlar (refund) — butunlay yo'q
- `GET /v1/admin/payments`, `GET /v1/admin/payments/:id`, `POST /v1/admin/payments/:id/reconcile` — `admin.controller.ts:323-337`
- `GET /v1/admin/refunds`, `GET /v1/admin/refunds/:id`, `POST /v1/admin/refunds/:id/approve|reject|retry` — `admin.controller.ts:339-365`
- Kerak: to'lovlar ro'yxati/detali, refund navbatini ko'rish va tasdiqlash/rad etish/qayta urinish tugmalari.

### A4. Moliya bo'limi — chuqurroq funksiyalar ulanmagan
- `GET /v1/admin/finance/overview`, `GET /v1/admin/finance/revenue-chart` — `admin.controller.ts:367-374` (hozir `finance/overview/page.tsx` bu o'rniga umumiy dashboard statistikasidan foydalanadi — to'g'ridan-to'g'ri shu endpointlarga o'tkazish kerak)
- `GET /v1/admin/finance/provider-reconciliation` — `admin.controller.ts:382-385` (to'lov provayderi bilan solishtirish hisoboti — UI yo'q)
- `POST /v1/admin/finance/export`, `POST /v1/admin/finance/tax-report-export` — `admin.controller.ts:387-396` (`finance/reports/page.tsx` hozir faqat client-side Excel export qiladi, real backend export'ga ulanmagan)
- `GET /v1/admin/finance/documents`, `POST /v1/admin/finance/documents/:id/regenerate` — `admin.controller.ts:398-406` (invoys/hujjat generatsiyasi — UI yo'q)
- `POST /v1/admin/withdrawals/:id/mark-paid` — `admin.controller.ts:430-434` (`finance/withdrawals` sahifasida faqat approve/reject bor, "to'landi" deb belgilash tugmasi yo'q)

### A5. Hamkor moliyaviy balansi (ledger) — yo'q
- `GET /v1/admin/partners/:id/ledger`, `POST /v1/admin/partners/:id/adjustment` — `admin.controller.ts:199-212`
- Kerak: hamkor detali sahifasida balans tarixi (ledger) tab va qo'lda tuzatish (adjustment) formasi.

### A6. Hamkor arizalari — qo'shimcha amallar yo'q
- `POST /v1/admin/partners/:id/request-information` — `admin.controller.ts:155-168` ("qo'shimcha ma'lumot so'rash" tugmasi yo'q)
- `POST /v1/admin/partners/export` — `admin.controller.ts:214-217` (arizalar ro'yxatini export qilish tugmasi yo'q)

### A7. Boshqa butunlay yo'q sahifalar
- `GET /v1/admin/trips`, `GET /v1/admin/trips/:id`, `POST /v1/admin/trips/:id/cancel` — `admin.controller.ts:267-280` (tur/sayohat bronlarini boshqarish — hech qanday ekran yo'q)
- `GET /v1/admin/bus-companies`, `PATCH /v1/admin/bus-companies/:id/status` — `admin.controller.ts:282-293` (avtobus operatorlarini tasdiqlash/boshqarish — bron sahifasi bor, lekin operator boshqaruvi yo'q)
- `PATCH /v1/admin/hotels/:id/visibility` — `admin.controller.ts:253-265` (e'lonni rad etmasdan vaqtincha yashirish — hozir faqat publish/reject bor)
- `GET /v1/admin/promos/:id/stats` — `admin.controller.ts:543-546` (promo-kod ishlatilish statistikasi — UI yo'q)
- `GET /v1/admin/analytics/dashboard` (`SUPER_ADMIN` only) — `analytics.controller.ts:43-53` (alohida analitika sahifasi umuman yo'q)
- `PATCH /v1/admin/settings/providers/:provider`, `POST /v1/admin/settings/providers/:provider/test` — `admin.controller.ts:725-737` (Click/Payme/Uzcard/Humo kalitlarini sozlash va ulanishni tekshirish — sozlamalar sahifasida provayderlar tab'i yo'q)
- `GET /v1/admin/users/:id/audit`, `POST /v1/admin/users/:id/message`, `POST /v1/admin/users/message`, `POST /v1/admin/users/export` — `admin.controller.ts:89-119` (foydalanuvchi audit-tarixi, unga xabar yuborish, ommaviy xabar/eksport — foydalanuvchi detali sahifasida yo'q)
- `POST /v1/admin/support/tickets/:id/:action` — `admin.controller.ts:616-625` (status/xabardan tashqari boshqa ticket amallari — ishlatilmagan)

## B) Partner panel (`apps/web-partner`)

Bronlar, xonalar/joylar CRUD, rasm yuklash, walk-in bron yaratish, check-in/xona biriktirish/checkout, support ticketlari — bularning barchasi to'liq ishlaydi, tegilmang.

### B1. Jamoa/xodimlar boshqaruvi — butunlay yo'q
- `GET/POST /v1/partner/team`, `PATCH/DELETE /v1/partner/team/:id` — `partners.controller.ts:43-71`
- Kerak: `settings` bo'limida "Jamoa" tab'i — xodim taklif qilish, rolini belgilash, o'chirish.

### B2. Hujjatlar/verifikatsiya — butunlay yo'q
- `GET/POST /v1/partner/documents` — `partners.controller.ts:73-84`
- Kerak: litsenziya/hujjat yuklash va holatini ko'rish ekrani.

### B3. Ariza holatini kuzatish/qayta topshirish — yo'q
- `POST /v1/partner/application/submit`, `GET /v1/partner/application/status`, `POST /v1/partner/application/resubmit` — `partners.controller.ts:86-99`
- Kerak: rad etilgan arizani tuzatib qayta yuborish imkoni (hozir faqat ro'yxatdan o'tishdagi bir martalik forma bor).

### B4. Transport/avtobus biznes turi — butunlay yo'q (eng katta bo'shliq)
- `GET/POST /v1/partner/vehicles`, `PATCH /v1/partner/vehicles/:id`, `POST /v1/partner/vehicles/:id/seat-layout` — `partners.controller.ts:394-577`
- `GET/POST /v1/partner/routes`, `PATCH /v1/partner/routes/:id`
- `GET/POST /v1/partner/trips`, `PATCH /v1/partner/trips/:id`, `POST /v1/partner/trips/:id/cancel`, `GET /v1/partner/trips/:id/seats`
- Bron sub-amallari: `board`/`complete`, `cash-collected`/`cash-reversal`
- Backend: `partners.service.ts:2132-2434, 3058-3095`
- Kerak: ro'yxatdan o'tishda "bus" turi tanlash mumkin, lekin unga mos butun dashboard (transport vositalari, yo'nalishlar, reyslar, o'rindiq xaritasi, naqd pul hisoboti) yo'q — bu alohida katta bo'lim sifatida rejalashtirilishi kerak.

### B5. Moliya/pul yechish — dashboard bor, asosiy vositalar yo'q
- `GET /v1/partner/finance/overview|ledger|chart` — `partners.controller.ts:578-631`
- `POST/GET /v1/partner/withdrawals` (pul yechish so'rovi)
- `GET /v1/partner/finance/documents`, `GET /v1/partner/finance/documents/:id/download`
- `POST /v1/partner/exports/finance`, `POST /v1/partner/exports/bookings`
- Hozir: "Hisobotlar" sahifasi buning o'rniga bron ma'lumotlaridan o'zi client-side hisoblab chiqadi (`app/_lib/domain/reports.ts`). Hamkor pul yechish so'rovi yubora olmaydi, balans hisobotini yuklab ololmaydi — bu tezkor tuzatilishi kerak bo'lgan muhim bo'shliq.

### B6. Dasturchi/API kirish — butunlay yo'q
- `GET/POST /v1/partner/api-keys`, `DELETE /v1/partner/api-keys/:id`
- `GET/POST /v1/partner/webhooks`, `PATCH/DELETE /v1/partner/webhooks/:id`, `POST /v1/partner/webhooks/:id/test`, `GET /v1/partner/webhooks/:id/deliveries`, `POST /v1/partner/webhooks/deliveries/:id/retry`
- Backend: `partners.controller.ts:641-714`, `partners.service.ts:3286-3503`
- Kerak: sozlamalarda "Dasturchi" bo'limi — API kalit yaratish/o'chirish, webhook manzillarini boshqarish va test qilish.

### B7. Inventar/blackout kunlar — chetlab o'tilgan
- `GET/PUT /v1/partner/hotels/:id/inventory`, `POST /v1/partner/hotels/:id/blackout-dates` — `partners.controller.ts:315-339`
- Hozir: kalendar sahifasi xonalarni faqat client-side hisoblaydi (`app/(dashboard)/calendar/calendar-view.tsx`). Xonani ma'lum kunlarga "yopish" (blackout) imkoni yo'q.

---

Savol chiqsa yozing — rahmat!
