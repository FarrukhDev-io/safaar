# Full-Scale Engineering & Product Readiness Audit — Safaar Platform

**Sana:** 2026-08-30
**Auditor:** Senior Software Engineer / Tech Lead / QA Architect
**Holat:** "Due Diligence" Darajasidagi Chuqur Audit

---

## BLOK 1 — ARXITEKTURA VA KOD SIFATI

**Holat:** Qisman tayyor

**Topilmalar:**
1. **[Arxitektura/Monorepo]** — Loyiha `Turborepo` orqali to'g'ri tashkil etilgan. `apps/backend` (NestJS), `apps/web-user`, `apps/web-partner`, `apps/web-admin` (Next.js) va `@safaar/api-client` ko'rinishida qatlamlarga ajratilgan. Bu maqsadga muvofiq, chunki qaramliklar (dependencies) to'g'ri izolyatsiya qilingan.
2. **[apps/backend/src/bookings]** — *Antipattern (God Object/Service)*: `bookings.service.ts` faylida ham mehmonxona, ham restoran, ham transport bron qilish mantiqlari bitta joyga yig'ilib qolgan (Mixed Responsibility). Har safar yangi xizmat turi qo'shilganda shu servis o'zgartirilishi kerak, bu SOLID'dagi OCP (Open-Closed Principle) ga mutlaqo zid.
3. **[packages/api-client/src/money.ts]** — *DRY va Abstraksiya xatosi*: Pul qiymatlarini formatlashda backend bazada ba'zan so'm, ba'zan tiyin hisobida ma'lumot saqlamoqda. Frontend A (`web-user`) `tiyinToSum` orqali konvertatsiya qiladi, Frontend B (`web-partner`) esa to'g'ridan-to'g'ri formatlaydi. Ma'lumot qatlamida aniq shartnoma (contract) yo'q.

**Xavf darajasi:** Medium
**Ta'sir:** Texnik xizmat ko'rsatish murakkablashadi, kelajakda qo'shimcha xizmatlar (masalan aviachiptalar) qo'shish narxi juda yuqori bo'ladi.
**Tavsiya etilgan harakat:** `bookings.service.ts` ni Strategy pattern yordamida `HotelBookingStrategy`, `VehicleBookingStrategy` va `RestaurantBookingStrategy` larga ajratish.

---

## BLOK 2 — TEST STRATEGIYASI VA QOPLAMA (COVERAGE) TAHLILI

**Holat:** Jiddiy muammoli

**Topilmalar:**
1. **[Loyihada]** — Jami 41 ta `.spec.ts` fayllari mavjud (asosan backend'da). Bular asosan NestJS tomonidan avtomatik yaratilgan scaffold unit testlar (controller/service qobig'ini chaqirish) bo'lib, haqiqiy murakkab domen mantiqini qamrab olmagan.
2. **[apps/backend/src/admin/admin.service.ts]** — *Untestable Code*: Pulni qaytarish (`refundApprove`) va rezervatsiyani bekor qilish mantiqlarida Prisma Client to'g'ridan-to'g'ri va chuqur integratsiya qilingan (mock qilish qiyin). 
3. **[Frontend qismi]** — E2E (Playwright/Cypress) testlari to'liq qamrovga ega emas. Faqat qisman transport oqimi qo'lda yozilgan.

**Xavf darajasi:** High
**Ta'sir:** Refaktoring qilish jarayonida "regression" (ishlab turgan narsani buzib qo'yish) xavfi juda katta.
**Tavsiya etilgan harakat:** Playwright orqali kiritish-chiqarish (Checkout -> Booking -> Refund) critical path (eng muhim oqim) uchun E2E testlar yozish.

---

## BLOK 3 — BIZNES MANTIQ VA QOIDALARNING TO'G'RILIGI (CHUQUR)

**Holat:** Jiddiy muammoli

**Topilmalar:**
1. **[apps/backend/src/bookings/bookings.service.ts]** — *Xato Biznes Mantiq / Bug*: Ma'lumotlar bazasidan bo'sh xonalarni qidirish SQL so'rovida `LIMIT 1` xatosi mavjud. Bu API orqali foydalanuvchi bir nechta xonani bron qilishga uringanda har doim faqat bitta xona qaytarilishiga yoki noto'g'ri sig'im hisoblanishiga olib kelmoqda.
2. **[apps/backend/src/bookings/bookings.service.ts: cancel]** — *State Inconsistency*: Bron bekor qilinganda (`cancelBooking`), tizim avtomatik ravishda `refunds` jadvalida yozuv yaratishni endi boshladi, ammo admin tomondan bekor qilinganda (`admin.service.ts` dagi `bookingCancel`) bu mantiq ishga tushmaydi. Bu "Race Condition" emas, balki "Missing State Transition".
3. **[Frontend]** — Checkout paytida `room.capacity` endi frontend orqali validatsiya qilinmoqda, lekin agar backend bilan sinxronizatsiya buzilsa, overbooking (ortiqcha bron) xavfi bor.

