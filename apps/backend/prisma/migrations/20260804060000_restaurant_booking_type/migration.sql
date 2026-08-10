-- Restoran (stol/vaqt-slot asosidagi) bronlarni haqiqiy qo'llab-quvvatlash.
-- 1) BookingType enum'iga 'restaurant' qiymati qo'shiladi (mavjud: hotel, bus).
--    Postgres cheklovi: yangi enum qiymati o'sha TRANZAKSIYA ichida ishlatilishi
--    mumkin emas, shuning uchun quyidagi backfill 'restaurant'dan foydalanmaydi.
ALTER TYPE "BookingType" ADD VALUE IF NOT EXISTS 'restaurant';

-- 2) `bookings` jadvaliga xona/stol, sana va vaqt-slot uchun haqiqiy ustunlar
--    qo'shiladi — ilgari bular faqat JSONB (`price_snapshot`/`policy_snapshot`)
--    ichida yashiringan bo'lib, SQL orqali indekslab/tekshirib bo'lmasdi.
ALTER TABLE "bookings"
  ADD COLUMN IF NOT EXISTS "room_id" UUID REFERENCES "hotel_rooms"("id") ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS "check_in" DATE,
  ADD COLUMN IF NOT EXISTS "check_out" DATE,
  ADD COLUMN IF NOT EXISTS "slot_time" TIME;

-- 3) Mavjud (hotel turidagi) bronlarni JSONB'dan backfill qilish.
UPDATE "bookings"
SET
  "room_id" = COALESCE("room_id", NULLIF(price_snapshot ->> 'room_id', '')::uuid),
  "check_in" = COALESCE(
    "check_in",
    NULLIF(COALESCE(price_snapshot ->> 'check_in', policy_snapshot ->> 'check_in'), '')::date
  ),
  "check_out" = COALESCE(
    "check_out",
    NULLIF(COALESCE(price_snapshot ->> 'check_out', policy_snapshot ->> 'check_out'), '')::date
  ),
  "slot_time" = COALESCE(
    "slot_time",
    NULLIF(COALESCE(price_snapshot ->> 'slot_time', policy_snapshot ->> 'slot_time'), '')::time
  )
WHERE "type" = 'hotel';

-- 4) Bir xona/stol uchun band qilingan sanalarni tez qidirish uchun indeks.
CREATE INDEX IF NOT EXISTS "bookings_room_id_check_in_idx"
  ON "bookings" ("room_id", "check_in")
  WHERE "room_id" IS NOT NULL;
