# SAFAAR — Exhaustive Production QA Audit

**Date:** 2026-08-29
**Method:** repository route/element inventory + real-browser (Chromium) crawl of production, desktop (1440px) and mobile (390px), plus direct API/CORS probes and SSH verification of the backend VM. No production data was created beyond throw-away QA registrations; no destructive action was executed.

## Production URLs

| App | URL | Vercel project | Status |
|---|---|---|---|
| web-user | `https://web-user-rho.vercel.app` | `web-user` | ✅ working (launch URL) |
| web-user (brand) | `https://www.safaar.uz` → | (custom domain) | 🔴 **broken build** (routes 404); `safaar.vercel.app` / `safaar-uz.vercel.app` of project `safaar` work |
| web-partner | `https://web-partner-khaki.vercel.app` | `web-partner` | ✅ public pages; authenticated area UNVERIFIED |
| web-admin | `https://web-admin-phi-beige.vercel.app` | `web-admin` | ✅ working |
| backend API | `https://111-88-246-79.sslip.io/v1` | YC VM `fhmmagrf73kmj2dpo808` | ✅ healthy |
| database | PostgreSQL 14, `127.0.0.1:5432` on the VM (db `safaar_temp`) | — | ✅ (see `production-database.md`) |

## Coverage

| App | Routes in repo | Routes loaded in prod | Interactive elements enumerated | Flows exercised |
|---|---|---|---|---|
| web-user | 24 | 21 public (desktop+mobile) + 5 authed + hotel-detail + checkout | ~250 (all header/footer/catalog/filter/sort/card/form controls enumerated per route; key ones exercised) | search, filter apply/clear, sort, map toggle, guest counter, language switch (uz/ru/en), card→detail, room→checkout (pre-payment), guest-favorite→login, register (phone+OTP), account pages, notifications bell, authed favorite toggle+persist, logout |
| web-partner | 18 | 3 public (desktop+mobile) + 13 protected (redirect check) | ~30 public; ~448 in source (authenticated area not reachable) | public application form render, partner-login attempt, protected-route gating |
| web-admin | 32 | 26 dashboard routes (authenticated) + 9 unauth redirect checks | ~300 enumerated across all panels; read/nav exercised; CRUD create/edit/delete **not executed** (prod data) | login, every sidebar panel load, tables/data render, cross-app + direct-API authorization |

**Coverage is not 100%.** Not exhaustively executed: every individual admin CRUD write/delete (present, not clicked — prod data safety); web-partner authenticated cabinet (no valid partner account); payment submission (out of scope); `/uz/restaurants/[id]`, `/uz/booking/[id]` with real data (catalogs empty on prod).

---

## Findings

### 🔴 P0 — Security

**SEC-1 — OTP verification bypass (`ENABLE_DEMO_AUTH=true`).**
`POST /v1/auth/user/send-otp` (and partner OTP) returns the real code as `dev_code` in the JSON response for **any** phone number. Anyone can register/authenticate as any phone with no SMS. Deliberate temporary state (no SMS provider configured; `env.validation.ts` allows it in prod with a loud warning). **Backend/infra fix:** configure an SMS provider, set `ENABLE_DEMO_AUTH=false`, restart. **Production blocker.**

### 🔴 P1 — Deployment / domain

**DEP-1 — `www.safaar.uz` serves a broken build.**
`https://www.safaar.uz/uz` → 200 with an old `<title>` ("Safaar - O'zbekiston bo'ylab bron qilish"); `/uz/hotels` → **404**; browser load times out. The `safaar` Vercel project's own `.vercel.app` URLs (`safaar.vercel.app`, `safaar-uz.vercel.app`) serve the **current** app fine (200, correct title). So this is a **custom-domain alias pointed at a stale/wrong deployment**, not an application bug. Blocker **iff** `safaar.uz` is the intended launch domain (it is the brand domain, and the changelog treats both user frontends as live). **Infra fix:** repoint the `www.safaar.uz` alias to the current production deployment; then add its origin to backend `CORS_ORIGINS`.

