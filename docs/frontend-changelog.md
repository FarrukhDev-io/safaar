# Frontend Changelog (web-user)

Ushbu fayl faqat `apps/web-user` frontendidagi o'zgarishlarni hujjatlashtiradi.
Har bir frontend task tugagach yangi entry tepaga qo'shiladi — eski entrylar
o'chirilmaydi yoki o'zgartirilmaydi.

---

# 2026-08-27 — Facebook OAuth — Google bilan bir xil login-or-registration audit va matn tuzatishi

## Nima o'zgardi
Facebook orqali kirish/ro'yxatdan o'tish Google OAuth bilan bir xil
"login-or-registration" flow'ga mos ekanligi to'liq audit qilindi.
**Auditda aniqlandiki, backend va frontend logikasi allaqachon to'liq
provider-agnostic edi** (Google ishi paytida shared/umumiy funksiyalar
sifatida yozilgan) — Facebook uchun yangi endpoint, yangi component yoki
duplicate logika yozishga hojat bo'lmadi.

Audit paytida topilgan yagona real kamchilik: ro'yxatdan o'tish
sahifasidagi bir nechta xabar matni (subtitle, xato xabarlari) doim
"Google orqali..." deb qattiq yozilgan edi — Facebook orqali kelgan
foydalanuvchi ham xuddi shu (noto'g'ri) "Google" so'zini ko'rar edi. Bu
matnlar endi provayderga bog'liq bo'lmagan (generic) qilib to'g'irlandi.

## Nima uchun
Facebook login Google bilan bir xil professional va xavfsiz darajada
ishlashi kerak edi. Audit shuni ko'rsatdiki, bu allaqachon shunday —
faqat foydalanuvchiga ko'rinadigan matnlarda provayder nomi noto'g'ri
qattiq yozilgan joylar bor edi.

## O'zgargan fayllar
- `apps/web-user/locales/{uz,ru,en}/auth.json` — 4 ta kalit
  (`socialRegisterSubtitle`, `socialAccountNotRegistered`,
  `socialLoginError`, `socialRegistrationExpired`) "Google" so'zisiz,
  har qanday ijtimoiy provayder uchun to'g'ri bo'ladigan matnga
  o'zgartirildi. Masalan (uz): "Google orqali kirish uchun telefon
  raqamingizni tasdiqlang." → "Kirishni yakunlash uchun telefon
  raqamingizni tasdiqlang."
