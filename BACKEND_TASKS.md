# Backend Tasks for Guest Checkout

**Assalomu alaykum Backend Developer!**

Biz Frontend tomonda (Agoda kabi) foydalanuvchilar ro'yxatdan o'tmasdan ham bron qila olishi uchun (Guest Checkout) imkoniyatini qo'shdik. Ammo bu to'liq ishlashi uchun API va ma'lumotlar bazasida ham moslashtirish ishlari kerak.

## Qilingan o'zgarishlar (Frontend)
1. **`web-user`** qismida bron qilish sahifasidagi (`booking/page.tsx`) majburiy `/login` ga yo'naltirish qismi olib tashlandi.
2. Checkout formaga yangi maydonlar qo'shildi:
   - `firstName` (Ism)
   - `lastName` (Familiya)
   - `email` (Elektron pochta)
   - `phone` (Telefon raqami)
3. API so'roviga (`createHotelBooking`) yuboriladigan payload (Data) ga ushbu maydonlar qo'shib yuborilmoqda. Agar foydalanuvchi tizimga kirmagan bo'lsa, `token` qismi `undefined` bo'lib boradi.

## Sizdan talab qilinadigan o'zgarishlar (Backend & Types)
1. **API Endpoint:** `POST /bookings/hotel` yoki unga mos tushuvchi endpoint (hozirda `createHotelBooking` funksiyasi) endi faqat avtorizatsiyadan o'tgan foydalanuvchilarni emas, balki "Guest" (mehmon) larni ham qabul qila olishi kerak. Ya'ni Authorization header (Token) bo'lmaganida 401 qaytarmasligi kerak (agar bron qilish so'rovi bo'lsa).
2. **DTO & Types (`@safaar/types`):** Booking yaratish DTO'siga `firstName`, `lastName`, `email`, `phone` qismlarini qo'shing. Hozirda Frontend'da bu qiymatlar TypeScript xato bermasligi uchun `@ts-expect-error` qilib qo'yildi. Siz turlarni yangilaganingizdan keyin uni olib tashlaymiz.
3. **Database:** Agar booking yaratilayotgan bo'lsa va foydalanuvchi Guest bo'lsa, uni bazaga alohida User sifatida kiritib, ID berib yuborasizmi yoki Booking jadvaliga to'g'ridan-to'g'ri `guestEmail`, `guestPhone` deb saqlaysizmi, o'zingiz hal qilasiz (Biz uchun farqi yo'q). Muhimi, bizga qaytadigan `bookingId` to'g'ri ishlashi va to'lovga (Payment) o'tib ketishi kerak.
4. Xuddi shu mantiqni keyinchalik **Bus Booking** (`createBusBooking`) uchun ham kiritishingiz kerak bo'lishi mumkin.

Iltimos, ushbu API qismini to'g'rilab, yangi Type'larni kompile qilib (`npm run build:types`) chiqaring. Rahmat!
