# BACKEND_TASKS.md — Frontenddan Backend Devga So'rovlar

---

# Hotels Filters API

**Sana:** 2026-08-05

Biz Frontend tomonda Hotels ro'yxatini filtrlash uchun qo'shimcha filterlar kerak bo'ldi. Hozirda quyidagi filterlar UI'da tayyorlangan, lekin backend qo'llab-quvvatlamaydi. Iltimos, quyidagilarni qo'shing:

## 1. Qulayliklar (Amenities) Filter

**Endpoint:** `GET /hotels?amenities=wifi,pool,sauna`

- Query param: `amenities` — vergul bilan ajratilgan qulaylik kodlari
- Mavjud kodlar: `wifi`, `pool`, `sauna`, `breakfast`, `parking`, `tapchan`, `billiards`
- Ishlash mantiq: `hotel_amenities` jadvalidan `amenity_code IN (...)` filter

**Types (`@safaar/types`)** da qo'shish kerak:
```ts
// HotelListQuery ga qo'shish
amenities?: string[]; // yoki string (vergul bilan)
```

---

## 2. To'lov Turi (Payment Type) Filter

**Endpoint:** `GET /hotels?payment_type=online_payment`

- Query param: `payment_type`
- Qiymatlar: `online_payment` | `pay_at_property`
- Ishlash mantiq: `hotels.payment_methods` ustunidan filter

**Types (`@safaar/types`)** da qo'shish kerak:
```ts
payment_type?: 'online_payment' | 'pay_at_property';
```

---

## 3. Bo'sh Xonalar (Availability) Filter

**Endpoint:** `GET /hotels?check_in=2025-08-10&check_out=2025-08-12`

- Query param: `check_in`, `check_out` (ISO format: `YYYY-MM-DD`)
- Ishlash mantiq: Berilgan sana oralig'ida kamida 1 ta bo'sh xonasi bor hotellarni qaytarish
  - `hotel_rooms` jadvalida mavjud xonalar bor
  - O'sha xonalar uchun `bookings` jadvalida berilgan sana oralig'iga to'qnash keluvchi aktiv bron yo'q

> **Eslatma:** `check_in` va `check_out` parametrlari hozirda SearchBar'dan API'ga yuborilmoqda, lekin backend ularni e'tiborsiz qoldiryapti. Faqat filtrlash logikasini qo'shish kifoya.

---

## 4. Maxsus So'rovlar (Special Requests) va Promokod

Foydalanuvchi bron qilayotganda maxsus talablarini va skidka uchun promokod kiritishi uchun qo'shimcha maydonlar kerak.

**Booking yaratish DTO'siga (`CreateHotelBookingDto`) qo'shish kerak:**
```ts
special_requests?: string; // Maxsus so'rovlar (Textarea)
promo_code?: string;       // Promokod
```

**Mantiq (Logic):**
- Agar to'g'ri `promo_code` berilgan bo'lsa, `total_price` dan tegishli chegirma (discount) ayrilishi kerak (agar promo tizimi implement qilingan bo'lsa).
- `special_requests` maydoni booking table'ga va hotel/partner ga yetib boradigan email/SMS xabarnomalarida ko'rinishi kerak.

---

## 5. Parolni O'zgartirish (Change Password)
Foydalanuvchi profilidan turib o'z parolini yangilashi uchun.
- **Endpoint kerak:** `POST /auth/change-password` yoki `PATCH /me/password`
- **Request DTO:** `old_password`, `new_password`

## 6. Transport Ijarasi (Transport Booking)
`web-user` dagi Transport bo'limida avtomobil yoki transferni online bron qilish qismi chala. 
- **Endpoint kerak:** `POST /bookings/transport` (xuddi hotel va bus kabi).

---

## Prioritetlar

| Task | Prioritet |
|---|---|
| Availability Filter (check_in/check_out) | 🔴 Yuqori |
| Amenities Filter | 🔴 Yuqori |
| Payment Type Filter | 🟡 O'rta |
| Special Requests & Promo Codes | 🟡 O'rta |
| Change Password Endpoint | 🟡 O'rta |
| Transport Booking API | 🟢 Past |

Iltimos, har bir task bajarilganda `@safaar/types` paketini yangilab, `npm run build:types` ni ishga tushiring. Rahmat!

#7DB82C

#69A00E