- `apps/backend/src/auth/auth.service.spec.ts` — Facebook uchun 12 ta
  yangi test qo'shildi (mavjud Google testlari bilan bir xil uslubda):
  state-bound redirect, mavjud faol Facebook user → instant login, yangi
  Facebook identity → registration (xato emas), to'liq registration
  (telefon+OTP → user yaratish → link → session, password_hash
  tegilmaydi), ikkinchi login instant, nofaol linked user →
  USER_NOT_ACTIVE, provider_user_id duplicate → OAUTH_ACCOUNT_ALREADY_LINKED,
  eskirgan/yaroqsiz registration token → 401, xato OTP token'ni
  "yemaydi", Facebook javobida email yo'q → OAUTH_EMAIL_REQUIRED (xavfsiz
  rad etish), Facebook email har doim tasdiqlangan deb hisoblanishi
  (Google'ning verified-email siyosatiga mos).

## Kod o'zgarmagan (auditda tasdiqlangan, kodga tegilmadi)
- `apps/backend/src/auth/auth.controller.ts` — `startOAuth`/`finishOAuth`
  allaqachon `provider: 'google'|'facebook'` orqali umumiy.
- `apps/backend/src/auth/auth.service.ts` — `oauthCallback`,
  `oauthExchange`, `completeOAuthRegistration`, `upsertOAuthUser`,
  `fetchOAuthProfile` — barchasi provider-parametrlangan, Facebook uchun
  alohida yozilishi shart emas edi.
- `apps/web-user/app/[lang]/(auth)/_components/LoginForm.tsx` — Facebook
  tugmasi (`/auth/facebook?...`) allaqachon mavjud va Google bilan bir xil
  pattern.
- `apps/web-user/app/[lang]/(auth)/_components/RegisterForm.tsx` —
  `socialProvider`/`oauthProvider` allaqachon umumiy string sifatida
  o'qiladi, "google"ga qattiq bog'lanmagan.
- `apps/web-user/app/[lang]/(auth)/auth/social-callback/route.ts` —
  `result.provider`ni backend qanday qaytarsa, o'shani ishlatadi.
- `apps/backend/src/config/env.validation.ts` — `FACEBOOK_APP_ID`,
  `FACEBOOK_APP_SECRET`, `FACEBOOK_CALLBACK_URL` allaqachon deklaratsiya
  qilingan va validatsiyadan o'tadi.
- `prisma/schema.prisma` / `user_social_accounts` jadvali — `provider`
  ustuni erkin VARCHAR(32), `UNIQUE(provider, provider_user_id)` va
  `UNIQUE(user_id, provider)` constraintlari allaqachon Facebook uchun
  ham to'g'ri ishlaydi — **migration kerak bo'lmadi**.

## UI/UX
Ro'yxatdan o'tish sahifasidagi subtitle va xato xabarlari endi "Google"
so'zini o'z ichiga olmaydi — Facebook (yoki kelajakda boshqa provayder)
orqali kelgan foydalanuvchiga ham to'g'ri ko'rinadi. Boshqa hech narsa
vizual jihatdan o'zgarmadi.

## API / Backend
- Backend o'zgardimi: FAQAT test fayli (`auth.service.spec.ts`) — ishlab
  chiqarish kodi (production logic) o'zgarmadi.
- Yangi API kerak bo'ldimi: NO
- Mavjud API ishlatilgan: `/auth/facebook`, `/auth/facebook/callback`,
  `/auth/oauth/exchange`, `/auth/oauth/register` — barchasi
  allaqachon mavjud, faqat test bilan tasdiqlandi.

## Test
- Backend tests: 406/406 (11 ta yangi Facebook testi qo'shildi, 395 ta
  eski test o'zgarishsiz o'tdi).
- Typecheck: PASS (`apps/backend`, `apps/web-user`).
- Build: PASS (`apps/web-user`).
- Browser QA (lokal): login sahifasida Facebook tugmasi to'g'ri href
  bilan ko'rinadi (`/auth/facebook?locale=uz`, Google tugmasi bilan bir
  xil pattern), konsolda xato yo'q. Ro'yxatdan o'tish sahifasi
  `?social=facebook&registrationToken=...&email=...&firstName=...`
  bilan tekshirildi: email prefilled+readonly, ism/familiya
  prefilled+tahrirlanadigan, parol maydoni ko'rsatilmaydi, yashirin
  `oauthProvider=facebook` va `registrationToken` maydonlari to'g'ri.
  Haqiqiy Facebook OAuth uchun App ID/Secret hali berilmagani sabab
  to'liq end-to-end login/registration browser orqali sinalmadi (kutilgan
  holat).

## Deploy
Local only — hali production'ga chiqarilmadi (foydalanuvchi tasdig'ini
kutmoqda).

## Git
- Branch: `temp/save-all-work`
- Commit: `fa0b966`

