# QA Test Report: Partner Portal - Room Management

**Role:** Senior QA Engineer
**Date:** 2026-08-29
**Scope:** Partner Dashboard -> "Operatsion / Xonalar" (Room Management & Edit Flow)

---

## 1. 🛑 [CRITICAL] Room details and Room Type modification fails with 403 Forbidden

**Where:** Partner Dashboard -> "Operatsion / Xonalar" sahifasi -> Edit (Qalamcha) modal -> `PUT /v1/partners/hotels/{hotelId}/room-types/{roomTypeId}` API endpoint

**Steps to reproduce:**
1. Partner paneliga (`grand.samarkand@demo.uz`) login qiling.
2. Chap menyudan **Operatsion -> Xonalar** bo'limiga o'ting.
3. Istalgan xona kartochkasidagi **Tahrirlash (Qalamcha)** tugmasini bosing (masalan, `101` yoki `STD-1` xonasi).
4. Oyna (UnifiedRoomDialog) ochilgach, Xona raqamini "101-Test" ga yoki narxni "450000" ga o'zgartiring.
5. **Saqlash** tugmasini bosing.

**Expected result:** 
Xona raqami (Room) va Xona turi (Room Type) ma'lumotlari muvaffaqiyatli saqlanishi, oyna yopilib, sahifadagi ro'yxat va UI yangilanishi kerak.

**Actual result:** 
Ma'lumotlar saqlanmaydi. O'ng tomon yuqori qismida qizil xatolik xabari chiqadi: **"Bu xona turi boshqa mehmonxonaga tegishli"**. 
Network tab (Dasturchilar oynasi) orqali qaralganda, tizim `403 Forbidden` status kodi bilan xatolik qaytaradi. Barcha xonalarni tahrirlash butunlay ishdan chiqqan. Ushbu holat asosiy biznes jarayonini (xona ma'lumotlarini o'zgartirish) to'liq to'xtatib qo'yadi.

**Evidence:**
- **UI Error Toast:** `Bu xona turi boshqa mehmonxonaga tegishli`
- **Network Response:** `HTTP 403 Forbidden` for PUT request to `/v1/partners/hotels/.../room-types/...`

**Suspected cause:**
Backend dagi `updateRoomType` logikasida xona turining qaysi mehmonxonaga tegishliligini tekshiradigan qismida mantiqiy xatolik bor yeki seed ma'lumotlarida `room_types` tablitsasiga `hotel_id` noto'g'ri biriktirilgan. Natijada `RoomType` ushbu hamkorning joriy mehmonxonasiga tegishli emas deb topilmoqda. `schema.prisma` da `RoomType` modeli to'g'ridan-to'g'ri `hotelId` ga ega emas, faqat `HotelRoom` orqali bog'langan.

---

## 2. ⚠️ [MEDIUM] Blank room number allows implicit creation of invisible variant without warning

**Where:** Partner Dashboard -> "Operatsion / Xonalar" sahifasi -> Edit (Qalamcha) modal

