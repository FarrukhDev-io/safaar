# Safaar Backend Dev — Topshiriqlar va Texnik Talablar (Tasks for Other Devs)

Bu faylda frontend (`web-user`) ishlab chiqish davomida backend uchun aniqlangan talablar va kelgusi integratsiyalar ro'yxatga olingan.

---

## 1. Geo-Location & Geo-Bounds API (Xarita va Koordinatalar Integratsiyasi)

### 🎯 Maqsad
`/hotels`, `/restaurants` va `/attractions` kataloglarida foydalanuvchilar ob'ektlarni interaktiv xaritada ko'rishlari hamda xaritani siljitganda (pan/zoom) joriy ekranga mos ob'ektlarni geo-bound filtrlar orqali olish.

### 📋 Backend Talablari:

1. **Database Schema Update (Prisma / PostgreSQL):**
   `Hotel`, `Restaurant`, `Attraction` modellariga quyidagi maydonlarni qo'shish:
   - `latitude`: `Float` (masalan: `41.2995`)
   - `longitude`: `Float` (masalan: `69.2401`)
   - (Ixtiyoriy/Tavsiya): PostgreSQL PostGIS kengaytmasi yordamida `GEOMETRY(Point, 4326)` spatial indeksi.

2. **Geo-Bounding Box Search Filter:**
   Quyidagi API endpointlariga `bounds` query parametrini qo'shish:
   - `GET /v1/hotels?bounds=sw_lat,sw_lng,ne_lat,ne_lng`
   - `GET /v1/restaurants?bounds=sw_lat,sw_lng,ne_lat,ne_lng`
   - `GET /v1/attractions?bounds=sw_lat,sw_lng,ne_lat,ne_lng`

   **SQL Query Filtering Logic:**
   ```sql
   SELECT * FROM hotels
   WHERE latitude BETWEEN $1::numeric AND $3::numeric
     AND longitude BETWEEN $2::numeric AND $4::numeric;
   ```

3. **Response DTO Contracts:**
   Barcha katalog response ob'ektlariga `latitude` hamda `longitude` maydonlarini qo'shish:
   ```json
   {
     "id": "hotel-uuid",
     "name": "Hyatt Regency Tashkent",
     "latitude": 41.3145,
     "longitude": 69.2798,
     "minPriceSum": 1800000
   }
   ```

---

## 2. Multi-Currency System & Dynamic Exchange Rates API (Markaziy Bank Integratsiyasi)

### 🎯 Maqsad
Xalqaro turistlar uchun O'zbekiston Markaziy Banki (cbu.uz API) real vaqt rejimidagi valyuta kurslari bo'yicha `USD`, `EUR`, `RUB` narxlarini avtomatik dinamik konvertatsiya qilish.

### 📋 Backend Talablari:

1. **Exchange Rates Endpoint:**
   - `GET /v1/currency/rates`
   - Public endpoint (avtorizatsiyasiz ochiq).

2. **CBU.uz Integration & Cron Caching:**
   - Har kuni soat 09:00 da `https://cbu.uz/uz/arkhiv-kursov-valyut/json/` rasmiy API'sidan `USD`, `EUR`, `RUB` kurslarini olish.
   - Olingan valyuta kurslarini Redis yoki PostgreSQL `currency_rates` jadvalida keshlab borish.

3. **Response DTO Format:**
   ```json
   {
     "base": "UZS",
     "updatedAt": "2026-07-25T09:00:00.000Z",
     "rates": {
       "UZS": 1,
       "USD": 12650,
       "EUR": 13800,
       "RUB": 140
     }
   }
   ```

---

## 3. Real-time Live Support Chat WebSockets Gateway (`/ws/chat`)

### 🎯 Maqsad
Foydalanuvchilar (`web-user`) va Qo'llab-quvvatlash operatorlari (`web-admin` / `web-partner`) o'rtasida real vaqt rejimidagi (Real-time WebSockets) muloqotni hamda chat tarixini DB da saqlashni yo'lga qo'yish.

