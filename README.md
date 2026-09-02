# SAFAAR.uz — Monorepo

> **Bron qil, yo'lga chiq!** — O'zbekiston milliy turar joy va bron platformasi.

|                     |                       |
| ------------------- | --------------------- |
| 🏨 Mehmonxona       | 🏡 Dacha              |
| 🛖 Gostinka         | 🏥 Sanatoriy          |
| ⛰️ Tog' oromgohlari | 🚌 Avtobus chiptalari |

## Arxitektura

```
apps/
├── backend/      NestJS API                  → :4000
├── web-user/     Mijozlar sayti — safaar.uz   → :3000
├── web-partner/  Hamkor kabineti              → :3001
└── web-admin/    Super Admin dashboard        → :3002
packages/
└── types/        Umumiy TypeScript turlari (API shartnomasi)
```

## Texnologiyalar

| Qatlam   | Texnologiya                                                |
| -------- | ---------------------------------------------------------- |
| Frontend | Next.js 16, React 19, Tailwind CSS v4, TypeScript (strict) |
| Backend  | NestJS, PostgreSQL 14 (Yandex Cloud VM), Redis, Cloudflare R2 |
| Auth     | JWT + Refresh Token, SMS OTP                               |
| To'lov   | Click, Payme, Uzcard, Humo                                 |

## Boshlash

```bash
npm install
npm run build:types         # types paketini build qilish (birinchi)
npm run dev:user            # web-user → localhost:3000
npm run dev:backend         # backend  → localhost:4000
```

Backend Docker stack:

```bash
docker compose -f docker-compose.backend.yml up --build
```

Bu stack PostgreSQL, Redis va API'ni ishga tushiradi. Fayl storage Cloudflare
R2 orqali ishlaydi va qiymatlar `apps/backend/.env` ichidagi `STORAGE_*`
o'zgaruvchilardan olinadi.

## Buyruqlar

```bash
npm run dev:user            # web-user
npm run dev:partner         # web-partner
npm run dev:admin           # web-admin
npm run dev:backend         # backend
npm run build               # barchasini build
npm run test                # testlar
```

## Loyiha haqida

**SAFAAR.uz** — O'zbekistonning shahar mehmonxonalaridan tortib tog' bag'ridagi eng chekka oromgohlargacha bo'lgan barcha dam olish joylarini bitta platformada birlashtiruvchi milliy bron ekotizimi. To'liq texnik topshiriq: [`TZ_Safaar_Platform.md`](./TZ_Safaar_Platform.md).

---

_SAFAAR Development Team_
