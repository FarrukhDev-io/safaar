# Backend Biznes Mantiq (Business Logic) QA Hisoboti

**Tekshirilgan mantiqiy modullar ro'yxati:**
- Bron qilish tizimi va xonalar qulfi (Booking & Locking logic)
- Promo-kod chegirmalarini hisoblash (Discount calculation logic)
- Avtomatik bekor qilish va tozalash tizimi (Cron jobs & Stale bookings)
- Inventarlarni sanalar bo'yicha boshqarish (Inventory & Dates overlap)

---

## Topilgan mantiqiy nomuvofiqliklar

### [Kritik] Mehmonxona va Restoran band qilinishida `total_inventory` e'tiborsiz qoldirilgan (`LIMIT 1` xatosi)

**Fayl/funksiya:** `apps/backend/src/bookings/bookings.service.ts` (352-371 qatorlar)  
**Kutilgan mantiq:** Agar ma'lum bir xona turida (Room Type) jami 10 ta xona (`total_inventory = 10`) bo'lsa, mijozlar shu xonadan 10 tasigacha bir xil sanalarda bron qila olishlari kerak.
**Amaldagi mantiq (kodda):**
```sql
SELECT id FROM bookings
WHERE room_id = $1::uuid
  AND status NOT IN ($2, $3, $4)
  AND check_in < $5::date
  AND $6::date < check_out
LIMIT 1
```
**Nima uchun bu muammo:** Tizim xona bo'sh yoki yo'qligini tekshirish uchun barcha yaroqli bronlar ro'yxatini olib kelganda uni `LIMIT 1` ga qisqartiradi. Ya'ni, agar 1 kishi bitta xonani bron qilsa, qolgan 9 ta xona ham band deb hisoblanadi va keyingi mijozlarga `ConflictException` (Xona allaqachon band qilingan) xatoligi qaytadi. Bu biznes uchun katta moliyaviy yo'qotish.
**Qanday tekshirib ko'rish mumkin:** `total_inventory` 5 qilib belgilangan xonani 2 xil foydalanuvchi bir xil kunga (yoki o'zi bitta so'rovda 2 ta xona qilib) bron qilishga urinsin. Ikkinchisi xato beradi.
**Tavsiya:** Kesishuvchi bronlardagi umumiy band qilingan xonalar sonini `SUM(rooms)` orqali yig'indisini hisoblash va uni haqiqiy `total_inventory` bilan solishtirish (yoki eng yaxshisi to'g'ridan to'g'ri `room_inventory` jadvaliga tayanib ishlash).

---

### [O'rtacha] Avtomobil ijarasi (Vehicle) uchun soat (Time) inobatga olinmagan kunlik blokirovka