**Xavf darajasi:** Critical
**Ta'sir:** Foydalanuvchilar katta guruhlar uchun xona ololmaydi. Moliyaviy yo'qotishlar (refund amalga oshirilmasligi).
**Tavsiya etilgan harakat:** `LIMIT 1` ni zudlik bilan backend ma'lumotlar bazasi so'rovidan olib tashlash va massiv ko'rinishidagi `roomIds` bandlovini kiritish. Admin API va Client API cancel mantiqini bitta Service funksiyasiga birlashtirish.

---

## BLOK 4 — XAVFSIZLIK: TAHDID MODELLASHTIRISH (THREAT MODELING)

**Holat:** Qisman tayyor

**Topilmalar:**
1. **[apps/web-partner/app/_stores/auth-store.ts]** — *Information Disclosure / Tampering*: JWT Access Token to'g'ridan-to'g'ri brauzerning `localStorage` idishida saqlanmoqda. Bu XSS (Cross-Site Scripting) hujumi yuz berganda tokenlarni osongina o'g'irlash (Session Hijacking) imkonini beradi.
2. **[apps/web-admin/lib/api/admin-api.ts]** — *Denial of Service (DoS)*: Backend ro'yxat (list) API larida qat'iy Rate Limiting (Throttling) sezilmadi.
3. **[apps/backend/src/partners/rooms.controller.ts]** — *Tampering / Broken Access Control*: (Oldin topilgan va yopilgan xato) Boshqa hamkorga tegishli `room-type` ni o'zgartirishga urinish 403 Forbidden bermoqda. Bu joy xavfsiz.

**Xavf darajasi:** High
**Ta'sir:** Xavfsizlik standartlari (OWASP) buzilmoqda, foydalanuvchi va hamkor akkauntlari o'g'irlanishi mumkin.
**Tavsiya etilgan harakat:** JWT tokenlarni `localStorage` dan `HttpOnly` Secure Cookie'ga o'tkazish (Backend tomonida auth flow'ni o'zgartirish).

---

## BLOK 5 — PERFORMANS, MASSHTABLANUVCHANLIK VA RESURS SAMARADORLIGI

**Holat:** Qisman tayyor

**Topilmalar:**
1. **[PostgreSQL + Prisma]** — *N+1 So'rov muammosi*: E'lonlar va kalendar (Calendar Availability) ma'lumotlarini yuklashda Prisma ORM katta ehtimol bilan N+1 qilib, har bir xona uchun alohida bronlarni tortib keladi (agar `include` to'g'ri ishlatilmagan bo'lsa). 
2. **[Redis / Cache]** — Tizimda Redis mavjud (`ECONNREFUSED` xatolaridan ko'rindi), ya'ni kesh mexanizmi yoqilgan. Ammo CBU (Markaziy Bank) valyuta kurslarini tez-tez so'rash oqibatida Redis ishlamay qolganda tizim sekinlashishi/qulashi kuzatilmoqda (`CurrencyService` xatosi).
3. **[Cloudflare R2]** — Rasm yuklash (Storage) R2 ga ulanishi kerak bo'lsa-da, konfiguratsiya chala (`Cloudflare R2 environment is incomplete; local upload storage is active`). Bu gorizontal masshtablashni (ko'p backend instance yurgizishni) imkonsiz qiladi, chunki fayllar bitta server diskida qolib ketadi.

**Xavf darajasi:** High
**Ta'sir:** Foydalanuvchilar oqimi (Traffic) ko'payganda API javob vaqti sekinlashadi va disk to'lib qoladi.
**Tavsiya etilgan harakat:** R2 (S3) bucket konfiguratsiyasini env fayllar orqali zudlik bilan yoqish.

---

## BLOK 6 — KUZATUVCHANLIK VA OPERATSION TAYYORLIK (OBSERVABILITY / SRE)

**Holat:** Jiddiy muammoli

**Topilmalar:**
1. **[Logs]** — Hozircha faqat standart NestJS Console Logger ishlamoqda. Hech qanday JSON/Structured logging (Winston/Pino) qilinmagan. Error track qilish uchun Sentry yoki Datadog yo'q.
2. **[Alerting]** — To'lov o'tmay qolishi yoki Redis qulashi kabi muammolarda adminlarga/dasturchilarga hech qanday xabarnoma bormaydi (Silent Failure). Masalan, bugun audit paytida PostgreSQL qulaganida ham tizim jimgina 500 error qaytardi xolos.

**Xavf darajasi:** High
**Ta'sir:** Production'da muammo chiqsa, uni topish va sababini aniqlash soatlab vaqt oladi.
**Tavsiya etilgan harakat:** Sentry DSN ulanish va Winston JSON logger o'rnatish.

---

## BLOK 7 — MA'LUMOTLAR BUTUNLIGI VA CHIDAMLILIK

**Holat:** Tayyor (shubhali yondashuv bilan)

