# Safaar — Tayyor Promptlar

Har bir promptni **yangi chatda** paste qiling. Prompt ichida hammasi bor.
Bitta tugagach → brauzerda tekshiring → keyingisiga o'ting.

---

## Prompt 0 · Texnik qarzlar
**Model: Gemini 3.1 Pro**

```
Sen Safaar platformasining web-user senior frontend dasturchisisan.
Ishlashdan OLDIN quyidagi fayllarni o'qi va ulardagi qoidalarga 100% amal qil:
- apps/web-user/AGENTS.md
- apps/web-user/DESIGN_SYSTEM.md
Faqat apps/web-user/ ichida ishla. Backend va boshqa frontendlarga tegma.
Yangi npm paket o'rnatma. Hardcoded hex rang, tashqi URL, mock data ishlatma.
TypeScript strict, `any` ishlatma.

VAZIFA: Quyidagi 4 ta texnik qarzni tuzat:

1. components/layout/header/MobileNav.tsx → `backdrop-blur-sm` ni olib tashla,
   o'rniga `bg-slate-900/60` qo'y (DESIGN_SYSTEM bo'yicha glassmorphism taqiqlangan).

2. components/features/transport/TransportView.tsx → tashqi rasm URL larini
   (freepngimg.com, img.icons8.com) olib tashla. O'rniga /public/images/transport/
   papkasiga lokal SVG/PNG qo'yib, next/image bilan ishlat.

3. TransportView.tsx va components/attractions/AttractionCard.tsx dagi barcha
   hardcoded hex ranglarni Tailwind token klasslariga almashtir:
   #3B55C8 → text-primary-600, #022C22 → bg-primary-950, #F8FAF9 → bg-slate-50.

4. Restoran sahifasidagi RestaurantBookingSection.tsx → hardcoded
   `http://localhost:4000` ni `process.env.NEXT_PUBLIC_API_URL` ga almashtir.

Ish tugagach: npm run build yashil bo'lsin.
O'zgartirilgan fayllar ro'yxatini ber.
git add . && git commit -m "fix(web-user): texnik qarzlarni tozalash" qil.
```

---

## Prompt 1 · Trust Stats va Testimonials
**Model: Gemini 3.1 Pro**

```
Sen Safaar platformasining web-user senior frontend dasturchisisan.
Ishlashdan OLDIN quyidagi fayllarni o'qi va ulardagi qoidalarga 100% amal qil:
- apps/web-user/AGENTS.md
- apps/web-user/DESIGN_SYSTEM.md
Faqat apps/web-user/ ichida ishla. Backend va boshqa frontendlarga tegma.
Yangi npm paket o'rnatma. TypeScript strict, `any` ishlatma.

VAZIFA: Bosh sahifaga (app/[lang]/(main)/page.tsx) 2 ta yangi bo'lim qo'sh.
Barcha ma'lumot locales/uz/home.json dagi mavjud tarjimalardan olinsin.
Yangi alohida komponent fayl yaratma — page.tsx ichida lokal funksiya sifatida yoz.

1. TRUST STATS — FeaturedHotelsCarousel va DealsSection orasiga:
   - home.json → trust ob'ektidagi ma'lumotlarni ishlat.
   - API dan kelgan publicStats mavjud bo'lsa uni, bo'lmasa dict fallback ishlat.
   - Grid: mobilda grid-cols-2 gap-4, desktopda grid-cols-4 gap-8.
   - Har bir stat: Lucide ikonka (Building2, MapPin, Star, Headset)
     h-6 w-6 text-primary-600 + raqam text-2xl sm:text-3xl font-black
     text-slate-900 + izoh text-sm text-slate-500.
   - Konteynor: bg-white border-y border-slate-100 py-10 sm:py-14,
     ichki: max-w-7xl mx-auto px-4 sm:px-6.

2. TESTIMONIALS — CityCardsSection dan keyin (sahifa eng oxirida):
   - home.json → reviews massivini ishlat (4 ta mijoz sharhi).
   - SectionHeader bilan sarlavha.
   - Mobilda: gorizontal scroll (snap-x snap-mandatory gap-4,
     karta w-[85vw] max-w-[320px]).
   - Desktopda: hidden sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-6.
   - Sharh kartasi: bg-white rounded-2xl border border-slate-200 p-5 sm:p-6.
     Yuqorida 5 ta yulduzcha (Star, h-4 w-4 fill-accent-500 text-accent-500),
     iqtibos (text-sm text-slate-600 italic), ism (font-bold text-slate-900).

Ish tugagach: npm run build yashil bo'lsin.
git add . && git commit -m "feat(web-user): trust stats va testimonials" qil.
```

---

## Prompt 2 · Bottom Navigation
**Model: Gemini 3.8 Flash**

```
Sen Safaar platformasining web-user senior frontend dasturchisisan.
Ishlashdan OLDIN quyidagi fayllarni o'qi va ulardagi qoidalarga 100% amal qil:
- apps/web-user/AGENTS.md
- apps/web-user/DESIGN_SYSTEM.md
Faqat apps/web-user/ ichida ishla. TypeScript strict.

