-- Uzum CHECKOUT integratsiyasi (Merchant API'dan MUTLAQO ALOHIDA).
--
-- `PaymentMethod` pg enum'iga `uzum_checkout` qiymatini qo'shamiz — Checkout
-- to'lovlari `payments.provider = 'uzum_checkout'` bilan yoziladi va shu orqali
-- Merchant (`provider = 'uzum'`) to'lovlaridan ajratiladi. `payments.provider`
-- va `bookings.payment_method` shu enum'ni ishlatadi.
--
-- `ALTER TYPE ... ADD VALUE IF NOT EXISTS` — mavjud production ma'lumotlarini
-- buzmaydi, backward-compatible, additive. Precedent:
--   20260725124500_extended_partner_types,
--   20260804060000_restaurant_booking_type,
--   20260901000000_uzum_payment_method.
--
-- `PaymentStatus` o'zgarmaydi: Checkout callback faqat mavjud `paid` / `failed`
-- (va `processPaymentEvent` orqali) holatlarini ishlatadi.

ALTER TYPE "PaymentMethod" ADD VALUE IF NOT EXISTS 'uzum_checkout';