### 📋 Backend Talablari:

1. **NestJS WebSockets Gateway (`@nestjs/websockets` / Socket.io / WsAdapter):**
   - Gateway Namespace: `/ws/chat`
   - WebSocket Auth Handshake: `Authorization: Bearer <token>` or query parameter `token`.

2. **Events Contract:**
   - `client:join_room` -> `{ roomId: string }`
   - `client:send_message` -> `{ roomId: string, text: string }`
   - `server:receive_message` -> `{ id: string, senderId: string, senderType: 'user' | 'operator', text: string, createdAt: string }`
   - `server:typing_status` -> `{ roomId: string, isTyping: boolean }`

3. **Database Schema Update (Prisma / PostgreSQL):**
   - `ChatRoom`: `id`, `userId`, `status` (`OPEN` | `RESOLVED`), `createdAt`
   - `ChatMessage`: `id`, `roomId`, `senderId`, `senderType`, `text`, `readAt`, `createdAt`

---

## 4. Photo Reviews, 4 Rating Criteria & S3 File Upload API

### 🎯 Maqsad
Foydalanuvchilar tomonidan mehmonxonalar uchun 4 ta mezon bo'yicha baholash (`Cleanliness`, `Staff`, `Location`, `ValueForMoney`), rasmlar yuklash (Multipart File Upload) va verified booking tekshiruvidan o'tgan holda sharh qoldirish.

### 📋 Backend Talablari:

1. **Photo Upload Endpoint (`POST /v1/reviews/photos`):**
   - Accept: `multipart/form-data` (max 5 photos per request, max 10MB per file).
   - Storage: AWS S3 / MinIO / Cloudinary.
   - Response: `{ "urls": ["https://s3.safaar.uz/reviews/photo-1.jpg"] }`

2. **Create Review Endpoint (`POST /v1/reviews`):**
   - Body DTO:
     ```json
     {
       "targetId": "hotel-uuid",
       "targetType": "hotel",
       "rating": 4.9,
       "cleanliness": 5,
       "staff": 5,
       "location": 5,
       "valueForMoney": 4.5,
       "body": "Juda ham ajoyib mehmonxona...",
       "photos": ["https://s3.safaar.uz/reviews/photo-1.jpg"]
     }
     ```

3. **Verified Guest Booking Check Guard:**
   - Sharh qoldirishdan oldin foydalanuvchi ushbu mehmonxonada kamida 1 marta tasdiqlangan (`CONFIRMED` / `CHECKED_OUT`) bron holatiga ega ekanligini bazadan tekshirish.

---

## 5. Business Intelligence & Analytics Event Ingestion API (`POST /v1/analytics/events`)

### 🎯 Maqsad
Platformaning umumiy bron qilish konversiyasini (Conversion Rate), eng ommabop qidiruv yo'nalishlarini (Popular Destinations) va to'lov tizimlari ulushini (Payment Method Shares) tahlil qilish uchun Custom Analytics Ingestion logikasini qurish.

### 📋 Backend Talablari:

1. **Event Ingestion Endpoint:**
   - `POST /v1/analytics/events`
   - Public / Session-aware endpoint (foydalanuvchi sessiyasi bo'lsa `userId` ni bog'lash).
   - Body DTO:
     ```json
     {
       "eventName": "booking_completed",
       "params": {
         "bookingId": "bk-12345",
         "totalSum": 2500000,
         "paymentMethod": "payme"
       },
       "timestamp": "2026-07-25T15:15:00.000Z"
     }
     ```

2. **Analytics Dashboard API (`GET /v1/admin/analytics/dashboard`):**
   - Super Admin dashboardi uchun Conversion Funnel statistikalarini qaytarish:
     - `search_performed` -> `hotel_viewed` -> `booking_started` -> `booking_completed`