VAZIFA: Yangi komponent yarat — components/layout/BottomNav.tsx ("use client").

Spetsifikatsiya:
- Faqat mobilda: md:hidden.
- Pozitsiya: fixed bottom-0 inset-x-0 z-50.
- Fon: bg-white border-t border-slate-200.
- pb-[env(safe-area-inset-bottom)] — iPhone uchun.
- Balandlik: h-16.

4 ta tab (lucide ikonkalar bilan, next/link bilan):
| Nom | Ikonka | Havola |
|-----|--------|--------|
| Qidirish | Search | /${locale} |
| Saqlanganlar | Heart | /${locale}/account/favorites |
| Bronlarim | CalendarCheck | /${locale}/account/bookings |
| Profil | UserRound | /${locale}/account |

Har bir tab:
- Ikonka h-5 w-5, matn text-[10px] font-semibold.
- Aktiv (usePathname bilan): text-primary-600 + ikonka ustida
  w-1 h-1 rounded-full bg-primary-600 nuqta.
- Noaktiv: text-slate-400.
- Props: { locale: string }.

Integratsiya:
- layout.tsx da (app/[lang]/(main)/layout.tsx) SiteFooter dan OLDIN
  <BottomNav locale={locale} /> qo'sh.
- {children} wrapper div ga pb-20 md:pb-0 qo'sh.

Ish tugagach: npm run build yashil bo'lsin.
git add . && git commit -m "feat(web-user): mobil bottom navigation" qil.
```

---

## Prompt 3 · Karta Rasm Carousel
**Model: Claude Opus 4.6 (Thinking)**

```
/plan

Sen Safaar platformasining web-user senior frontend dasturchisisan.
Ishlashdan OLDIN quyidagi fayllarni o'qi va ulardagi qoidalarga 100% amal qil:
- apps/web-user/AGENTS.md
- apps/web-user/DESIGN_SYSTEM.md
Faqat apps/web-user/ ichida ishla. Yangi npm paket o'rnatma.

VAZIFA: components/ui/UniversalCard.tsx ni yangilagin.

MUHIM: Hozirgi UniversalCardProps va barcha mavjud props BUZILMASLIGI kerak.

O'zgartirish:
Hozir: imageSrc?: string | null
Yangi: imageSrc?: string | string[] | null

imageSrc massiv bo'lganda:
1. Rasmlar gorizontal carousel ko'rinishda.
2. Mobilda: touch events (onTouchStart/Move/End) bilan swipe.
   Min swipe masofa: 50px, 300ms ichida.
3. Desktopda: ChevronLeft/ChevronRight tugmalari.
   Faqat hover da ko'rinadi (opacity-0 group-hover/card:opacity-100).
   h-8 w-8 rounded-full bg-white/90 shadow-md, absolute left-2/right-2.
4. Nuqtali indikator: absolute bottom-3 left-1/2 -translate-x-1/2.
   Aktiv: w-1.5 h-1.5 rounded-full bg-white.
   Noaktiv: bg-white/50. Max 5 ta nuqta.
5. Lazy: faqat hozirgi va keyingi rasmni yukla.
6. Transition: transform 300ms ease-out.

imageSrc string bo'lsa — hozirgi mantiq saqlansin.
imageSrc null bo'lsa — hozirgi ImageOff placeholder saqlansin.

Ish tugagach: npm run build yashil bo'lsin.
git add . && git commit -m "feat(web-user): universal card image carousel" qil.
```

---

## Prompt 4 · Sticky CTA Bar
**Model: Gemini 3.8 Flash**

```
Sen Safaar platformasining web-user senior frontend dasturchisisan.
Ishlashdan OLDIN quyidagi fayllarni o'qi:
- apps/web-user/AGENTS.md
- apps/web-user/DESIGN_SYSTEM.md
Faqat apps/web-user/ ichida ishla.

VAZIFA: Mobilda (md:hidden) 2 ta sahifaga Sticky Bottom CTA Bar qo'sh.
BottomNav h-16 da turadi, shuning uchun bar pozitsiyasi: bottom-16.

1. Hotel detail sahifasi (hotels/[slug] ichidagi komponent):
   - fixed bottom-16 inset-x-0 z-40 md:hidden.
   - bg-white border-t border-slate-200 px-4 py-3.
   - Chap: narx text-lg font-black + "/ kecha" text-xs text-slate-500.
   - O'ng: Button variant="accent" size="lg" rounded="xl" → "Bron qilish".
   - IntersectionObserver: sahifadagi asl CTA tugma ko'rinmasa, bar paydo bo'ladi.

