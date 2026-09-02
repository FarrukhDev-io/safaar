# Business Logic & QA Audit Report

Bu hisobot loyihadagi mantiqiy (business logic) va xavfsizlik qoidalarining to'g'riligini qo'lda tekshirish (`LogicQatestpromt.md` talablari) asosida tayyorlandi.

## 📊 Tekshirilgan Mantiqiy Modullar Ro'yxati
- **Auth & Session Logic** (Demo rejim va JWT validatsiyasi)
- **Promo-kod va Chegirmalar** (`calculatePromoDiscount`, `PromosService`)
- **Inventar va Band qilish (Booking)** (Xonalar, avtomobillar ziddiyatlarini tekshirish, `createHotel`, `createVehicleRental`)
- **Status O'zgarishlari va Cron Job** (`expireStaleBookings`, vaqt tugashi bilan bekor qilish)

---

## 🚨 Topilgan Mantiqiy Nomuvofiqliklar

### [CRITICAL] 1. "Demo Rejim" orqali Avtorizatsiyani va API'ni To'liq Aylanib O'tish
**Fayl/funksiya:** `apps/web-partner/app/_lib/api/client.ts` (`request`), `login-form.tsx`
**Kutilgan mantiq:** Foydalanuvchi faqat backend orqali haqiqiy tasdiqlash kodini (OTP) tasdiqlagach, yaroqli signature'ga ega JWT token olishi va tizimga kirishi kerak.
**Amaldagi mantiq (kodda):** 
```typescript
if (isDemoMode() || (token && token.startsWith('demo.'))) {
  return (Array.isArray([]) ? [] : null) as unknown as T;
}
```
**Nima uchun bu muammo:** Xavfsizlik zaifligi. Har qanday shaxs brauzer konsoli orqali `localStorage` ga `"accessToken": "demo.123"` kiritib, dashboardga to'g'ridan-to'g'ri kira oladi. Barcha API so'rovlar backendga bormay "uxlatiladi" va tizim ruxsatsiz shaxsga ochiq qoladi.
**Qanday tekshirib ko'rish mumkin:** Partner portalga kiring, Developer Tools > Local Storage bo'limida token o'rniga "demo.xxx" qiymat qo'ying va sahifani yangilang.

### [CRITICAL] 2. Promo-kod foizlari "Belgilangan Summa" (Fixed) sifatida ishlamoqda (Type Mismatch)
**Fayl/funksiya:** `apps/backend/src/promos/promos.service.ts` (`calculatePromoDiscount`)
**Kutilgan mantiq:** Agar chegirma turi foiz (`percent`) bo'lsa, umumiy summadan foiz ajratib olinishi kerak: `subtotal * (discountValue / 100)`.
**Amaldagi mantiq (kodda):** 
```typescript
const raw = discountType === 'percentage' 
    ? subtotal * (discountValue / 100) 
    : discountValue;
```
**Nima uchun bu muammo:** Frontend (Admin Panel) DB'ga `percent` degan so'z yuboradi. Backend esa qat'iy `percentage` so'zini kutmoqda. Ikkisi mos kelmagani uchun tizim har doim `else` blokiga tushib uni **belgilangan summa** (`discountValue`) sifatida qabul qiladi. Agar siz admin paneldan 20% lik promo-kod yaratsangiz, 1,000,000 so'mlik xarid uchun tizim mijozga bor-yo'g'i roppa-rosa 20 so'm chegirma beradi!
**Qanday tekshirib ko'rish mumkin:** Admin paneldan foizli promo-kod (masalan, 20%) yarating. Mijoz sifatida bron yaratib uni ishlating va chegirma miqdorini tekshiring.
**Tavsiya:** Backenddagi shartni `discountType === 'percent' || discountType === 'percentage'` ga o'zgartirish kerak.

