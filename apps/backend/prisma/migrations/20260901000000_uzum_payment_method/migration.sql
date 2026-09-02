-- Uzum Bank Merchant API integratsiyasi.
--
-- 1) `PaymentMethod` pg enum'iga `uzum` qiymatini qo'shamiz
--    (`payments.provider` va `bookings.payment_method` shu enum'ni ishlatadi).
-- 2) `PaymentStatus` pg enum'iga `reversed` qiymatini qo'shamiz — bank
--    tomonidan (Uzum `/reverse`) bekor qilingan to'lovni admin tomonidan
--    boshlanadigan `refunded` refund oqimidan semantik jihatdan ajratish uchun.
--
-- `ALTER TYPE ... ADD VALUE IF NOT EXISTS` — mavjud production ma'lumotlarini
-- buzmaydi, backward-compatible. Precedent:
--   20260725124500_extended_partner_types, 20260804060000_restaurant_booking_type.

ALTER TYPE "PaymentMethod" ADD VALUE IF NOT EXISTS 'uzum';
ALTER TYPE "PaymentStatus" ADD VALUE IF NOT EXISTS 'reversed';
