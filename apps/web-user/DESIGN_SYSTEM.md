# Safaar Design System v2.0 — AI-Ready Specification
### *Har bir qiymat aniq. "Yoki" yo'q. Faqat bitta to'g'ri javob.*

> **Uslub nomi:** Content-First Warm Minimalism (Airbnb + Booking.com aralashmasi)
> **Maqsad:** Interfeys "ko'rinmas" bo'lishi kerak — foydalanuvchi faqat rasm va narxni ko'radi.

---

## ⛔ TAQIQLANGAN NARSALAR (har doim tekshir)

Quyidagilar **hech qachon** ishlatilmaydi:
- `backdrop-blur` komponentlar (karta, tugma, fon) uchun taqiqlangan! (Faqat modal va drawer orqasidagi qora fon/overlay uchun ruxsat beriladi)
- `bg-gradient` fonda shaffoflik bilan (masalan `bg-white/80 backdrop-blur`)
- 3D transformlar (`perspective`, `rotateX/Y/Z`)
- `animate-bounce`, `animate-pulse` (faqat skeleton uchun ruxsat)
- `box-shadow` qiymati `shadow-xl` dan kattaroq (faqat hover'da `shadow-xl` ruxsat)
- Hardcoded hex ranglar (`#3B55C8`, `#022C22`) — faqat Tailwind tokenlari ishlatiladi
- Tashqi rasm URL'lari (freepngimg.com, icons8.com) — faqat `/public/` yoki API'dan
- `any` TypeScript turi
- Soxta (mock/hardcoded) ma'lumotlar — hammasi API'dan kelishi shart

---

## 1. RANGLAR (Color Tokens)

Faqat quyidagi Tailwind klasslarni ishlating. Hex qiymatlar faqat ma'lumot uchun.

### Primary (Safaar Blue — Ishonch rangi)
| Vazifa | Tailwind klass | Hex |
|--------|---------------|-----|
| Eng och fon (hover, selected) | `bg-primary-50` | `#eff6ff` |
| Yengil border/focus ring | `border-primary-200` | `#bfdbfe` |
| **Asosiy tugma foni** | `bg-primary-600` | `#1d4ed8` |
| Tugma hover | `hover:bg-primary-700` | `#1e40af` |
| Link matn rangi | `text-primary-600` | `#1d4ed8` |
| To'q fon (footer, hero gradient) | `bg-primary-900` | `#172554` |

### Accent (Tillarang — Chegirmalar va CTA uchun)
| Vazifa | Tailwind klass | Hex |
|--------|---------------|-----|
| **Aksent tugma foni** | `bg-accent-500` | `#f59e0b` |
| Aksent hover | `hover:bg-accent-600` | `#d97706` |
| Yulduzchalar rangi | `text-accent-500` | `#f59e0b` |

### Neytral (Kulrang — Matn va chegaralar)
| Vazifa | Tailwind klass | Hex |
|--------|---------------|-----|
| **Sahifa foni** | `bg-white` | `#ffffff` |
| Karta foni | `bg-white` | `#ffffff` |
| Bo'limlar orasidagi fon | `bg-slate-100/60` | — |
| **Asosiy matn** | `text-slate-900` | `#0f172a` |
| Ikkinchi darajali matn | `text-slate-600` | `#475569` |
| Placeholder / yordam matni | `text-slate-400` | `#94a3b8` |
| **Chegara (border)** | `border-slate-200` | `#e2e8f0` |
| Input border (focus) | `border-primary-500` + `ring-primary-200` | — |

### Semantik (Xatolik, Muvaffaqiyat, Ogohlantirish)
| Vazifa | Tailwind klass |
|--------|---------------|
| Muvaffaqiyat (yashil) | `text-success` / `bg-success` → `#16a34a` |
| Ogohlantirish (sariq) | `text-warning` / `bg-warning` → `#f59e0b` |
| Xatolik (qizil) | `text-danger` / `bg-danger` → `#ef4444` |
| Chegirma badge | `bg-rose-600 text-white` |

---

## 2. TIPOGRAFIKA (Shriftlar)

### Shrift oilalari
| Turi | Tailwind klass | Shrift |
|------|---------------|-------|
| **Sarlavhalar (h1-h4)** | `font-manrope` yoki `font-heading` | Manrope |
| **Asosiy matn** | `font-inter` yoki `font-sans` | Inter |

### Shrift o'lchamlari (aniq jadval)
| Element | Mobil | Desktop | Qalinlik | Qo'shimcha |
|---------|-------|---------|----------|------------|
| Hero H1 | `text-4xl` | `text-6xl lg:text-7xl` | `font-extrabold` | `tracking-tight drop-shadow-lg` |
| Sahifa sarlavhasi (H2) | `text-2xl` | `text-3xl` | `font-black` | `tracking-tight font-manrope` |
| Bo'lim sarlavhasi (H3) | `text-lg` | `text-xl` | `font-bold` | `tracking-tight` |
| Karta nomi | `text-sm` | `text-base` | `font-extrabold` | `line-clamp-1` |
| Narx (katta) | `text-sm` | `text-base md:text-lg` | `font-black` | `tracking-tight` |
| Narx (eski, chizilib tashlangan) | `text-[10px]` | `text-[11px]` | `font-semibold` | `line-through text-slate-400` |
| Oddiy matn | `text-sm` | `text-base` | `font-normal` | `text-slate-600` |
| Yordam matni | `text-xs` | `text-sm` | `font-medium` | `text-slate-500` |
| Teg (badge ichidagi matn) | `text-[10px]` | `text-[11px]` | `font-semibold` | — |

---

## 3. BO'SHLIQLAR (Spacing)

| Kontekst | Qiymat |
|----------|--------|
| Karta ichki padding (body) | `px-3.5 pt-3 pb-2 sm:px-4 sm:pt-3.5 sm:pb-2.5` |
| Karta elementlari oralig'i | `gap-1` |
| Karta footer border-top padding | `pt-2.5 sm:pt-3` |
| Bo'limlar oralig'i (section) | `py-10 sm:py-14` yoki `py-10 sm:py-16 md:py-20` |
| SectionHeader pastki margin | `mb-6 sm:mb-8` |
| Grid karta oralig'i | `gap-4 sm:gap-6` |
| Mobil carousel karta kengligi | `w-[85vw] max-w-[320px]` |

---

## 4. BURCHAKLAR (Border Radius)

| Element | Tailwind klass | Piksel |
|---------|---------------|--------|
| **Karta (Card)** | `rounded-2xl sm:rounded-[24px]` | 16px / 24px |
| **Tugma (default)** | `rounded-lg` | 8px |
| **Tugma (pill/search)** | `rounded-2xl` yoki `rounded-full` | 16px / 9999px |
| **Rasm (karta ichida)** | `rounded-t-2xl sm:rounded-t-[24px]` | Kartaning yuqori burchagi |
| **Input maydon** | `rounded-lg` | 8px |
| **Teg (badge)** | `rounded-md` | 6px |
| **Avatar** | `rounded-full` | 9999px |
| **Modal / Popover** | `rounded-2xl` yoki `rounded-3xl` | 16px / 24px |
| **Qidiruv paneli (SearchBar)** | `rounded-[32px] md:rounded-[40px]` | 32px / 40px |
| **Shahar pill** | `rounded-full` | 9999px |

---

## 5. SOYALAR (Shadows)

| Holat | Tailwind klass | CSS qiymati |
|-------|---------------|-------------|
| Karta (oddiy) | `shadow-xs sm:shadow-md` | `--shadow-card` |
| Karta (hover) | `hover:shadow-xl` | `--shadow-card-hover` |
| Tugma (oddiy) | `shadow-sm` | `--shadow-btn` |
| Tugma (hover) | `hover:shadow-md` | — |
| Qidiruv paneli | `shadow-2xl` | Katta, e'tiborni tortish uchun |
| Popover / Dropdown | `shadow-2xl` | — |
| Mobil drawer | `shadow-xl` | — |

---

## 6. ANIMATSIYALAR VA O'TISHLAR (Transitions)

| Element | Effekt | Tailwind klasslar |
|---------|--------|-------------------|
| **Karta hover** | Tepaga ko'tarilish | `transition-all duration-300 hover:-translate-y-1` |
| **Karta rasm hover** | Zoom-in | `transition-transform duration-500 ease-out group-hover/card:scale-105` |
| **Tugma hover** | Tepaga micro-lift | `transition-all duration-200 ease-out hover:-translate-y-[1px]` |
| **Tugma active** | Qaytish | `active:translate-y-0 active:shadow-sm` |
| **Hero fon rasm** | Sekin zoom | `animate-image-zoom` (20s, scale 1→1.08) |
| **Link rangi** | Silliq o'tish | `transition: color 0.15s ease` |
| **Sevimli tugma** | Kattalashish | `hover:scale-110 transition-all duration-200` |

---

## 7. KOMPONENT SPETSIFIKATSIYALARI

### 7.1 Tugma (Button)
4 ta variant, 3 ta o'lcham. Boshqa variant **yaratmang**.

**Variantlar:**
| Variant | Vazifa | Asosiy klasslar |
|---------|--------|----------------|
| `primary` | Asosiy harakat (Qidirish, Bron qilish) | `bg-primary-600 text-white font-bold` |
| `accent` | Premium harakat (To'lash, Maxsus taklif) | `bg-accent-500 text-white font-extrabold` |
| `secondary` | Ikkinchi darajali (Bekor qilish, Orqaga) | `bg-white text-slate-800 border border-slate-200` |
| `ghost` | Minimal (Header link, Menu item) | `text-slate-700 hover:bg-slate-100` |

**O'lchamlar:**
| O'lcham | Balandlik | Padding | Shrift |
|---------|-----------|---------|--------|
| `sm` | `h-10` (40px) | `px-3.5` | `text-xs font-bold` |
| `md` | `h-11` (44px) | `px-4.5` | `text-sm font-bold` |
| `lg` | `h-12` (48px) | `px-6` | `text-base font-extrabold` |

**Disabled holat (barcha variantlar uchun):** `disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none`

### 7.2 Karta (UniversalCard)
Har qanday listing kartasi (mehmonxona, dacha, transport, restoran) uchun **faqat UniversalCard** ishlatiladi.

| Xususiyat | Qiymat |
|-----------|--------|
| Tashqi konteynor | `rounded-2xl sm:rounded-[24px] border border-slate-200/80 bg-white` |
| Rasm nisbati (default) | `aspect-[4/3] sm:aspect-[16/10]` |
| Rasm nisbati (overlay variant) | `aspect-[4/3] sm:aspect-[3/2]` |
| Rasm hover | `group-hover/card:scale-105` (500ms ease-out) |
| Karta hover | `-translate-y-1` + `shadow-xl` (300ms) |
| Rasm yo'q bo'lganda | `ImageOff` ikonka + "Rasm yo'q" matni |
| Sevimli tugma | `h-8 w-8 rounded-full bg-white/90` rasm ustida o'ng yuqorida |
| Nom | `text-sm sm:text-base font-extrabold line-clamp-1` |
| Joylashuv | `MapPin` ikonka + `text-[11px] sm:text-xs text-slate-500` |
| Teg | `rounded-md border border-slate-200/60 bg-slate-100 text-[10px]` |
| Footer | `border-t border-slate-100` bilan ajratilgan |

### 7.3 SectionHeader (Bo'lim sarlavhasi)
| Xususiyat | Qiymat |
|-----------|--------|
| Sarlavha | `text-2xl sm:text-3xl font-black tracking-tight font-manrope text-slate-900` |
| Izoh | `text-sm sm:text-base font-medium text-slate-500 max-w-xl` |
| Layout | `flex-col sm:flex-row sm:items-end sm:justify-between mb-6 sm:mb-8` |
| Action link | O'ng tomonda `text-primary-600 font-bold` |

### 7.4 Header
| Xususiyat | Qiymat |
|-----------|--------|
| Balandlik | `h-14 md:h-16` |
| Max kenglik | `max-w-[1536px]` |
| Scroll'da fon | `bg-white shadow-sm border-b border-slate-200` |
| Brand shrift | `text-xl sm:text-2xl font-black tracking-tight text-primary-600` |
| Aktiv link | `text-primary-600 bg-primary-50` |
| Noaktiv link | `text-slate-600 hover:text-slate-900 hover:bg-slate-50` |

### 7.5 Qidiruv paneli (SearchBar)
| Xususiyat | Qiymat |
|-----------|--------|
| Konteynor | `rounded-[32px] md:rounded-[40px] border border-slate-200 bg-white shadow-2xl` |
| Padding | `p-3 sm:p-4 md:p-2` |
| Qidiruv tugmasi | `variant="primary" size="lg" rounded="2xl"` |
| Tugma matni | `uppercase tracking-wide` |
| Input ikonka | `text-slate-400` (MapPin, Calendar, Users) |

---

## 8. GRID VA LAYOUT

### Responsive grid
| Qurilma | Ustunlar | Tailwind klass |
|---------|----------|---------------|
| Mobil (< 640px) | 1 yoki 2 | `grid-cols-1` yoki `grid-cols-2` |
| Planshet (640-1024px) | 2 yoki 3 | `sm:grid-cols-2 md:grid-cols-3` |
| Desktop (> 1024px) | 3 yoki 4 | `lg:grid-cols-3` yoki `lg:grid-cols-4` |

### Max kenglik
| Element | Qiymat |
|---------|--------|
| Sahifa kontenti | `max-w-7xl mx-auto px-4 sm:px-6` |
| Header | `max-w-[1536px] mx-auto` |
| Hero matni | `max-w-3xl mx-auto text-center` |

### Breakpointlar
| Nom | Kenglik | Tailwind prefix |
|-----|---------|----------------|
| Mobil | 0–639px | (default, prefixsiz) |
| Kichik planshet | 640px+ | `sm:` |
| Planshet | 768px+ | `md:` |
| Desktop | 1024px+ | `lg:` |
| Katta ekran | 1280px+ | `xl:` |

---

## 9. RASM QOIDALARI

| Kontekst | Komponent | Nisbat | Sifat |
|----------|-----------|--------|-------|
| Karta rasm (default) | `next/image fill` | `aspect-[4/3] sm:aspect-[16/10]` | `quality={85}` |
| Karta rasm (overlay) | `next/image fill` | `aspect-[4/3] sm:aspect-[3/2]` | `quality={85}` |
| Hero fon | `next/image fill priority` | To'liq ekran | `quality={90}` |
| Detail sahifa hero | `next/image fill` | `aspect-[21/9]` | `quality={90}` |
| Avatar | `next/image` | `rounded-full` | `quality={80}` |

**Sizes attributi (majburiy):** `sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"`

---

## 10. IKONKALAR

| Xususiyat | Qiymat |
|-----------|--------|
| Kutubxona | `lucide-react` (boshqa kutubxona **ishlatmang**) |
| Default o'lcham | `h-4 w-4` (16px) |
| Katta ikonka | `h-5 w-5` (20px) |
| Juda katta (hero/empty state) | `h-8 w-8` yoki `h-10 w-10` |
| Stroke qalinligi | Default (`strokeWidth={2}`) — o'zgartirmang |
| Rang | Kontekstga qarab: `text-slate-400` (ikkinchi darajali), `text-slate-600` (asosiy), `text-primary-600` (aktiv) |

---

## 11. HOLATLAR (States Checklist)

Har bir sahifa va komponent uchun quyidagi **7 ta holatni** doim yozing:

| # | Holat | Nima ko'rsatiladi |
|---|-------|-------------------|
| 1 | **Loading** | `Skeleton` komponentlari (kulrang puls uruvchi qutilar) |
| 2 | **Empty** | `EmptyState` komponenti (ikonka + xabar + CTA tugma) |
| 3 | **Error** | Qizil banner + xato matni + "Qayta urinish" tugmasi |
| 4 | **Success** | Yashil banner + tasdiq xabari |
| 5 | **Default** | Normal kontent |
| 6 | **Hover** | Karta: `-translate-y-1 shadow-xl` / Tugma: `-translate-y-[1px] shadow-md` |
| 7 | **Disabled** | `bg-slate-200 text-slate-400 cursor-not-allowed` |