### [CRITICAL] 3. Mehmonxonalar faqatgina 1 ta mijozga 1 ta xona sota oladi (Inventory Logic Bug)
**Fayl/funksiya:** `apps/backend/src/bookings/bookings.service.ts` (`createHotel`)
**Kutilgan mantiq:** Bitta xona turidan (masalan, "Luks") mehmonxonada bir nechta bo'lishi mumkin (`total_inventory` = 10). Tizim bitta sanaga mijozlarni toki inventar 10 ga yetguncha bron qilishga ruxsat berishi kerak.
**Amaldagi mantiq (kodda):** 
```typescript
const conflicts = await tx.query<{ id: string }>(
  `SELECT id FROM bookings WHERE room_id = $1::uuid AND status NOT IN ... LIMIT 1`
);
if (conflicts[0]) throw new ConflictException('Xona allaqachon band');
```
**Nima uchun bu muammo:** Tizim `total_inventory` ni (yoki `room_inventory` jadvalini) umuman tekshirmaydi. Agar ko'rsatilgan sanada **bitta bo'lsa ham** shu turdagi bron mavjud bo'lsa, tizim boshqa hech kimga sotmay, xatoni qaytaradi. Bu butun mehmonxona biznes logikasining bloklanishiga olib keladi.
**Qanday tekshirib ko'rish mumkin:** Ixtiyoriy xona turiga 1-iyul uchun bron qiling. So'ngra boshqa akkauntdan aynan shu xona turiga 1-iyul uchun yana bron qilib ko'ring.

### [MEDIUM] 4. Vaqti o'tgan bronlarni bekor qilishda inventarlar (xonalar) qulfdan yechilmayapti
**Fayl/funksiya:** `apps/backend/src/bookings/bookings.service.ts` (`expireStaleBookings` cron job)
**Kutilgan mantiq:** Hamkor o'z vaqtida javob bermasa, bron avtomatik `cancelled` qilinib, mijoz puli qaytariladi va band qilingan resurslar (o'rindiq, xona) bo'shatilishi kerak.
**Amaldagi mantiq (kodda):** Cron job da `unconfirmedRows` statusi `cancelled` qilinadi, `refund` ochiladi. Lekin xona yoki avtomobil qulfini bo'shatish SQL kodi faqatgina `expired` statuslilar (`trip_seats`) uchungina yozilgan. 
**Nima uchun bu muammo:** Tasdiqlanmagan va bekor qilingan bronlar resursni abadiy band qilib qo'yishi mumkin. Resurs yetishmovchiligi yuzaga keladi.

### [LOW] 5. Avtomobil ijara logikasida kunlik (same-day) ijara mumkin emas
**Fayl/funksiya:** `apps/backend/src/bookings/bookings.service.ts` (`createVehicleRental`)
**Kutilgan mantiq:** Mijoz mashinani 1-iyul ertalab olib, 1-iyul kechqurun topshirishi mantiqan to'g'ri hisoblanishi kerak (1 kunlik ijara).
**Amaldagi mantiq (kodda):** `if (checkOutMs <= checkInMs) throw new BadRequestException`
**Nima uchun bu muammo:** Foydalanuvchi "Same day" ijarani tanlay olmaydi, bu esa qisqa muddatli ijaralar uchun biznes oqimini to'sib qo'yadi.

---

## ❓ Aniqlashtirish Talab Qilinadigan Joylar (Questions to Clarify)
1. **Biznes qoidasi:** Backendda avtomobil va xona narxlari `subtotal` sifatida saqlanayotganda, admin paneldan turib (yoki API orqali) admin manfiy son kiritsa qanday himoya ishlaydi? Kodda `base_price` ga nisbatan qat'iy pozitivlik tekshiruvi frontendga topshirilgan ko'rinadi.
2. **Restoran stollari:** Restoran bronlari uchun faqat 90 daqiqalik interval `interval '90 minutes'` qat'iy kiritilgan (hardcoded). Agar hamkor stollarni 2 soatga bermoqchi bo'lsa, qanday sozlanadi?

---

## 🔝 Eng Xavfli 3 ta Mantiqiy Zaiflik (Top 3 Blocker Bugs)
1. **Promo-kodlarning ishlash mantig'idagi nomuvofiqlik** (20% ni 20 so'm deb hisoblashi biznes uchun ham, mijoz uchun ham falokat).
2. **Mehmonxona xonalarining qulflanib qolishi** (`total_inventory` umuman ishlamayapti, bitta bron qilingan sanaga boshqa xona sotib bo'lmaydi).
3. **Demo Rejimdagi Auth Bypass** (Platforma xavfsizligini 100% buzuvchi orqa eshik).