**CORS-1 — `safaar.uz` / `safaar-uz.vercel.app` not in backend CORS allowlist.** Allowlist = `web-user-rho`, `web-partner-khaki`, `web-admin-phi-beige` `.vercel.app` only. Even the *working* `safaar-uz.vercel.app` frontend would have browser-side API calls (notifications fetch, etc.) blocked. **Backend config fix** — tied to DEP-1.

### 🟠 P2 — Frontend functional

**FE-1 — Accommodation-type routes don't filter by type.**
`/uz/dachas`, `/uz/resorts`, `/uz/sanatoriums` (reachable via footer + catalog sub-tabs) all render the **identical full hotel list** as `/uz/hotels`, only the page title differs, and every card links to `/uz/hotels/<slug>` (there is no `/uz/dachas/<slug>` route). Root cause: `AccommodationPage` calls `api.hotels.getHotels(...)` with **no `type`/category parameter**, and the backend `GET /hotels` has **no type filter** (`po.type IN ('hotel','hostel','guesthouse','motel','dacha','mixed')` — `resort`/`sanatorium` aren't even modelled). Needs FE + BE work; a frontend-only fix cannot add the missing API filter. **Not fixed in this audit.**

### 🟡 P3 — Cosmetic / minor

| ID | Where | Issue |
|---|---|---|
| C-1 | web-user footer (all pages) | Instagram + Telegram links are `href="#"` — dead placeholders |
| C-2 | web-user `<title>` | `/uz/restaurants`, `/uz/transport`, `/uz/attractions` → "Restoranlar — Safaar — **Safaar**" (doubled suffix) |
| C-3 | web-user `<title>` | `/uz/login`, `/uz/register`, `/uz/account/*`, `/uz/offline`, `/uz/theme-preview` use the generic fallback title, not page-specific |
| C-4 | web-user `/uz` homepage | 3 "deal" card images 400: `/_next/image?url=/images/hotels/{buxoro-palace,samarkand-plaza,hilton-tashkent}.jpg` — CMS entries reference static files not in `public/` |
| C-5 | web-user `/uz/theme-preview` | design/preview page is publicly live in production |
| C-6 | web-admin | `/bookings/restaurants` and `/cms/templates` render an empty `<h1>` heading |
| C-7 | web-partner (logged-out pages) | console logs `401 /api/auth/refresh` on every page — the intentional silent session-restore attempt (browser logs it even though the app handles it) |
| C-8 | web-user `/uz/transport` | one transient 35s Playwright load timeout during the crawl; not reproducible (curl + mobile viewport consistently 200 in ~1–3s) |

---

## Results by app

### web-user — PASS (with P3 issues + FE-1)

- **Public routes (21):** all HTTP 200, correct content; **0 hydration errors**; **0 console errors** except C-4 (3 seed-image 400s on `/uz` only).
- `/sw.js` → **200 `application/javascript`**, service worker registers & activates, **no MIME error** (prior fix holds).
- **Header/nav:** logo, all nav links, **language switcher (uz→ru→en, `htmlLang` + UI text switch)**, login/register links, mobile hamburger + drawer — all PASS.
- **Catalog (`/uz/hotels`):** list renders (9 cards); **star filter** → `?stars=5`; **Tozalash (clear)** → filters removed; **sort dropdown** → 4 options, "arzondan" → `?sort=price_asc`; **map (Xarita) toggle** renders map; **guest counter** +/−; **search submit** → query params; **pagination** links present.
- **Card → detail:** hotel card click → `/uz/hotels/<slug>`; detail page renders rooms, 0 console errors.
- **Booking (pre-payment):** detail "Bron qilish" → `/uz/booking?hotelId=…&roomId=…`; checkout form renders all fields (`firstName,lastName,email,phone,checkIn,checkOut,guests,paymentMethod` + hidden `locale,hotelId,roomId`); **payment selector present**; confirm button **correctly disabled** without dates. **Stopped before payment (out of scope).**
- **Auth:** register (phone + `dev_code`) → session established; logout → session cleared, "Kirish" returns.
- **Account pages** (profile, bookings, favorites, bonuses, refunds): all load authed content, no login redirect, 0 console errors.
- **Favorites:** guest heart → redirect to `/login`, **no backend write**; authed heart toggle → `aria-pressed` flips and **persists across reload**.
- **Notifications:** bell hidden logged-out; visible desktop + mobile logged-in; dropdown opens; **`GET /v1/notifications` → 200** (×4, clean). Mark-as-read: **UNVERIFIED** (fresh account has 0 unread; control only renders when `unreadCount > 0`).
- **Empty catalogs:** `/uz/restaurants`, `/uz/transport`, `/uz/attractions` render the "Ma'lumot topilmadi" empty state — backend returns `[]` (no seeded data). Not an app bug.

### web-partner — PASS (public) / UNVERIFIED (authenticated)

- **Public (`/login`, `/register`, `/status`):** HTTP 200 desktop + mobile; partner **application form** (`type` select + companyName, contactPerson, phone, email, city, taxId, address, note + submit) renders; status-check form renders. Console noise C-7.
- **Partner login attempt** (demo phone `+998901112203`): "Bu login uchun hamkorlik access topilmadi. Avval ariza yuboring." — **no working production partner account exists**. Backend partner-auth endpoints respond correctly (`partner/phone-login` → clean 401, no user enumeration).
- **Authenticated cabinet** (dashboard, calendar, guests, listing, reports, reservations, rooms, settings/{profile,hotel,team,documents,developer}, support): **UNVERIFIED — NO VALID PRODUCTION PARTNER ACCOUNT.** Not marked PASS or FAIL.
- **Authorization:** all 13 protected routes while unauthenticated → **redirect to `/login?next=…`**. PASS.

### web-admin — PASS

- **Login** (demo `admin@safaar.uz`) → `/dashboard`. PASS.
- **All 26 dashboard routes loaded: HTTP 200, 0 console errors, 0 network errors**, real data in every table:
  dashboard; users (12 rows); partners/list (12), /requests (16), /listings (11); bookings/hotels (12), /buses (1), /restaurants (1); finance/overview, /payments (50), /refunds (50), /withdrawals (30), /reports (53); cms/banners, /broadcasts, /news, /offers (3), /pages, /templates; catalog (14); promos; audit (6); support; team; settings; developer.
- **CRUD entry points present** ("Yangi Banner", "Yangilik qo'shish", "Taklif qo'shish", "Sahifa qo'shish", "Yangi shablon", "Xodim qo'shish", "Yangi promo-kod", per-row action icons, `Ko'rish`, export buttons) — **not executed** (would mutate production data). Row-action / edit / delete / activate-deactivate / status-change: present in DOM, **not clicked**.
- `/settings` exposes "2FA ni yoqish" (admin 2FA available; demo admin has it off).
- **Authorization:** 9 protected routes (incl. dynamic `/users/[id]`) while unauthenticated → **redirect to `/login`**; direct API without token → `/admin/dashboard/overview` 401, `/admin/users` 401, `/partner/profile` 401; a logged-in **web-user** session does **not** grant web-admin or web-partner (separate origins → rejected to `/login`). PASS.

---

## Flow-by-flow

| Flow | Result | Notes |
|---|---|---|
| Home → nav → catalog → filter/sort → card → hotel detail | PASS | all steps, 0 console errors |
| Hotel detail → select room → checkout form | PASS (to pre-payment) | form + payment selector render; confirm disabled without dates; **stopped before pay** |
| Register (phone OTP) → account → logout | PASS | via `dev_code` (see SEC-1) |
| Guest favorite → login gate | PASS | redirect to `/login`, no backend write |
| Authed favorite toggle → persist | PASS | survives reload |
| Notifications bell → dropdown → fetch | PASS | `GET /notifications` 200; mark-read UNVERIFIED (no unread) |
| Language uz → ru → en | PASS | route + `htmlLang` + UI text all switch |
| Partner application form render | PASS | `/register` |
| Partner login → cabinet | UNVERIFIED | no production partner account |
| Admin login → every panel | PASS | read/nav; CRUD writes not executed |
| Admin CRUD create/edit/delete | UNVERIFIED | present, not executed (prod data) |
| Payment | OUT OF SCOPE | not implemented / not tested |
| Authorization (unauth → protected; cross-app) | PASS | web-user + web-partner + web-admin |

---

## Security summary

| Area | Result |
|---|---|
| OTP demo mode | 🔴 **SEC-1** — `dev_code` leaked in API response for any phone; verification bypassed |
| CORS | 🟡 restricted correctly to the 3 `*.vercel.app` project origins (`evil.example.com` rejected); **missing** `safaar.uz` family (CORS-1) |
| Authorization | ✅ PASS — protected routes gate to login (all 3 apps); direct API 401 without token; separate-origin session boundary holds |
| Authentication | ✅ session in httpOnly `safaar_session` cookie; JWT access + rotating refresh; OAuth (Google + Facebook) enabled |
| Secret exposure | ✅ no `.env` tracked in git; `.env.example` uses placeholders; env validation throws on weak prod secrets; Swagger forced off in prod (confirmed 404); `apps/backend/.env` git-ignored |
| Rate limiting | ✅ OTP: per-phone `resend_after` (60s) + per-IP ~3/window → `429`. Appropriate — **not weakened** |

## Payment

**PAYMENT INTEGRATION: OUT OF SCOPE / NOT IMPLEMENTED.** The checkout form's payment-method selector renders and the confirm button is present; no payment submission was attempted. Not a QA failure.

## Unverified

- web-partner authenticated cabinet — no valid production partner account (would require creating a prod partner).
- Admin CRUD create/update/delete/status-change — present in UI, not executed (prod data safety).
- Notification mark-as-read — no production unread notification on a fresh account.
- `_prisma_migrations` / schema drift on prod DB — prod DB has no Prisma migration table (see `production-database.md`); not diffable here.
- Payment.

## Deployment / domain

| Target | State |
|---|---|
| web-user `web-user-rho.vercel.app` | ✅ current build, all routes 200, `/sw.js` OK |
| web-user `www.safaar.uz` | 🔴 stale/wrong build — routes 404 (DEP-1); custom-domain alias misconfigured |
| web-user `safaar.vercel.app` / `safaar-uz.vercel.app` | ✅ current build (project `safaar`) — but not in CORS allowlist (CORS-1) |
| web-partner `web-partner-khaki.vercel.app` | ✅ public pages |
| web-admin `web-admin-phi-beige.vercel.app` | ✅ |

DEP-1 and CORS-1 are **Vercel/DNS + backend-config** issues, not repository code.

## Fixes made during this audit

**No code fixes.** Every actionable finding is backend/infra/product (SEC-1, DEP-1, CORS-1, FE-1) or cosmetic P3. Nothing was a safe, self-contained frontend production-blocker fix. No commit was made for fixes (this document is the only change).

## Production readiness

🔴 **NOT READY** — because of **SEC-1** (OTP bypass; unconditional). **DEP-1/CORS-1** are additional blockers **iff** `safaar.uz` is the launch domain.

Not ready until: (1) an SMS provider is configured and `ENABLE_DEMO_AUTH=false`; (2) `www.safaar.uz` is repointed to the working build and added to backend CORS (or `web-user-rho.vercel.app` is declared the sole launch domain). Non-blocking: FE-1 (dacha/resort/sanatorium routes), and the P3 list above. Partner cabinet and admin CRUD remain UNVERIFIED pending a test partner account / a safe write-test path.