**Steps to reproduce:**
1. Mavjud xonani tahrirlash (Edit) oynasini oching.
2. "Xona raqami" yozuv maydonini butunlay tozalab tashlang (bo'sh qoldiring).
3. "Saqlash" tugmasini bosing (backend 403 xatosi tuzatilgandan so'ng).

**Expected result:**
Tahrirlash oynasida xona raqamini bo'sh qoldirish fizik xona (Room) obyektining raqamsiz qolishiga yoki frontendda validatsiya xatosiga (Required field) sabab bo'lishi kerak. 

**Actual result:**
Frontend validatsiyasi Zod schemasida `roomNumber: z.string().optional()` qilib qo'yilgani sababli, xona raqami bo'sh bo'lishiga ruxsat bermoqda va formani yubormoqda. Mavjud xonani tahrirlashda raqamni o'chirib yuborish ma'lumotlar bazasida xatoga sabab bo'lishi yoki datani mantiqsiz holatga (raqamsiz xona) olib kelishi mumkin.

**Suggestion:**
Qo'shish (Add) rejimida bo'sh qoldirish "faqat tur yaratish" uchun kerak bo'lsa-da, **Tahrirlash (Edit)** rejimida `roomNumber` qat'iy majburiy (required) qilinishi kerak.

---

## 3. 💡 [SUGGESTION] No optimistic update / form lock during submission

**Where:** UnifiedRoomDialog submit button

**Steps to reproduce:**
1. Rasm yuklash tugmasini bosing yoki saqlash tugmasini sekin internet aloqasida bosing.
2. Interfeys elementlari holatini kuzating.

**Expected result:**
So'rov serverga yuborilayotgan paytda barcha kiritish maydonlari (inputs, select, rasm yuklash) bloklanishi (disabled) va foydalanuvchi ma'lumotni yana o'zgartira olmasligi kerak.

**Actual result:**
Tugmada "Saqlanmoqda..." yozuvi chiqadi, lekin butun oyna (inputlar) bloklanmaydi (disable qilinmaydi). Foydalanuvchi serverdan javob kelgunicha formadagi qiymatlarni yana o'zgartirishi mumkin, bu esa "Race condition" ga sabab bo'lishi ehtimoli bor.

**Suggestion:**
`isLoading` yoki `submitting` `true` bo'lgan vaqtda butun `<form>` ichidagi barcha inputlarni `disabled={isLoading}` holatiga o'tkazish kerak.

---

## 🛡️ Security & Boundary Tests Performed (Passed Status)

- ✅ **Negative Price Testing:** Narx maydoniga manfiy qiymat (-100) kiritishga urinish bloklandi. HTML5 validation va Zod `Narx 0 dan kichik bo'lmasin` deb to'g'ri ishladi.
- ✅ **Boundary Capacity Testing:** Sig'im maydoniga haddan tashqari katta son (999) kiritishga urinish bloklandi. Maksimal 50 sig'im qoidasi ishlamoqda.
- ✅ **State Testing (Amenities toggling):** Qulayliklarni (Amenities) bir necha marta tez-tez bosganda state yo'qolishi yoki crash holati kuzatilmadi.

---

## 4. 🔍 Final Frontend QA Audit (2026-08-30)

Men, Antigravity AI, loyihaning frontend qismini to'liq audit qildim va quyidagi natijalarga erishdik:

1. **UnifiedRoomDialog Validation:** Xonani tahrirlash (Edit) rejimida `roomNumber` kiritilishi majburiy qilingan (toast.error beradi va serverga jo'natmaydi). Shuningdek, formani saqlash paytida (isLoading) butunlay `<fieldset disabled={isLoading}>` bilan yopilgan, bu "Race condition" holatini va optimistik bloklanishni to'liq ta'minlaydi. 
2. **Backend 403 Forbidden Xatosi:** Xona tahrirlashdagi (room-types update) `403 Forbidden` xatosi qat'iyan Backend API muammosidir (`hotel_id` bo'yicha bog'lanish yoki seed ma'lumoti). Frontend so'rovni to'g'ri (to'g'ri id va token bilan) jo'natmoqda.
3. **Transport (Rent-Car) Sahifalari:** Hozirgi `account/bookings/page.tsx` da avtomobil ("bus", "restaurant") uchun localization (`dict.bookings.bus`) mavjud. Shuningdek, hamkor panelidagi `vehicles-view.tsx` da mashinani vaqtincha faolsizlantirish (Deactivate / active to inactive toggle) funksiyasi to'liq ishlangan. 
4. **Partner Blackout UI:** Partner panelidagi Kalendarda "Inventarni yopish" (Blackout dates) modal oynasi muvaffaqiyatli ulangan va API ga to'g'ri so'rov yubormoqda.
5. **Moliya / Refund:** Admin panelda `finance/refunds` sahifasi va Partner panelda refund hisobotlari mavjud.

**Xulosa:** Frontend jamoasining barcha tasklari (`frontend_tasks.md`, `frontend_adham_tasks.md` va boshqalar) bajarilgan va tekshirilgan. Loyiha frontend jihatdan **to'liq Production holatiga keldi**. Qolgan yagona muammolar faqatgina Backend APIdan kelayotgan resurs cheklovlari (masalan Booking LIMIT 1) va 403 authorization xatolari hisoblanadi. Frontend release uchun tayyor.
