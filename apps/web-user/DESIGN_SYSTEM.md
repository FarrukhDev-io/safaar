# Safaar Design System (Functional Minimalism)

Ushbu hujjat Safaar platformasi uchun tasdiqlangan asosiy dizayn qoidalari va yo'riqnomalarini o'z ichiga oladi. Barcha frontend dasturchilar va dizaynerlar ushbu qoidalarga qat'iy amal qilishlari shart.

## 1. Uslub / Referens
* **Dizayn yo'nalishi:** Functional Minimalism (Funksional Minimalizm) va Content-First (Kontent eng muhimi). Hech qanday 3D effektlar, qalin soyalar yoki ortiqcha vizual shovqinlar ishlatilmaydi. 
* **Referens:** Airbnb va Booking.com platformalarining eng yaxshi jihatlari (Premium, xavfsiz va ishonchli). Interfeys imkon qadar "ko'rinmas" bo'lishi va foydalanuvchi diqqatini faqat mahsulotga (rasm va narxlarga) qaratishi lozim.

## 2. Ranglar
* **Asosiy rang (Primary):** Safaar Blue (`#2563eb` yoki qat'iy ko'k rang) — Ishonch, xavfsizlik va barqarorlik rangi.
* **Fon (Background):** Mutlaqo Oq (`#ffffff`) — Tozalik va yengillik uchun. Bo'limlarni ajratish zarurati tug'ilsagina o'ta ochiq kulrang (`#f8fafc`) ishlatilishi mumkin.
* **Karta foni (Card):** Oq (`#ffffff`).
* **Aksent rang (Accent):** To'q sariq yoki Tilla rang (`#f59e0b` / `#ea580c`) — Faqat chegirmalar, reyting yulduzlari va tezkor e'tibor talab qiluvchi muhim elementlar uchun.

## 3. Radius (Burchak o'lchamlari)
* **Katta elementlar (Kartalar, rasmlar, modallar):** `rounded-xl` (12px) yoki `rounded-2xl` (16px). Zamonaviy, lekin haddan tashqari dumaloq emas.
* **Kichik elementlar (Tugmalar, inputlar):** `rounded-lg` (8px). Kvadratga yaqinroq bo'lib, qat'iy va professional ko'rinish beradi.

## 4. Chegaralar (Borders & Shadows)
* **Border qalinligi:** O'ta nozik 1px chiziq. Tailwind klassi: `border border-slate-200`. Ortiqcha qalin, ko'zga tashlanuvchi ramkalar ishlatilmaydi.
* **Soya turi (Shadow):** Katta va dag'al soyalar o'rniga faqat yengil soyalar ishlatiladi:
  - Tinch holatda (default): `shadow-sm` yoki umuman soyasiz (faqat nozik border).
  - Hover holatida: `shadow-md` (karta ustiga sichqoncha borganda ajralib turishi uchun).

## 5. Bo'shliqlar (Spacing)
* **Elementlar oralig'i:** Karta yoki kichik komponentlar ichida `gap-2` (8px) yoki `gap-3` (12px).
* **Bo'limlar oralig'i:** Interfeys "nafas olishi" uchun keng bo'shliqlar qoldiriladi. Katta seksiyalar orasida `py-12` (48px) yoki `py-16` (64px) margin/padding ishlatiladi.

## 6. Tipografika (Shrift)
* **Shrift oilasi (Font Family):** 
  - Asosiy va matnlar: `Inter` (o'qish uchun eng qulay sans-serif).
  - Katta sarlavhalar: `Manrope` (jiddiy va zamonaviy ko'rinish uchun).
* **Sarlavhalar zichligi (Tracking/Weight):** Sarlavhalar qalin (`font-bold` yoki `font-extrabold`) va harflar orasi biroz siqilgan (`tracking-tight`) bo'lishi shart.
* **Matnlar:** Qop-qora emas, o'qishga qulay to'q kulrang (`text-slate-600` yoki `text-slate-700`). Eslatma: "Eyebrow badge" kabi dumaloq yozuvlar umuman ishlatilmaydi.

## 7. Ikonkalar
* **Kutubxona:** `Lucide React`
* **Xususiyati:** Barcha ikonkalar bir xil qalinlikda bo'lishi shart (`strokeWidth={2}`). Ikonkalar iloji boricha sodda va minimalist tanlanishi kerak.

## 8. Holatlar (States)
* **Hover effektlari:** 
  - Tugmalar (Buttons): Rangi bitta pog'ona to'qlashadi (`hover:bg-blue-700`), o'lchami o'zgarmaydi.
  - Kartalar (Cards): Hover paytida yengil soya qo'shiladi (`hover:shadow-md`) va biroz tepaga ko'tariladi (`hover:-translate-y-1`).
  - Rasmlar (Images): Sekin va silliq ichkariga kattalashadi (Zoom-in effekti: `transition-transform hover:scale-105`).
* **Yuklanish ko'rinishi (Loading):** Ortiqcha animatsiyalar yoki yorqin gradientlarsiz, toza kulrang puls uruvchi qutilar (`Skeleton` komponenti). Yaltiroq effektlar ishlatilmaydi.