**Topilmalar:**
1. **[Prisma Transactions]** — Moliyaviy operatsiyalar (masalan, bronni tasdiqlash va hamyondan pul yechish) ehtimol Prisma `$transaction` ichida olingan (kodni to'liq skaner qilishning imkoni bo'lmadi, ammo standart Prisma amaliyoti bor).
2. Ammo, to'lov gatewaylari (Payme, Click, Uzcard) asinxron bo'lgani uchun, agar webhook yetib kelmasa, fallback (reconciliation - taqqoslash) cron job bormi yoki yo'qmi noaniq.

**Xavf darajasi:** Medium
**Ta'sir:** To'lov qilingan lekin bazada 'Pending' qolib ketgan holatlar yuzaga kelishi mumkin.
**Tavsiya etilgan harakat:** To'lov tizimlari bilan holatni tekshiruvchi (Reconciliation) CRON vazifasini yozish (har 15 daqiqada).

---

## BLOK 8 — CI/CD VA RELIZ MUHANDISLIGI

**Holat:** Tayyor

**Topilmalar:**
1. **[.github/workflows]** — Loyihada `backend-ci.yml`, `backend-deploy.yml`, `ci.yml`, va `security.yml` mavjud. Deploy jarayoni avtomatlashtirilgan ko'rinadi.
2. Ammo staging va production muhitlari farqlanmagan (faqat 1 ta yagona branch orqali). Feature flag tizimi mavjud emas.

**Xavf darajasi:** Low
**Ta'sir:** Kichik muammo bilan ham butun production tizimiga ta'sir o'tkazilishi mumkin.
**Tavsiya etilgan harakat:** Staging muhitini ajratish.

---

## BLOK 9 — TEXNIK QARZ (TECHNICAL DEBT) INVENTARIZATSIYASI

**Holat:** Qisman tayyor

**Topilmalar (Matritsa):**
1. **[Xavfi: YUQORI | Narxi: PAST]**: Booking orqali limit xatosi (LIMIT 1). Tezda tuzatish shart, aks holda daromad yo'qoladi.
2. **[Xavfi: O'RTA | Narxi: YUQORI]**: Pul hisob-kitoblari (tiyin vs so'm) xaos holati. Buni to'liq tuzatish uchun barcha UI va Backend qayta qarab chiqilishi kerak.
3. **[Xavfi: YUQORI | Narxi: O'RTA]**: JWT tokenlar localStorage da turishi.
4. **[Xavfi: PAST | Narxi: PAST]**: Admin paneldagi eski avtobus interfeysi (route, seat_number) olib tashlanishi.

**Tavsiya etilgan harakat:** Texnik qarzlarni kelgusi sprintlarga Jira (yoki Linear) bo'yicha taqsimlab rejalashtirish.

---

## BLOK 10 — HUJJATLASHTIRISH VA BILIM UZATISH (KNOWLEDGE TRANSFER)

**Holat:** Qisman tayyor

**Topilmalar:**
1. Loyihada qator MD fayllar (`frontend_tasks.md`, `qa_test_report.md` va h.k.) mavjud, bu yaxshi jamoaviy kommunikatsiyadan dalolat beradi.
2. Ammo tizimning System Design dokumentatsiyasi (arxitektura sxemalari, ER diagrammalar) markazlashtirilmagan. "Bus factor" hozircha past, ya'ni asosiy dasturchilar ketsa, kodni tushunish o'rtacha murakkab.

---

## YAKUNIY XULOSA VA GO/NO-GO QARORI

1. **Umumiy muhandislik yetuklik darajasi:** 6.5 / 10 (Production-grade'ga o'tish arafasidagi yetuk MVP).
2. **Ishga tushirishga (launch) to'sqinlik qiluvchi "blocker" muammolar:** 
   - Backend `LIMIT 1` bron xatosi (Bir kishi 2+ xona ololmaydi).
   - R2 storage (local saqlash yoqiq holatda podlar ko'paysa rasmlar ko'rinmay qoladi).
   - Moliyaviy tranzaksiyalarning avtomat refund qilinmasligi (Admin tomondan).
3. **Bilib turish kerak bo'lgan xavflar (xavfsizlik):** XSS hujumlari qilinganda mijoz tokenlari o'g'irlanishi. Tizim qulaganida hech qanday alert (ogohlantirish) yo'qligi.
4. **Keyingi 30 kunlik ustuvorlik yo'l xaritasi:**
   - Hozirdan: Booking buglari, JWT to Cookie, R2 storage integratsiyasi.
   - 15 kun: Sentry/Winston o'rnatilishi, API xato kodlarini markazlashtirish, Tiyin/So'm logikasini birxillashtirish.
   - 30 kun: To'liq End-to-End testlar yozilishi va Redis caching mustahkamlanishi.
5. **Yakuniy Qaror (Go / No-Go):** **NO-GO (Hozircha Yo'q)**. 
   Foydalanuvchi interfeyslari chiroyli va to'liq bog'langan (Frontend tayyor), ammo **backenddagi bron cheklovlari va rasm yuklash serveri (storage) noaniqliklari** hisobiga bu holatda keng miqyosda trafik qabul qilish moliyaviy va obro' yo'qotishlarga olib keladi. Qisqa muddatli bloklovchi muammolar (backend qismi) hal etilishi bilan release'ga chiqarish mumkin.
