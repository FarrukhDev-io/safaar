-- `users.password_hash` schema.prisma'da hech qachon bo'lmagan, lekin
-- userLogin/userResetPassword bu ustunga tayanardi — chaqirilsa
-- "column does not exist" xatosi bilan buzilardi. Bu ustun endi
-- qo'shiladi (nullable — telefon+SMS OTP orqali kiruvchi userlar
-- parol o'rnatmasligi mumkin).
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "password_hash" VARCHAR(255);