## Muhim eslatmalar
- Facebook App ID/Secret hali berilmagan (`FACEBOOK_APP_ID`/
  `FACEBOOK_APP_SECRET` lokal `.env`da yo'q) — `GET /auth/providers`
  hozircha `facebook: false` qaytaradi, bu kutilgan holat. Haqiqiy
  kredensiallar berilgach, hech qanday kod o'zgarishisiz ishlab ketishi
  kerak (arxitektura allaqachon tayyor).
- Production `.env`ga hech narsa yozilmadi, hech qanday secret
  terminalga/logga chiqarilmadi.
- Haqiqiy Facebook access token yoki boshqa maxfiy token hech qachon
  frontend URL'iga chiqmaydi — faqat bir martalik `code` (exchange) va
  `registrationToken` ishlatiladi, bu Google bilan bir xil arxitektura
  (kodni audit qilish orqali tasdiqlandi, chunki bu funksiyalar Google va
  Facebook uchun bir xil).

---

# 2026-08-27 — Favorite o'zgarishi Vercel production'ga deploy qilindi

## Nima o'zgardi
Pastdagi "Katalog ❤️ Favorite tugmasini haqiqiy backendga ulash" entrysida
tasvirlangan o'zgarishlar (commit `1a17ce6b`) `web-user` Vercel production
muhitiga chiqarildi.

## Nima uchun
Favorite funksiyasi haqiqiy foydalanuvchilarga yetkazilishi kerak edi.

## O'zgargan fayllar
Kod o'zgarishi yo'q — faqat deploy. Fayllar ro'yxati uchun quyidagi
entryga qarang.

## UI/UX
Production'dagi barcha foydalanuvchilar uchun ❤️ endi haqiqiy saqlanadi
(pastdagi entryda tasvirlangani kabi).

## API / Backend
- Backend o'zgardimi: NO
- Yangi API kerak bo'ldimi: NO
- Backend deploy qilinmadi (o'zgarmagan)

## Test
- Pre-deploy: branch/HEAD/git status tekshirildi, kutilmagan o'zgarish
  topilmadi.
- Post-deploy production browser QA (haqiqiy ro'yxatdan o'tgan QA
  hisoblar bilan, bir necha marta):
  - Hotels: to'liq sikl PASS (bosish → active → refresh → saqlangan →
    qayta bosish → inactive → refresh → saqlangan), `x-vercel-cache: MISS`
    tasdiqlandi (keshlanmagan, har doim yangi holat).
  - Home (Featured/Deals): to'liq sikl PASS.
  - Guest: ❤️ bosilganda backendga so'rov yuborilmasdan login'ga
    yo'naltirilishi tasdiqlandi (network monitor orqali).
  - Restaurants/Transport/Attractions: sahifalar to'g'ri "Ma'lumot
    topilmadi" holatini ko'rsatadi — productionda hozircha bu 3 katalog
    uchun 0 ta real yozuv bor (oldindan mavjud data holati, bu deploy
    bilan bog'liq emas, production DB'ga tegilmadi). Kod yo'li Hotels/
    Home bilan bir xil (allaqachon tasdiqlangan).
  - Hotel rasmlari: R2'dan haqiqiy o'lchamlar bilan yuklanmoqda.
  - Locale-prefixed hreflar: `/uz/hotels/...` formatida to'g'ri.
  - Console: faqat oldindan mavjud (bu deploydan oldin ham bor bo'lgan,
    fixed seed ID `00000000-0000-7005-...` bilan tasdiqlangan) 3 ta
    buzilgan `/images/hotels/*.jpg` fixture-rasm xatosi bor — Favorite
    bilan bog'liq emas, yangi emas.

## Deploy
- Vercel production
- Project: `web-user`
- URL: https://web-user-rho.vercel.app
- Deployment ID: `dpl_EjF85CHsp1ZhMeGFYgzyPHEanter`

## Git
- Branch: `temp/save-all-work`
- Commit (deploy qilingan): `1a17ce6b`

## Muhim eslatmalar
- Restaurants/Transport/Attractions kataloglari productionda hozircha
  bo'sh — bu ma'lumot yetishmasligi, kod nosozligi emas. Kimdir shu
  kataloglar uchun demo/real ma'lumot qo'shsa, Favorite avtomatik
  ishlaydi (kod allaqachon tayyor).
- Yuqorida qayd etilgan 3 ta buzilgan deal-rasm xatosi alohida, kichik
  tuzatish sifatida qaraladigan — bu ishning qamroviga kirmaydi.

---

# 2026-08-27 — Katalog ❤️ Favorite tugmasini haqiqiy backendga ulash

## Nima o'zgardi
Hotels, Deals/Featured Hotels, Restaurants, Transport va Attractions
kataloglaridagi ❤️ (Favorite) tugmasi endi haqiqiy backendga saqlanadi.
Avval bu tugma faqat `UniversalCard` ichidagi lokal state edi — bosilganda
vizual o'zgarardi, lekin hech qayerga saqlanmasdi va sahifa yangilanganda
(refresh) yo'qolib ketardi.

## Nima uchun
Foydalanuvchi biror ob'ektni (mehmonxona, restoran, transport, ko'ngilochar
joy) sevimlilarga qo'shsa, bu holat login qilingan hisobida doimiy
saqlanishi va boshqa sahifaga o'tib qaytganda ham (yoki qayta kirganda ham)
yo'qolmasligi kerak edi.

## O'zgargan fayllar
- `apps/web-user/components/features/favorites/useFavoriteToggle.ts` (yangi) —
  umumiy hook: optimistik UI + xatoda orqaga qaytarish, bir vaqtda bir nechta
  so'rov yuborilishining oldini olish, guest foydalanuvchini login sahifasiga
  yo'naltirish (backendga so'rov yubormasdan).
- `apps/web-user/components/ui/UniversalCard.tsx` — Favorite holati endi
  to'liq parent orqali boshqariladi (`isFavorite` propi haqiqiy render
  manbai, ilgari faqat boshlang'ich qiymat edi); yangi `favoritePending`
  propi (disabled/aria-busy holat uchun) qo'shildi.