**Fayl/funksiya:** `apps/backend/src/bookings/bookings.service.ts` (`createVehicleRental` 543-550 qatorlar)  
**Kutilgan mantiq:** Avtomobilni bir kunning o'zida ikkita turli shaxs (masalan, biri 08:00 - 12:00, ikkinchisi 14:00 - 18:00) ijaraga olish imkoniyati, yoki hech bo'lmaganda mashinani tozalab tayyorlash uchun mijozlar o'rtasida "bufer" vaqtlari bo'lishi kerak.
**Amaldagi mantiq (kodda):**
```sql
AND check_in < $5::date
AND $6::date < check_out
LIMIT 1
```
**Nima uchun bu muammo:** Mashina faqat kun (Date) chegarasi bilan tekshiriladi, soat va vaqt zonalari hisobga olinmagan. Mijoz soat 23:55 da mashinani topshirishi kerak bo'lsa, tizim buni xuddi to'liq kun kabi qabul qilishi va boshqa odamga ertasiga xohlagan vaqtda ijaraga berib yuborishi (yoki butunlay bloklab qo'yishi) mumkin. Bunga aniq soatlar (Time) yozilmaganligi sabab bo'lmoqda.
**Qanday tekshirib ko'rish mumkin:** Kun davomida qisqa (yarim kunlik) ijaralar yozishga urinib ko'rish.
**Tavsiya:** Mashina ijarasida sana qatoriga albatta vaqt (soat/daqiqa) kiritilishi, va navbatdagi ijara oralig'ida (kamida 1-2 soat) avtomatik bufer tayyorlanishi kerak.

---

### [O'rtacha] Avtomatik bekor qilingan bronlar (Cron Job) kesh va room_inventory jadvalini tozalamaydi

**Fayl/funksiya:** `apps/backend/src/bookings/bookings.service.ts` (`expireStaleBookings` 109-200 qatorlar)  
**Kutilgan mantiq:** Muddati tugagan va to'lov qilinmagan bronlar avtomatik `expired` qilinganda, ular tomonidan zaxiralangan (hold) qilingan barcha inventarlar darhol ochiq (available) holatiga qaytarilishi kerak.
**Amaldagi mantiq (kodda):**
```sql
UPDATE trip_seats
SET status = 'available', held_by_booking_id = NULL, held_until = NULL
WHERE held_by_booking_id = ANY($1::uuid[])
```
**Nima uchun bu muammo:** Tizimda avtobus o'rindiqlari (`trip_seats`) to'g'ri tozalanmoqda. Ammo tizimda `room_inventory` (xonalarni kunlik hisobga oluvchi) jadvali ham mavjud (Partner moduli shundan foydalanmoqda). Muddati o'tgan mehmonxona bronlari faqatgina statusi o'zgarib qolib ketaveradi. Agar kelajakda (yoki qaysidir boshqa funksiyada) `room_inventory` orqali bo'sh xonalar tekshirilsa, eski bekor qilingan bronlar xonani band ko'rsatib osilib qoladi.
**Tavsiya:** Yechim sifatida, `expired` qilingan mehmonxona bronlari uchun ham `room_inventory` jadvalidagi `booked_count` (yoki `held_count`) sonini orqaga qaytarish logikasini shu Cron Job ga qo'shish kerak.

---

## Aniqlashtirish talab qilinadigan joylar (Noaniqliklar)

1. **Chegirmalar nolga yoki manfiy qiymatga tushib ketsa:** Promo-kod funksiyasi chegirma natijasini 0 va umumiy summa (`subtotal`) oralig'ida ushlab turadi (`Math.max(0, ...)`). Biroq, foydalanuvchining **Bonus balansi** bilan birgalikda qo'llanganda (ikkita chegirma ketma-ket kelsa), yakuniy summa $0 dan tushib ketishi holati qanday ishlanishi batafsil biznes talablarda yozilmagan.
2. **Kupon limitlari parallel so'rovlarda (race-condition):** Postgres tranzaksiyasi ichida promo-kodning `used_count` qiymati yangilanmoqda, ammo yuzlab parallel so'rovlar ayni bir sekundda kelsa (masalan yirik chegirmalar aksiyasi paytida) `metadata` obyekti qulfga olinmagani uchun qanday munosabat bildirishi noaniq. Optimistic locking qo'shilishi kerak bo'lishi mumkin.

---

## Eng xavfli mantiqiy zaiflik (Xulosa)

Agar bular tuzatilmasa, Production muhitida yuzaga keladigan eng og'ir holat — bu **`LIMIT 1` xatosi tufayli kelib chiqadigan "Soxta Sold-out" holatidir.** Bitta mehmonxonada 50 ta Standard xona bo'lishiga qaramay, dastur u yerda bor-yo'g'i 1 ta xonani sota oladi xolos! Mijozlar "Bo'sh joy yo'q" xabarini olib, pul to'lamasdan boshqa raqobatchilarga o'tib ketishadi. 
Ushbu mantiqiy xato tizim uchun eng katta va jiddiy moliyaviy ziyon hisoblanadi. Uni tezlikda to'g'irlashimiz kerak.
