-- Bonus-balance sxema drifti tuzatilmoqda: production bazasida "bonus_balance"
-- ustuni qo'lda (migratsiyasiz) qo'shilgan edi, shu sabab u hech qanday
-- migration faylida yo'q edi. IF NOT EXISTS ishlatilgan — bu migratsiya
-- production'da xavfsiz no-op bo'ladi (ustun allaqachon bor), lekin har
-- qanday yangi/toza muhitda (staging, disaster recovery, yangi developer)
-- to'g'ri yaratiladi.
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "bonus_balance" NUMERIC DEFAULT 0;
