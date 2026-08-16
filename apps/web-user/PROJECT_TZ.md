# Safaar – Texnik Topshiriq (TZ) va Arxitektura Hujjati

## 1. Loyiha haqida qisqacha ma'lumot (Overview)
**Safaar** — O'zbekiston turizm bozori uchun mo'ljallangan, yagona markazlashgan onlayn ekotizim (SuperApp formatidagi platforma). Tizim foydalanuvchilarga nafaqat **mehmonxonalar**, balki **dachalar, restoranlar, avtomobillar ijarasi (rent-car) va transport** xizmatlarini izlash, solishtirish va bron qilish imkonini beradi. Tizim bitta yagona monorepo (npm workspaces) atrofida qurilgan bo'lib, mijozlar, hamkorlar va ma'murlar uchun alohida ilovalarni hamda yagona markaziy API'ni birlashtiradi.

## 2. Loyihaning Ekologik Tuzilmasi (Monorepo)
Kod bazasi qat'iy chegaralangan 4 ta asosiy ilova va bitta umumiy kutubxonadan tashkil topgan:

- **`apps/backend/` (@safaar/backend):** Markaziy API server. NestJS orqali qurilgan (Port: 4000). Barcha frontend ilovalari uchun yagona axborot manbai.
- **`apps/web-user/` (@safaar/web-user):** Mijozlar uchun mo'ljallangan B2C platforma (safaar.uz, Port: 3000). Dacha, mehmonxona, restoran va mashinalarni qidirish, band qilish hamda "Premium Travel-Tech" standartidagi interfeysni taqdim etadi.
- **`apps/web-partner/` (@safaar/web-partner):** Biznes egalari (mehmonxona, dacha, restoran va avtopark egalari) uchun B2B boshqaruv paneli (partner.safaar.uz, Port: 3001). Ob'ektlarni qo'shish, narxlar va buyurtmalarni nazorat qilish uchun mo'ljallangan.
- **`apps/web-admin/` (@safaar/web-admin):** Tizim ma'murlari uchun "Control Tower" (admin.safaar.uz, Port: 3002). Foydalanuvchilarni boshqarish, tranzaksiyalar auditi va hamkorlarni tasdiqlash uchun xizmat qiladi.
- **`packages/types/` (@safaar/types):** Backend va Frontend ilovalari o'rtasidagi yagona TypeScript ma'lumotlar shartnomasi (Types/Interfaces). Barcha loyihalar kompilyatsiyadan oldin aynan shu paketdan importlarni oladi.

## 3. Rol va Ruxsatlar tizimi (RBAC - Role-Based Access Control)
Tizim markazlashtirilgan ruxsatlar bilan himoyalangan:
- `USER` — Sayohat izlovchi mijoz.
- `PARTNER` — Joylashtirish vositasi, dacha yoki restoran/rent-car egasi.
- `ADMIN` — Tizim ma'muri (moderator).
- `SUPER_ADMIN` — To'liq huquqli boshqaruvchi.

## 4. UI/UX va Texnik Standartlar
- **Texnologik Stack:** TypeScript (strict mode) butun loyiha bo'ylab qo'llaniladi. 
- **Til siyosati:** Asosiy ishchi va interfeys tili — **O'zbek tili**. 
- **Valyuta:** Barcha moliyaviy hisob-kitoblar va interfeys ko'rsatkichlari **So'm (UZS)** da yuritiladi.
- **Design System:** Tizim "Premium Travel-Tech" stilida, kengaytirilgan layout'lar (masalan `max-w-1400px`), toza tipografiya va modern UX tamoyillari asosida tayyorlanadi.

## 5. Ish jarayoni va qoidalar (Git Workflow)
- **Modullilik:** Har bir frontend va backend dasturchisi faqat o'ziga tegishli (egasi bo'lgan) ilovadagi kodga o'zgartirish kiritadi.
- **Branching:** Barcha o'zgarishlar `develop` tarmog'iga yo'naltiriladi. `main` tarmog'iga faqat barqaror relizlar chiqariladi.
- Majburiy qoida: Kodlarni push qilishdan oldin linter (ESLint) va turlarni tekshirish (TypeScript) barcha xatoliklardan holi (yashil) bo'lishi talab etiladi.