- `apps/web-user/lib/services/account/favorites-actions.ts` — yangi
  `getFavoritesMap(targetType)` funksiyasi (bitta so'rovda foydalanuvchining
  shu turdagi barcha favoritelarini oladi, `targetId -> favoriteId`
  map'iga aylantiradi); `FavoriteTargetType` `hotel`/`bus`dan
  `restaurant`/`transport`/`attraction`gacha kengaytirildi.
- `packages/api-client/src/services/users.ts` — `AddFavoriteInput.targetType`
  shu yangi qiymatlarni qabul qiladigan qilib kengaytirildi (faqat
  TypeScript turi — backend ustuni erkin VARCHAR(32), enum cheklovi yo'q).
- `apps/web-user/components/features/hotels/HotelCard.tsx`,
  `apps/web-user/components/features/home/{FeaturedHotelCard,
  FeaturedHotelsCarousel,DealsSection}.tsx`,
  `apps/web-user/components/features/restaurants/RestaurantsView.tsx`,
  `apps/web-user/components/features/transport/TransportView.tsx`,
  `apps/web-user/components/features/attractions/AttractionsView.tsx` —
  har biriga `useFavoriteToggle` ulandi, `UniversalCard`ga `isFavorite`/
  `favoritePending`/`onFavoriteToggle` propilari uzatildi.
- `apps/web-user/components/accommodation/AccommodationPage.tsx`,
  `apps/web-user/components/features/accommodation/AccommodationListWithMap.tsx`,
  `apps/web-user/app/[lang]/(main)/{page.tsx,restaurants/page.tsx,
  transport/page.tsx,attractions/page.tsx}` — har bir sahifa
  `getFavoritesMap()`ni BITTA marta chaqiradi va natijani kartalarga
  mapping qiladi (har bir karta uchun alohida so'rov yo'q).

## UI/UX
- ❤️ bosilganda darhol (optimistik) to'ladi/bo'shaydi — server javobini
  kutib turmaydi.
- Agar backend xato qaytarsa, tugma avtomatik eski holatga qaytadi.
- Sahifa yangilansa (refresh) yoki boshqa sahifaga o'tib qaytilsa, ❤️
  holati foydalanuvchining haqiqiy saqlangan favoritelariga mos keladi.
- Login qilinmagan foydalanuvchi ❤️ bosganda backendga so'rov yuborilmasdan
  to'g'ridan-to'g'ri login sahifasiga yo'naltiriladi.
- Tez-tez bosilsa ham (masalan tasodifiy ikki marta), faqat bitta so'rov
  yuboriladi — tugma so'rov davomida vaqtincha disabled bo'ladi.

## API / Backend
- Backend o'zgardimi: NO
- Yangi API kerak bo'ldimi: NO
- Mavjud API ishlatilgan: `GET /me/favorites`, `POST /me/favorites`,
  `DELETE /me/favorites/:id` (xuddi mehmonxona detal sahifasidagi
  `FavoriteButton` ishlatgan API'lar).

## Test
- Typecheck: PASS (`apps/web-user`, `apps/web-partner`, `apps/web-admin`)
- Build: PASS (`apps/web-user`, barcha 68 route)
- Unit/integration tests: 395/395 backend testlari (backend
  o'zgartirilmagani uchun ta'sirlanmadi)
- Browser QA: lokal backend + lokal Postgres'da haqiqiy ro'yxatdan o'tgan
  foydalanuvchi bilan tekshirildi — barcha 5 katalog + Deals: bosish →
  active → refresh → saqlangan → qayta bosish → inactive → refresh →
  saqlangan. Guest holati (backendga so'rov yuborilmasligi network orqali
  tasdiqlandi), real backend xatosi orqali rollback (ikki tab race
  condition bilan unique-constraint xatosi hosil qilindi), va tez-tez
  bosishda duplicate-so'rov himoyasi (5 klikdan faqat 1 ta so'rov) alohida
  tekshirildi.
- Muhim regressionlar: topilmadi. UniversalCard rendering, hotel rasmlari,
  locale-prefixed hreflar, narx/chegirma ko'rsatilishi, mavjud
  `FavoriteButton` (detal sahifa), Google OAuth va registratsiya oqimi
  o'zgarishsiz qoldi.

## Deploy
- Local only (bu entry yozilgan vaqtda hali productionga chiqarilmagan)

## Git
- Branch: `temp/save-all-work`
- Commit: `1a17ce6b`

## Muhim eslatmalar
- Lokal dev serverida `/uz/hotels` va `/uz` sahifalari ba'zan Next.js dev
  serverining eski (stale) keshlangan javobini qaytaradi
  (`x-nextjs-cache: HIT`) — bu Favorite ishi bilan bog'liq emas, avvalgi
  sessiyada login formasида topilgan xuddi shu Next.js dev-server keshlash
  xatti-harakati, boshqa sahifada qayta uchradi. Faqat lokal dev
  muhitiga xos, productionga taalluqli emas.
- Lokal dev DB'da ba'zi eski "offer" (deal) fixture yozuvlari
  `/images/hotels/*.jpg` kabi mavjud bo'lmagan static fayllarga
  ishora qiladi (pre-existing, bu ishdan oldin ham mavjud edi) — bu ham
  Favorite bilan bog'liq emas.
