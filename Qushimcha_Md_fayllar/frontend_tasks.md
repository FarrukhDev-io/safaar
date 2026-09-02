# Safaar — Frontend Task Document

**Sana:** 2026-08-14
**Tayyorladi:** Backend/Platform muhandisi, repository'ni to'g'ridan-to'g'ri o'qib va production'da real so'rovlar bilan tekshirib
**Kontekst:** Oxirgi ikki kunda backend'da rent-a-car (transport) bron tizimi qurildi, to'liq audit qilindi va bir nechta jiddiy xato tuzatildi. Bu hujjat o'sha o'zgarishlardan kelib chiqadigan, repository'dagi HAQIQIY kod holatiga asoslangan frontend tasklarini beradi. Hech qanday task taxmin asosida yozilmagan — har biri aniq fayl/qator/backend javobi bilan tasdiqlangan.

**Git push qilish mumkin emas.** Barcha frontend o'zgarishlari local'da qilinadi, test qilinadi, keyin Vercel'ga production deploy qilinadi (git push'siz, mavjud deploy jarayoni orqali).

---

## Bugungi backend o'zgarishlari — qisqacha

1. **Yangi**: `vehicles.price_per_day` ustuni (avval umuman yo'q edi), `bookings.vehicle_id` ustuni.
2. **Yangi**: `POST /bookings/vehicle` — mashina ijarasi broni (mehmonxona bilan bir xil naqsh: sana oralig'i, guest checkout ruxsat etilgan).
3. **Yangi**: `GET /catalog/transports` endi `?check_in=&check_out=` qabul qiladi — band mashinalarni real vaqtda chiqarib tashlaydi.
4. **Yangi**: `GET/POST/PATCH /partners/bus-company`, `GET/POST/PATCH /partners/vehicles` — hamkor panel uchun to'liq CRUD.
5. **Tuzatildi**: `BookingsService.cancel()` endi to'langan bronni bekor qilganda **avtomatik** `refunds` yozuvi yaratadi (80% siyosat) — avval bu HECH QACHON bo'lmagan (hotel/restoran/transport — barchasiga tegishli).
6. **Tuzatildi**: vehicle validation (narx, o'rindiq, davlat raqami, status) — backend endi qat'iy tekshiradi, avval juda ko'p bo'shliq bor edi.
7. **Tuzatildi**: `GET /bookings/:id/lookup`-uslubidagi guest-access endi to'g'ri ishlatiladi (checkout tugagach guest mijoz o'z bronini ko'ra oladi).
8. **Tuzatildi**: `packages/api-client`dagi pul ko'rsatish xatosi (`totalSum` 100 barobar kichik ko'rsatilardi bron tasdiqlash sahifasida).

Quyida — shu o'zgarishlardan va repository'ni to'g'ridan-to'g'ri o'qishdan kelib chiqadigan real tasklar.

---

# Frontend A — Web User

**Egasi:** Frontendchi A
**Asosiy fayllar:** `apps/web-user/`

## FE-USER-001 — Regressiya: bugungi backend o'zgarishlaridan keyin hotel/restoran/transport buzilmaganini tekshirish

**Priority:** P0

**Feature:** Barcha booking oqimlari

**Muammo:** Bugun `BookingsService.cancel()`, `toBookingView()` (pul hisoblash), va guest-lookup mexanizmi o'zgardi. Bu funksiyalar hotel, restoran va transport uchun **umumiy** — hech biri type-specific emas, shuning uchun nazariy jihatdan hech narsa buzilmasligi kerak, lekin haqiqiy brauzerda tekshirilmagan (faqat transport oqimi men tomonimdan Playwright orqali tekshirilgan).

**Nima qilish kerak:**
1. Real (yoki test) hotel broni yarating, to'lang (yoki naqd), bron tasdiqlash sahifasini oching — summa to'g'ri ko'rinishini tekshiring (`toBookingView`dagi `totalSum` endi `tiyinToSum` emas, xom qiymat).
2. Hotel bronini bekor qiling — `refunds` jadvalida avtomatik yozuv paydo bo'lishini backend'dan so'rab tasdiqlang (yoki admin bilan birga tekshiring).
3. Guest (login qilmagan) holda hotel bron qiling, checkout tugagach tasdiqlash sahifasi to'g'ri ochilishini tekshiring (avval bu yiqilardi — bugun tuzatildi, lekin faqat men Playwright orqali tekshirdim, siz ham qo'lda tasdiqlang).

**Backend dependency:** Yo'q, faqat tekshirish.

**Acceptance criteria:**
- Hotel bron summasi to'g'ri (100x kichik emas)
- Hotel bron bekor qilinganda xatolik yo'q
- Guest checkout tasdiqlash sahifasi ochiladi, "Nimadir xato ketdi" ko'rinmaydi
- Restoran booking oqimi (agar mavjud bo'lsa — FE-USER-006ga qarang) ham tekshirilgan

**Files/components:**
- `apps/web-user/app/[lang]/(main)/booking/[id]/page.tsx`
- `apps/web-user/app/[lang]/(main)/booking/_components/CheckoutForm.tsx`

---

## FE-USER-002 — "Mening bronlarim" sahifasida transport bronlari "bus" degan xom matn bilan ko'rinadi

**Priority:** P1

**Feature:** Mening bronlarim (`/account/bookings`)

**Current problem:** `apps/web-user/app/[lang]/(main)/account/bookings/page.tsx`da:
```ts
const typeLabels: Record<string, string> = {
  hotel: dict.bookings.hotel,
};
```
Faqat `hotel` kaliti bor. `BookingsListLive.tsx`da:
```ts
const typeLabel = typeLabels[booking.type] ?? booking.type;
```
Transport (`booking.type === 'bus'`) yoki restoran (`'restaurant'`) broni bo'lsa, foydalanuvchi ekranda **xom `"bus"` yoki `"restaurant"` so'zini** ko'radi, tarjima qilinmagan holda.

**Nima qilish kerak:**
1. `apps/web-user/locales/{uz,ru,en}/account.json`dagi `bookings` bo'limiga `bus` va `restaurant` kalitlarini qo'shing (masalan uz: `"bus": "Mashina ijarasi"`, `"restaurant": "Restoran"` — mavjud `"hotel": "Mehmonxona"` bilan bir xil uslubda).
2. `apps/web-user/app/[lang]/(main)/account/bookings/page.tsx`dagi `typeLabels` obyektiga shu ikkalasini qo'shing.
3. Bo'sh holat xabari (`EmptyState`) hozir faqat mehmonxonaga yo'naltiradi ("Mehmonxonalarni ko'rish" → `/hotels`) — bu ham umumiyroq qilinishi kerak (masalan "Bron qilish" tugmasi bosh sahifaga yo'naltirilsin, yoki uchta tugma: mehmonxona/restoran/transport).

**Backend dependency:** Yo'q.

**Acceptance criteria:**
- Transport bron kartochkasida "Mashina ijarasi" (yoki mos so'z) ko'rinadi, "bus" emas
- Restoran bron kartochkasida "Restoran" ko'rinadi
- 3 tilda ham (`uz`/`ru`/`en`) tarjima qo'shilgan
- TypeScript error yo'q, build PASS

**Files/components:**
- `apps/web-user/app/[lang]/(main)/account/bookings/page.tsx`
- `apps/web-user/components/features/account/BookingsListLive.tsx`
- `apps/web-user/locales/uz/account.json`, `ru/account.json`, `en/account.json`

---

## FE-USER-003 — Transport checkout'da ba'zi backend xato kodlari xom holda ko'rsatiladi

**Priority:** P2

**Feature:** Transport (rent-a-car) checkout

**Current problem:** `apps/web-user/app/[lang]/(main)/booking/_components/VehicleCheckoutForm.tsx`:
```ts
const errorMessage =
  state.error === 'GUEST_DETAILS_REQUIRED' ? dict.guestDetailsRequired
    : state.error === 'VEHICLE_ALREADY_BOOKED' ? "Tanlangan sanalar uchun mashina allaqachon band qilingan"
      : state.error === 'ERROR' ? dict.error
        : state.error;
```
Backend qaytarishi mumkin bo'lgan boshqa kodlar (`VEHICLE_NOT_AVAILABLE` — mashina o'chirilgan/faol emas bo'lib qolgan, `BOOKING_DATES_INVALID`) hech qanday tarjima qilinmasdan, **xom kod sifatida** (`"VEHICLE_NOT_AVAILABLE"`) foydalanuvchiga ko'rsatiladi.

**Nima qilish kerak:**
Yuqoridagi zanjirga yana ikkita shart qo'shing:
```ts
: state.error === 'VEHICLE_NOT_AVAILABLE' ? "Bu mashina endi mavjud emas"
: state.error === 'BOOKING_DATES_INVALID' ? "Tanlangan sanalar noto'g'ri"
```
(Aniq matn — mahsulot/tarjima jamoasi bilan kelishilgan bo'lishi kerak, yuqoridagilar taklif.)

**Backend dependency:** Yo'q — bu kodlar allaqachon backend'dan qaytadi (`apps/backend/src/bookings/bookings.service.ts`dagi `createVehicleRental`).

**Acceptance criteria:**
- Har ikkala xato kodi uchun ham tushunarli, tarjima qilingan xabar ko'rinadi
- Xom `VEHICLE_NOT_AVAILABLE`/`BOOKING_DATES_INVALID` matni ekranda hech qachon ko'rinmaydi

**Files/components:**
- `apps/web-user/app/[lang]/(main)/booking/_components/VehicleCheckoutForm.tsx`

---

## FE-USER-004 — Transport sahifasida sana filtri UX: bo'sh natija holatini tekshiring

**Priority:** P2

**Feature:** Transport sahifasi (`/transport`)

**Current problem:** `apps/web-user/components/features/transport/TransportView.tsx`da sana tanlab "Mavjudlikni tekshirish" bosilganda, backend band mashinalarni chiqarib tashlaydi (`GET /catalog/transports?check_in=&check_out=`). Agar TANLANGAN sanalarda HECH BIR mashina bo'sh bo'lmasa, ro'yxat bo'sh qoladi — `EmptyState` ko'rinadi ("Ma'lumot topilmadi"), lekin bu xabar umumiy, sababi tushunarsiz (mashinalar umuman yo'qmi, yoki hammasi shu sanalarda bandmi — farqi yo'q ko'rinadi).

**Nima qilish kerak:**
Agar `checkIn`/`checkOut` tanlangan bo'lsa-yu, natija bo'sh bo'lsa — alohida, aniqroq xabar ko'rsating: "Tanlangan sanalarda bo'sh mashina yo'q. Boshqa sanalarni tanlab ko'ring." Sana tanlanmagan holatdagi umumiy "Ma'lumot topilmadi"dan farqlab bering.

**Backend dependency:** Yo'q.

**Acceptance criteria:**
- Sana tanlangan + natija bo'sh → aniq, sana-bog'liq xabar
- Sana tanlanmagan + natija bo'sh → hozirgi umumiy xabar qoladi

**Files/components:**
- `apps/web-user/components/features/transport/TransportView.tsx`

---

## FE-USER-005 — Guest mijoz o'z bronini ko'ra/bekor qila olmaydi (ma'lum cheklov, katta ish)

**Priority:** P3 (backlog, hozircha bloklamaydi)

**Feature:** Guest booking self-service

**Current problem:** `POST /bookings/:id/cancel` login talab qiladi (`@Roles(USER, PARTNER, ADMIN, SUPER_ADMIN)`). "Mening bronlarim" sahifasi ham login talab qiladi. Guest checkout qilgan mijoz (hotel yoki transport, ikkalasida ham ruxsat etilgan) faqat checkout tugagandan keyingi BITTA tasdiqlash sahifasini ko'radi — keyin o'z bronini boshqa hech qayerdan topa olmaydi, bekor qila olmaydi.

**Nima qilish kerak:** Bu — yangi backend endpoint (`booking_number`+`email` orqali guest bekor qilish, mavjud `POST /bookings/lookup` pattern'iga o'xshab) va yangi frontend sahifa talab qiladigan, alohida, kattaroq ish. Bu hujjatda faqat **backlog sifatida qayd etiladi** — hozirgi P0/P1 tasklarga bog'liq emas.

**Backend dependency:** Ha, to'liq — yangi endpoint kerak (hozir mavjud emas).

**Acceptance criteria:** N/A (backlog, hozircha implementatsiya qilinmaydi)

---

## FE-USER-006 — Restoran booking oqimi mavjudligini tasdiqlang (aniqlash kerak)

**Priority:** P2

**Feature:** Restoran checkout

**Muammo:** Backend'da restoran bron turi (`type: 'restaurant'`, vaqt-slot bilan) to'liq ishlaydi (`bookings.service.ts`dagi `createHotel()` restoran branch'i — nomiga qaramay restoran ham shu orqali o'tadi). Lekin `apps/web-user/app/[lang]/(main)/restaurants/[id]/page.tsx` mijozga stol/vaqt tanlab bron qilish imkonini berayotganini men bu sessiyada TEKSHIRMADIM (vaqt yetishmadi).

**Nima qilish kerak:**
1. `apps/web-user/app/[lang]/(main)/restaurants/[id]/page.tsx`ni oching — mijoz uchun real bron formasi bormi, tekshiring.
2. Agar bor bo'lsa — FE-USER-001 regressiyasiga qo'shib, real bron qiling va tasdiqlash sahifasi to'g'ri ishlashini tasdiqlang.
3. Agar yo'q bo'lsa (faqat katalog, bron yo'q) — buni alohida topilma sifatida mahsulot jamoasiga xabar bering, bu hujjatda vazifa sifatida yozilmaydi (chunki nima kerakligi noaniq).

**Backend dependency:** Yo'q (backend allaqachon tayyor, agar kerak bo'lsa).

**Acceptance criteria:**
- Restoran bron holati aniqlangan va hisobot berilgan

**Files/components:**
- `apps/web-user/app/[lang]/(main)/restaurants/[id]/page.tsx`

---

# Frontend B — Web Partner

**Egasi:** Frontendchi B
**Asosiy fayllar:** `apps/web-partner/`

## FE-PARTNER-001 — Regressiya: bugungi validatsiya o'zgarishlaridan keyin FleetView'ni tekshirish

**Priority:** P0

**Feature:** Transport Parki (`/rooms`, bus-turdagi hamkor uchun `FleetView`)

**Muammo:** Bugun backend `createVehicle`/`updateVehicle`ga qat'iy validatsiya qo'shildi (o'rindiqlar 1-30, narx 0-50mln, davlat raqami 4-16 belgi, status faqat active/inactive). Frontend (`fleet-view.tsx`) allaqachon shu chegaralarga mos yangilangan, lekin **haqiqiy brauzerda hali tekshirilmagan** (faqat curl orqali backend tomoni tekshirilgan).

**Nima qilish kerak:**
1. Real hamkor hisobi bilan `/rooms`ga kiring, yangi mashina qo'shing — to'g'ri qiymatlar bilan muvaffaqiyatli saqlanishini tekshiring.
2. Chegaradan tashqari qiymat kiritib ko'ring (masalan 35 o'rindiq, yoki 2 belgili davlat raqami) — frontend darhol `toast.error` bilan to'xtatishi kerak (server'ga so'rov yuborilmasdan).
3. Mavjud mashinani tahrirlashda ham xuddi shu chegaralar ishlashini tekshiring.

**Backend dependency:** Yo'q, faqat tekshirish.

**Acceptance criteria:**
- To'g'ri ma'lumot bilan mashina yaratish/tahrirlash ishlaydi
- Chegaradan tashqari qiymatlar frontendda ushlanadi, tushunarli xabar bilan

**Files/components:**
- `apps/web-partner/app/(dashboard)/rooms/fleet-view.tsx`

---

## FE-PARTNER-002 — Mashinani vaqtincha "faol emas" (ta'mirlash) qilish uchun UI yo'q

**Priority:** P2

**Feature:** Transport Parki

**Current problem:** Backend endi `PATCH /partners/vehicles/:id`da `status: 'inactive'` qiymatini qabul qiladi (bugun qo'shilgan validatsiya bilan birga — avval har qanday satr o'tar edi, endi faqat `active`/`inactive`). Lekin `fleet-view.tsx`da mashina kartochkasida yoki tahrirlash formasida **status o'zgartirish tugmasi yoki select yo'q** — hamkor mashinasini vaqtincha (masalan ta'mirlashda) sotuvdan olib qo'ya olmaydi, faqat yangi mashina qo'shish/tahrirlash (nom, narx, o'rindiq, raqam) mumkin.

**Nima qilish kerak:**
1. Har bir mashina kartochkasiga "Faolsizlantirish" / "Faollashtirish" tugmasi qo'shing (hozirgi "Faol" yorlig'i yonida yoki tahrirlash drawer'ida).
2. Bosilganda `useUpdateVehicle()` hook orqali `{ status: 'inactive' }` yoki `{ status: 'active' }` yuboring (hook allaqachon mavjud, `status` maydonini qo'llab-quvvatlaydi).
3. `inactive` mashina public Transport sahifasida ko'rinmasligini tasdiqlang (backend allaqachon `WHERE v.status='active'` bilan filtrlaydi — bu allaqachon to'g'ri ishlaydi, faqat UI kerak).

**Backend dependency:** Yo'q — endpoint va validatsiya allaqachon tayyor.

**Acceptance criteria:**
- Mashinani "faol emas" qilish mumkin, u holda public Transport sahifasida ko'rinmaydi
- Qayta "faol" qilish mumkin
- Loading/success/error holatlari bor

**Files/components:**
- `apps/web-partner/app/(dashboard)/rooms/fleet-view.tsx`
- `apps/web-partner/app/_hooks/use-fleet.ts` (`useUpdateVehicle` — o'zgarishsiz ishlatiladi)

---

## FE-PARTNER-003 — Regressiya: reservations/calendar sahifalarida vehicle-fields ko'rinishini tekshiring

**Priority:** P1

**Feature:** Bronlar va Chiptalar, Qatnovlar Jadvali (Bandlik taqvimi)

**Muammo:** Bugun `reservations-view.tsx`, `[id]/detail-view.tsx` va yangi `vehicle-availability-view.tsx` qo'shildi/o'zgardi — mashina nomi/raqamini ko'rsatish uchun. Real brauzerda men buni bir marta tekshirdim (skrinshot bilan), lekin ko'proq holatlar (masalan ko'p mashina, ko'p bron, turli status) bilan qo'shimcha tekshiruv foydali bo'lardi.

**Nima qilish kerak:**
1. Bir nechta mashina va bir nechta bron bilan `/reservations` sahifasini tekshiring — har birida mashina nomi+raqami to'g'ri ko'rinishini tasdiqlang.
2. `/calendar`da (bus-turdagi hamkor uchun `VehicleAvailabilityView`) bir nechta mashina bilan taqvim to'g'ri ko'rsatilishini tekshiring.
3. CSV eksport (`reservations-view.tsx`dagi `exportToCsv`) mashina ma'lumotini to'g'ri qo'shishini tekshiring.

**Backend dependency:** Yo'q.

**Acceptance criteria:**
- Ko'p mashina/bron holatida hech narsa buzilmaydi
- CSV eksportda mashina nomi/raqami bor

**Files/components:**
- `apps/web-partner/app/(dashboard)/reservations/reservations-view.tsx`
- `apps/web-partner/app/(dashboard)/reservations/[id]/detail-view.tsx`
- `apps/web-partner/app/(dashboard)/calendar/_components/vehicle-availability-view.tsx`

---

# Frontend B — Web Admin

**Egasi:** Frontendchi B
**Asosiy fayllar:** `apps/web-admin/`

> **Diqqat:** bu bo'limdagi topilmalar `web-partner`dagilardan farqli — bular YANGI backend o'zgarishlaridan emas, balki **avvaldan mavjud, tekshirilmagan bo'shliqlar**, bugungi audit paytida topildi. Ba'zilari CRITICAL darajada (admin noto'g'ri ma'lumot ko'radi yoki noto'g'ri "muvaffaqiyat" signalini oladi).

## FE-ADMIN-001 — "Refund" tugmasi to'liq soxta — hech qanday backend so'rovini yubormaydi

**Priority:** **P0 — CRITICAL**

**Feature:** Bron tafsiloti sahifasi, To'lovni qaytarish

**Current problem:** `apps/web-admin/app/(dashboard)/bookings/[id]/page.tsx`:
```ts
const handleRefund = () => {
  if (confirm(`${formatPrice(booking.totalAmount)} miqdorida to'lovni qaytarmoqchimisiz?`)) {
    toast.success("To'lov qaytarildi (refund)!");
  }
};
```
Bu funksiya **hech qanday API chaqirmaydi**. Admin tasdiqlaydi, "muvaffaqiyatli" xabarini ko'radi — lekin haqiqatda hech narsa sodir bo'lmaydi: `refunds` jadvalida yozuv yo'q, to'lov holati o'zgarmaydi, mijozga pul qaytmaydi. Bu — admin uchun **yolg'on signal**, real pul operatsiyasida juda xavfli.

Backend'da esa **to'liq, ishlaydigan** refund-tasdiqlash endpointlari bor va hech qayerga ulanmagan:
```
GET  /admin/refunds/:id
POST /admin/refunds/:id/approve
POST /admin/refunds/:id/reject
POST /admin/refunds/:id/retry
```
(`apps/backend/src/admin/admin.controller.ts:344-374`, `admin.service.ts`dagi `refundApprove`/`refundReject`/`refundRetry`).

**Nima qilish kerak:**
1. `apps/web-admin/lib/api/admin-api.ts`ga real funksiyalar qo'shing: `getRefund(id)`, `approveRefund(id, body)`, `rejectRefund(id)`, `retryRefund(id)` — yuqoridagi endpointlarga mos.
2. `handleRefund()`ni real refund-so'rov ID'sini olib (agar bron bo'yicha mavjud refund bo'lsa — `bookingsga tegishli refund borligini avval tekshirish kerak, FE-ADMIN-002ga qarang), `approveRefund()`ni chaqiradigan qilib qayta yozing.
3. Agar bron bo'yicha HALI refund so'rovi yo'q bo'lsa (masalan admin o'zi qo'lda qaytarish qarorini qilsa, mijoz hali so'ramagan bo'lsa) — bu holat uchun alohida oqim kerakligini aniqlang (backend'da refund yaratish uchun avval `refunds` yozuvi bo'lishi shart, `booking_id` orqali).

**Backend dependency:** Yo'q — endpointlar tayyor, faqat ulash kerak.

**Acceptance criteria:**
- "Refund" tugmasi bosilganda REAL `POST /admin/refunds/:id/approve` so'rovi ketadi
- Muvaffaqiyatli bo'lganda `refunds.status` bazada haqiqatan `approved` bo'ladi (backend orqali tasdiqlang)
- Xato holatida (masalan refund allaqachon ko'rib chiqilgan) tushunarli xato ko'rsatiladi, soxta "muvaffaqiyat" YO'Q

**Files/components:**
- `apps/web-admin/app/(dashboard)/bookings/[id]/page.tsx`
- `apps/web-admin/lib/api/admin-api.ts`

---

## FE-ADMIN-002 — Refund so'rovlari uchun umuman ro'yxat/navbat sahifasi yo'q

**Priority:** **P0**

**Feature:** Moliya / Qaytarishlar

**Current problem:** `apps/web-admin/app/(dashboard)/finance/`da faqat `overview/`, `reports/`, `withdrawals/` bor — **`refunds/` yo'q**. Bugungi backend tuzatishi (`BookingsService.cancel()`) natijasida, mijoz to'langan bronni bekor qilganda endi **avtomatik** `refunds` jadvaliga `status='requested'` yozuv tushadi. Bu yozuvlar hozir **hech qayerda ko'rinmaydi** — admin ularni bilishning umuman yo'li yo'q, `POST /admin/refunds/:id/approve` chaqirish uchun avval qaysi `id`larni ko'rib chiqish kerakligini bilish kerak.

`apps/web-admin/lib/store`da (Zustand) `withdrawals` bor (`finance/withdrawals`ga mos), lekin `refunds` yo'q.

**Nima qilish kerak:**
1. Backend'da refund-ro'yxat endpointi bormi tekshiring (`admin.controller.ts`da `GET /admin/refunds` — RO'YXAT, `:id` emas — mavjudligini tasdiqlang; agar yo'q bo'lsa, bu backend dependency sifatida qayd eting).
2. `apps/web-admin/app/(dashboard)/finance/refunds/page.tsx` (yangi) yarating — `withdrawals/page.tsx`ni namuna sifatida oling (bir xil `DataTable`/`Pagination`/status-filter naqshi).
3. Har bir qatorda: bron ID, mijoz, summa (`requested_amount`), sabab, holat (`requested`/`approved`/`rejected`), "Tasdiqlash"/"Rad etish" tugmalari (FE-ADMIN-001dagi real API funksiyalarini ishlatib).
4. Navigatsiya menyusiga ("Moliya" ostida) yangi bo'lim qo'shing.

**Backend dependency:** **Ha, tekshirish kerak** — refund-ro'yxat (`GET /admin/refunds`, filtrlash bilan) endpointi mavjudligini tasdiqlang. Agar yo'q bo'lsa, backend jamoasiga so'rov yuboring (`admin.service.ts`da hozircha faqat bitta-refund (`GET /admin/refunds/:id`) ko'rinadi, ro'yxat yo'q bo'lishi mumkin).

**Acceptance criteria:**
- Barcha `requested` holatidagi refundlar ro'yxatda ko'rinadi
- Admin tasdiqlash/rad etish qila oladi, natija bazada aks etadi
- Bo'sh holat, loading, xato holatlari bor

**Files/components:**
- `apps/web-admin/app/(dashboard)/finance/refunds/page.tsx` (yangi)
- `apps/web-admin/lib/api/admin-api.ts`
- `apps/web-admin/lib/store` (yangi `refunds` state, `withdrawals` namunasida)
- `apps/web-admin/lib/constants.ts` (navigatsiya)

---

## FE-ADMIN-003 — "Ijara bronlari" (Transport) sahifasi mavjud bo'lmagan maydonlarni ko'rsatishga urinadi — bo'sh ma'lumot

**Priority:** **P1** (P0 emas, chunki sahifa yiqilmaydi — faqat bo'sh ustunlar ko'rsatadi)

**Feature:** Bronlar → Transport (`/bookings/buses`)

**Current problem:** `apps/web-admin/app/(dashboard)/bookings/buses/page.tsx` — ustunlar: **Kompaniya, Jo'nash (sana+vaqt), O'rindiq** — bular eski intercity-avtobus-chipta modelidan (`route`, `departureDate`, `departureTime`, `seatNumber`). Bugungi (va aslida hech qachon to'liq ishlamagan) rent-a-car booking'da bu maydonlar **umuman mavjud emas**.

Root cause — `apps/web-admin/lib/api/admin-api.ts`:
```ts
function toBusBooking(row: ApiRecord): AdminBusBooking {
  return {
    ...
    companyName: asString(row.company_name),   // backend hech qachon bermaydi
    route: asString(row.route),                  // backend hech qachon bermaydi
    departureDate: asString(row.departure_date),  // backend hech qachon bermaydi
    departureTime: asString(row.departure_time),  // backend hech qachon bermaydi
    seatNumber: asString(row.seat_number),        // backend hech qachon bermaydi
    ...
  };
}
```
Backend (`apps/backend/src/admin/admin.service.ts`dagi `dbBookingsSql()`) `b.price_snapshot ->> 'route'` va `b.price_snapshot ->> 'companyName'`ni o'qiydi — lekin **hech qanday bron yaratish kodi** (na eski `createBus()`, na yangi `createVehicleRental()`) `price_snapshot`ga `route`/`companyName` yozmaydi. Bu ustunlar har doim bo'sh bo'ladi.

Haqiqatda mavjud va foydali bo'lgan ma'lumot: `check_in`/`check_out` (`item.check_in`/`item.check_out` orqali — bular ISHLAYDI, chunki `createVehicleRental`ning `price_snapshot`sida `check_in`/`check_out` kalitlar bor).

**Nima qilish kerak (frontend qismi, hozir qilsa bo'ladigan):**
1. Ustunlarni qayta nomlang/almashtiring: "Jo'nash sanasi/vaqti" → "Olib ketish sanasi" (`item.check_in`), yangi ustun "Qaytarish sanasi" (`item.check_out`).
2. "O'rindiq" ustunini olib tashlang (rent-a-car'da ma'nosi yo'q).
3. `AdminBusBooking` TypeScript interfeysini yangilang — `route`/`departureTime`/`seatNumber`ni olib tashlang, `checkIn`/`checkOut` qo'shing.

**Nima kerak (backend dependency, blokланган):**
- Mashina nomi/davlat raqami hozir **hech qayerda** ko'rsatilmaydi (backend javobida yo'q) — bu ko'rsatilishi uchun `admin.service.ts`dagi `dbBookingsSql()`ga `vehicles`/`bus_companies` JOIN qo'shilishi kerak (xuddi men bugun `apps/backend/src/partners/partners.service.ts`dagi `bookings()`ga qilganimdek — o'sha kodni namuna sifatida ishlatish mumkin). **Bu backend o'zgarishi, frontendchi o'zi qila olmaydi** — backend jamoasidan so'rang.

**Backend dependency:** **Ha, qisman** — sana maydonlari uchun yo'q (frontend hozir tuzata oladi), lekin mashina nomi/raqami ko'rsatish uchun ha.

**Acceptance criteria:**
- Sahifada endi bo'sh/noto'g'ri "Kompaniya"/"O'rindiq" ustunlari yo'q
- Olib ketish/qaytarish sanalari to'g'ri ko'rinadi
- (Backend tuzatilgandan keyin) mashina nomi/raqami ko'rinadi

**Files/components:**
- `apps/web-admin/app/(dashboard)/bookings/buses/page.tsx`
- `apps/web-admin/lib/api/admin-api.ts` (`toBusBooking`, `AdminBusBooking`)
- `apps/web-admin/types/admin.ts`

---

## FE-ADMIN-004 — Admin bronni bekor qilganda ham refund yaratilmaydi (backend gap, frontend uchun izoh)

**Priority:** P2 (backend ishi, frontend faqat kutadi)

**Feature:** Bron tafsiloti — "Bekor qilish"

**Muammo:** `apps/web-admin/app/(dashboard)/bookings/[id]/page.tsx`dagi `handleCancel()` REAL `AdminApi.cancelBooking(id)`ni chaqiradi (bu qism to'g'ri, soxta emas) — lekin bu backend'dagi `admin.service.ts`'s `bookingCancel()`ga boradi, u ham (xuddi bugun men tuzatgan mijoz-tomon `cancel()` kabi) **refund yaratmaydi**.

**Nima qilish kerak:** Bu — backend fix (`admin.service.ts`dagi `bookingCancel()`ga xuddi shu avtomatik-refund logikasini qo'shish, `BookingsService.cancel()`da bugun qilingan pattern bilan). Frontendchi uchun task emas — faqat **backend jamoasiga xabar** sifatida qayd etiladi, FE-ADMIN-001/002 tugagandan keyin bu ham dolzarb bo'ladi (chunki admin cancel qilgan bronlar uchun ham refund navbatida ko'rinishi kerak bo'ladi).

**Backend dependency:** Ha, to'liq.

**Files/components:** (ma'lumot uchun) `apps/backend/src/admin/admin.service.ts` — `bookingCancel()`

---

## FE-ADMIN-005 — Regressiya: partner turi/label'lar allaqachon to'g'ri — faqat tasdiqlash

**Priority:** P2

**Feature:** Hamkor arizalari, Hamkorlar ro'yxati

**Muammo:** Tekshiruv shuni ko'rsatdiki, `PartnerTypeDisplay` komponenti (`apps/web-admin/components/ui/PartnerTypeDisplay.tsx`) va `partners/list/page.tsx` allaqachon `bus` turini **to'g'ri** "Mashina ijarasi" deb ko'rsatadi — bu YAXSHI, o'zgartirish shart emas. Bu yerda faqat **tasdiqlash** kerak: hamkor arizasini ko'rib chiqish/tasdiqlash oqimini (`/partners/requests`) real `type='bus'` ariza bilan bir marta qo'lda tekshiring, hech qayerda "Avtobus" yoki chalkash so'z chiqmasligiga ishonch hosil qiling.

**Backend dependency:** Yo'q.

**Acceptance criteria:**
- `/partners/requests`, `/partners/list`, `/partners/[id]` sahifalarida `bus` turi hamma joyda "Mashina ijarasi" deb ko'rinadi

**Files/components:**
- `apps/web-admin/app/(dashboard)/partners/requests/page.tsx`
- `apps/web-admin/app/(dashboard)/partners/list/page.tsx`
- `apps/web-admin/app/(dashboard)/partners/[id]/page.tsx`

---

# Shared / Cross-Frontend

Bu tasklar ikkala frontendchiga ham tegishli bo'lishi mumkin bo'lgan, lekin BITTA marta hal qilinishi kerak bo'lgan narsalar. **Kim qilishini oldindan kelishib oling — ikki marta qilinmasin.**

## SHARED-001 — Backend xato kodlari uchun markazlashgan xabar-xaritasi yo'q

**Priority:** P2

**Muammo:** Hozir har bir forma (`CheckoutForm.tsx`, `VehicleCheckoutForm.tsx`, `fleet-view.tsx`) o'z ichida alohida-alohida `error.code === 'X' ? "..." : ...` zanjiri yozadi. Bu takrorlanish va nomuvofiqlikka olib keladi (masalan `VEHICLE_ALREADY_BOOKED` faqat bitta joyda tarjima qilingan).

**Tavsiya:** `packages/api-client` yoki har bir ilovaning `lib/`ida umumiy `mapBookingErrorCode(code: string, locale): string` funksiyasi yarating, barcha ma'lum kodlarni (`VEHICLE_ALREADY_BOOKED`, `ROOM_ALREADY_BOOKED`, `TABLE_ALREADY_BOOKED`, `VEHICLE_NOT_AVAILABLE`, `BOOKING_DATES_INVALID`, `GUEST_DETAILS_REQUIRED`, `PROMO_INVALID`, `PROMO_LIMIT_REACHED`) bitta joyda saqlang. **Faqat web-user uchun** dolzarb (web-partner/admin o'z xatolarini backend `.message`dan to'g'ridan-to'g'ri oladi, bu allaqachon inson-o'qiy oladigan matn).

**Kim qiladi:** Frontendchi A (web-user egasi) — chunki bu faqat web-userga tegishli xatolar uchun.

---

## SHARED-002 — `@safaar/api-client`dagi `TransportCatalogView`/`BookingView` tiplari — ikkala frontend ham bir xil paketdan foydalanadi

**Priority:** Ma'lumot uchun (task emas)

**Izoh:** `packages/api-client` — ikkala frontend ham (`web-user` to'g'ridan-to'g'ri, `web-partner` esa o'zining `_lib/api/`si orqali, alohida) backend bilan gaplashadi. Agar kelajakda `TransportCatalogView`/`BookingView` kabi umumiy tiplarga o'zgartirish kerak bo'lsa — ikkala frontendchi ham xabardor bo'lishi kerak, chunki `packages/api-client`dagi o'zgarish ikkalasiga ham ta'sir qiladi (`web-partner`ga bevosita emas — u alohida `_lib/api/endpoints/partners.ts` fayliga ega, lekin `web-user` to'g'ridan-to'g'ri `@safaar/api-client`dan import qiladi).

---

## SHARED-003 — Money/pul formatlash: ikkita alohida, mos KELMAYDIGAN funksiya bor

**Priority:** P2 (ma'lumot + kelajakdagi xato oldini olish)

**Muammo:** `web-user` — `packages/api-client/src/money.ts`dagi `tiyinToSum()`/`formatSum()` ishlatadi (bugungi audit shuni ko'rsatdiki, `booking.total_amount` va `vehicles.price_per_day` kabi maydonlar aslida **so'mda** saqlanadi, tiyin emas — shuning uchun `tiyinToSum` faqat ba'zi joylarda to'g'ri, ba'zilarida noto'g'ri edi, bugun `totalSum`/`pricePerDaySum` tuzatildi, lekin `minPriceSum`/`priceSum` (hotel qidiruv/xona narxlari), `bonusBalanceSum`, `balanceSum`, `amountSum` (refund) hali ham eski `tiyinToSum` ishlatadi — **tekshirilmagan, ehtimol xuddi shunday 100x xato bor**).

`web-partner` — `apps/web-partner/app/_lib/utils/format.ts`dagi `formatMoney()` ishlatadi, hech qanday tiyin-konversiya QILMAYDI (to'g'ridan-to'g'ri raqam) — bu ekspluatatsiyada TO'G'RI ekanligi bugun tasdiqlandi (hamkor panelida narxlar to'g'ri ko'rinadi).

**Tavsiya (P1 darajasida, alohida audit sifatida, bu hujjat doirasidan tashqari lekin JUDA MUHIM):** Frontendchi A `packages/api-client/src/adapters.ts`dagi qolgan `tiyinToSum()` chaqiruvlarini (`minPriceSum`, `priceSum`, `bonusBalanceSum`, `balanceSum`, `amountSum`) real production ma'lumoti bilan tekshirsin — agar ular ham "so'm, tiyin emas" bo'lsa, xuddi bugungi `totalSum` fix'i kabi tuzatilishi kerak. Bu **mehmonxona qidiruv natijalarida narx ko'rsatish** kabi juda ko'rinadigan joylarga ta'sir qiladi.

**Kim qiladi:** Frontendchi A, alohida P1 vazifasi sifatida rejalashtirilsin (bu hujjatga FE-USER task sifatida kiritilmadi, chunki tekshirilmagan — lekin ALOHIDA ta'kidlanadi, chunki ehtimoli katta va ta'siri katta).

---

# Testing / QA

Har bir task uchun **minimal** talab:

1. `npx tsc --noEmit` — TypeScript xatosi yo'q
2. `npm run build` (tegishli ilova papkasida) — build PASS
3. Real brauzerda (yoki hech bo'lmasa real API bilan) qo'lda tekshirish — faqat kod o'qib "ishlaydi" deb hisoblamang
4. Agar backend xato kodi bilan bog'liq bo'lsa — real xato holatini keltirib chiqarib (masalan band mashinani band qilishga urinib), xabar to'g'ri ko'rinishini tasdiqlang

**Muhim:** Agar test uchun real hamkor/mijoz hisobi yoki test ma'lumoti yaratsangiz — ishni tugatgach albatta **production'dan tozalang** (test bron/mashina/hamkor tashkilotini o'chiring).

---

# Deployment Notes

1. Barcha o'zgarishlar **local'da** build+typecheck qilinadi
2. **`git push` QILISH MUMKIN EMAS** — hech qanday holatda, hech qaysi branch'ga
3. `git commit` mumkin (agar kerak bo'lsa), lekin push YO'Q
4. Production deploy — Vercel orqali (mavjud jarayon: `vercel --prod`), git push orqali EMAS
5. Deploy'dan keyin production'da smoke-test qiling (asosiy oqimni real brauzerda bir marta bosib ko'ring)

---

# Summary

## Frontend A — Web User
- **Jami tasklar:** 6 (FE-USER-001 dan 006 gacha)
- **P0:** 1
- **P1:** 0
- **P2:** 4
- **P3:** 1
- **Asosiy maqsad:** Bugungi backend o'zgarishlaridan (refund avtomatizatsiyasi, pul ko'rsatish tuzatishi, guest checkout tuzatishi) keyin regressiya yo'qligini tasdiqlash, "Mening bronlarim"da transport/restoran to'g'ri ko'rinishini ta'minlash, xato xabarlarini to'ldirish.

## Frontend B — Web Partner
- **Jami tasklar:** 3 (FE-PARTNER-001 dan 003 gacha)
- **P0:** 1
- **P1:** 1
- **P2:** 1
- **Asosiy maqsad:** Bugungi vehicle-validatsiya va vehicle-aware UI o'zgarishlarini real brauzerda tasdiqlash, mashina statusini boshqarish uchun UI qo'shish.

## Frontend B — Web Admin
- **Jami tasklar:** 5 (FE-ADMIN-001 dan 005 gacha)
- **P0:** 2 (biri **CRITICAL** — soxta refund tugmasi)
- **P1:** 1
- **P2:** 2
- **Asosiy maqsad:** Bu ilova eng ko'p e'tibor talab qiladi — refund workflow'i butunlay ishlamaydi (UI soxta + sahifa yo'q), transport bron ro'yxati noto'g'ri maydonlarni ko'rsatadi. Bular bugungi o'zgarishlardan EMAS, balki avvaldan mavjud, hozir topilgan bo'shliqlar.

## Shared
- 3 ta shared topilma (xato-xabar markazlashtirish, tip-paket ogohlantirish, **eng muhimi — pul formatlash xatosi ehtimoli boshqa joylarda ham bor**)

## Recommended Execution Order

1. **FE-ADMIN-001** (CRITICAL — soxta refund tugmasi, admin xato qaror qabul qilishi mumkin)
2. **FE-USER-001** va **FE-PARTNER-001** (regressiya — parallel qilish mumkin, ikkala frontendchi bir vaqtda)
3. **FE-ADMIN-002** (refund navbati sahifasi — 001dan keyin mantiqiy, chunki backend ulanishi bir xil)
4. **FE-USER-002**, **FE-ADMIN-003** (ko'rinadigan, mijoz/admin darhol duch keladigan UX muammolari)
5. **SHARED-003**ni Frontendchi A alohida P1 sifatida rejalashtirsin (pul formatlash — katta ta'sir doirasi ehtimoli)
6. Qolgan P2/P3 tasklar — jamoaviy navbat asosida