2. Checkout (booking/page.tsx yoki CheckoutForm):
   - Xuddi shunday panel.
   - Chap: jami narx font-black. O'ng: "To'lash" tugmasi variant="accent".

Ish tugagach: npm run build yashil bo'lsin.
git add . && git commit -m "feat(web-user): sticky mobile CTA bar" qil.
```

---

## Prompt 5 · Qidiruv yaxshilash
**Model: Claude Opus 4.6 (Thinking)**

```
/plan

Sen Safaar platformasining web-user senior frontend dasturchisisan.
Ishlashdan OLDIN quyidagi fayllarni o'qi:
- apps/web-user/AGENTS.md
- apps/web-user/DESIGN_SYSTEM.md
Faqat apps/web-user/ ichida ishla. Yangi npm paket o'rnatma.

VAZIFA: SearchBar.tsx ni 2 ta yo'nalishda yaxshila:

1. YAQINDA QIDIRILGANLAR (Recent Searches):
   - Form submit da localStorage ga saqla (kalit: "safaar_recent_searches").
   - Format: Array<{ cityId, cityName, checkIn, checkOut, guests, timestamp }>.
   - Max 5 ta (FIFO).
   - Destination inputga focus + input bo'sh bo'lganda dropdown ko'rsat:
     absolute top-full left-0 z-50 mt-2 w-full rounded-2xl border
     border-slate-200 bg-white shadow-2xl p-3.
   - Har bir element: Clock ikonka + shahar nomi + sana diapazoni + X tugma.
   - Bosilsa — maydonlar avtomatik to'ladi. Input yozilsa — yopiladi.

2. DATEPICKER BIRLASHTIRISH:
   - SearchBar dagi components/ui/DatePicker ni components/search/SearchDatePicker
     (react-day-picker + nuqs URL sync) ga almashtir.
   - URL da ?checkIn=YYYY-MM-DD&checkOut=YYYY-MM-DD saqlansin.
   - Eski DatePicker importlarini tozala.

Ish tugagach: npm run build yashil bo'lsin.
git add . && git commit -m "feat(web-user): recent searches va datepicker" qil.
```

---

## Prompt 6 · Footer Trust Bar
**Model: Gemini 3.8 Flash**

```
Sen Safaar platformasining web-user senior frontend dasturchisisan.
Ishlashdan OLDIN apps/web-user/DESIGN_SYSTEM.md ni o'qi.
Faqat apps/web-user/ ichida ishla.

VAZIFA: SiteFooter ga "Xavfsiz to'lov usullari" bo'limini qo'sh.

Joylashuv: copyright yozuvidan OLDIN.
- Konteynor: py-6 border-t border-slate-200, text-center.
- Sarlavha: "Xavfsiz to'lov usullari" text-xs text-slate-400
  uppercase tracking-wider font-semibold mb-4.
- Logotiplar qatori: flex items-center justify-center gap-6 sm:gap-8.
  Click, Payme, Uzum, Humo, UzCard.
- Rasmlar: /public/images/payment/ ga SVG qo'y. Topolmasang matn yoz:
  <span className="text-sm font-bold text-slate-300 hover:text-slate-600
  transition-colors">Click</span>
- Rasm effekt: grayscale opacity-50 hover:grayscale-0 hover:opacity-100
  transition-all duration-300.

Ish tugagach: npm run build yashil bo'lsin.
git add . && git commit -m "feat(web-user): footer trust payment logos" qil.
```

---

## Prompt 7 · Polish va Animatsiyalar
**Model: Gemini 3.1 Pro**

```
Sen Safaar platformasining web-user senior frontend dasturchisisan.
Ishlashdan OLDIN quyidagi fayllarni o'qi:
- apps/web-user/AGENTS.md
- apps/web-user/DESIGN_SYSTEM.md
Faqat apps/web-user/ ichida ishla.

VAZIFA: 3 ta polish ish:

1. BOSH SAHIFA FADE-IN:
   - page.tsx dagi har bir bo'lim wrapper div ga qo'sh:
     animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both
   - Staggered: style={{ animationDelay: "0ms" }}, "100ms", "200ms"...
   - tw-animate-css allaqachon globals.css da import qilingan.

2. SKELETON LOADING:
   - loading.tsx (app/[lang]/(main)/loading.tsx) ni tekshir.
   - Bosh sahifa tuzilmasiga mos skeleton qo'sh:
     Hero: h-[70vh] w-full. Kartalar: 4 ta grid aspect-[4/3] rounded-2xl.
     Stats: 4 ta grid h-20 rounded-xl.

3. EMPTY STATE:
   - hotels, dachas, transport, restaurants, attractions sahifalarida
     API dan bo'sh massiv kelganda EmptyState chiqishini tekshir.
   - Chiqmasa — components/ui/EmptyState.tsx ni import qilib qo'sh.

Ish tugagach: npm run build yashil bo'lsin.
git add . && git commit -m "feat(web-user): polish animations va states" qil.
```
