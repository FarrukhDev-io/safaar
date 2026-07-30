# Safaar Backend Dev — Topshiriqlar va Texnik Talablar (Tasks for Other Devs)

Bu faylda frontend (`web-user`) ishlab chiqish davomida backend uchun aniqlangan talablar, integratsiyalar va ularning bajarilish holatlari ro'yxatga olingan.

---

## 1. Geo-Location & Geo-Bounds API (Xarita va Koordinatalar Integratsiyasi) — Bajarilgan ✅

### 🎯 Maqsad
`/hotels`, `/restaurants` va `/attractions` kataloglarida foydalanuvchilar ob'ektlarni interaktiv xaritada ko'rishlari hamda xaritani siljitganda (pan/zoom) joriy ekranga mos ob'ektlarni geo-bound filtrlar orqali olish.

### 📋 Tasdiqlovchi Backend Kodlari va Joylashuvi:
- **Geo-Bounds parsing helper:** [apps/backend/src/common/geo-bounds.ts](file:///home/farrukh/Frontend/safaar/apps/backend/src/common/geo-bounds.ts)
- **Hotels query parameters & geo-filtering:** [apps/backend/src/hotels/hotels.service.ts](file:///home/farrukh/Frontend/safaar/apps/backend/src/hotels/hotels.service.ts) (bounds query handler va SQL shartlari yozilgan)
- **Catalog items (Restaurants & Attractions) geo-bounds filtering:** [apps/backend/src/catalog/catalog.service.ts](file:///home/farrukh/Frontend/safaar/apps/backend/src/catalog/catalog.service.ts) (`boundsConditions` funksiyasi va SQL generatori)

---

## 2. Multi-Currency System & Dynamic Exchange Rates API (Markaziy Bank Integratsiyasi) — Bajarilgan ✅

### 🎯 Maqsad
Xalqaro turistlar uchun O'zbekiston Markaziy Banki (cbu.uz API) real vaqt rejimidagi valyuta kurslari bo'yicha `USD`, `EUR`, `RUB` narxlarini avtomatik dinamik konvertatsiya qilish.

### 📋 Tasdiqlovchi Backend Kodlari va Joylashuvi:
- **Exchange Rates Controller:** [apps/backend/src/currency/currency.controller.ts](file:///home/farrukh/Frontend/safaar/apps/backend/src/currency/currency.controller.ts) (`GET /currency/rates` endpoint)
- **Currency Exchange Service:** [apps/backend/src/currency/currency.service.ts](file:///home/farrukh/Frontend/safaar/apps/backend/src/currency/currency.service.ts) (CBU integratsiyasi va kesh/cron logikasi)

---

## 3. Real-time Live Support Chat WebSockets Gateway (`/ws/chat`) — Bajarilgan ✅

### 🎯 Maqsad
Foydalanuvchilar (`web-user`) va Qo'llab-quvvatlash operatorlari (`web-admin` / `web-partner`) o'rtasida real vaqt rejimidagi (Real-time WebSockets) muloqotni hamda chat tarixini DB da saqlashni yo'lga qo'yish.

### 📋 Tasdiqlovchi Backend Kodlari va Joylashuvi:
- **WebSocket Chat Gateway:** [apps/backend/src/chat/chat.gateway.ts](file:///home/farrukh/Frontend/safaar/apps/backend/src/chat/chat.gateway.ts) (`ChatGateway` Socket.io va xonalar boshqaruvi)
- **WebSocket Chat Services:** [apps/backend/src/chat/chat.service.ts](file:///home/farrukh/Frontend/safaar/apps/backend/src/chat/chat.service.ts)

---

## 4. Photo Reviews, 4 Rating Criteria & S3 File Upload API — Bajarilgan ✅

### 🎯 Maqsad
Foydalanuvchilar tomonidan mehmonxonalar uchun 4 ta mezon bo'yicha baholash (`Cleanliness`, `Staff`, `Location`, `ValueForMoney`), rasmlar yuklash (Multipart File Upload) va verified booking tekshiruvidan o'tgan holda sharh qoldirish.

### 📋 Tasdiqlovchi Backend Kodlari va Joylashuvi:
- **Reviews REST API Controller:** [apps/backend/src/reviews/reviews.controller.ts](file:///home/farrukh/Frontend/safaar/apps/backend/src/reviews/reviews.controller.ts) (`POST /reviews` va verified check logikasi)
- **Reviews Operations Service:** [apps/backend/src/reviews/reviews.service.ts](file:///home/farrukh/Frontend/safaar/apps/backend/src/reviews/reviews.service.ts)

---

## 5. Business Intelligence & Analytics Event Ingestion API (`POST /v1/analytics/events`) — Bajarilgan ✅

### 🎯 Maqsad
Platformaning umumiy bron qilish konversiyasini (Conversion Rate), eng ommabop qidiruv yo'nalishlarini (Popular Destinations) va to'lov tizimlari ulushini (Payment Method Shares) tahlil qilish uchun Custom Analytics Ingestion logikasini qurish.

### 📋 Tasdiqlovchi Backend Kodlari va Joylashuvi:
- **Analytics Events Controller:** [apps/backend/src/analytics/analytics.controller.ts](file:///home/farrukh/Frontend/safaar/apps/backend/src/analytics/analytics.controller.ts) (`POST /analytics/events` ingestion API)
- **Analytics Ingestion Service:** [apps/backend/src/analytics/analytics.service.ts](file:///home/farrukh/Frontend/safaar/apps/backend/src/analytics/analytics.service.ts)
