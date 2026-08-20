-- Pul yechish so'rovi frontendda hamkorning bank hisob raqamini yig'ib
-- olayotgan edi, lekin backend uni hech qayerda saqlamas edi — moliya
-- bo'limi qayerga pul o'tkazishni bilmay qolardi. `IF NOT EXISTS` — bu
-- migratsiya production'da ustunni tasodifan qayta yaratib qo'ymasin.
ALTER TABLE "withdrawal_requests" ADD COLUMN IF NOT EXISTS "bank_account" VARCHAR(255);
