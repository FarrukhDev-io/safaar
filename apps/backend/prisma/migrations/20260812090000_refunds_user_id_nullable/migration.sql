-- To'lov "expired"/"cancelled" bo'lib qolgan bronga webhook orqali kech
-- kelib qolishi mumkin (poyga holati — cron avval bronni tugatgan, lekin
-- pul haqiqatan kelgan). Bunday holda tizim pulni jim yo'qotib
-- yubormasligi uchun avtomatik "refunds" yozuvi yaratiladi — shu jumladan
-- login qilmagan (guest) mijozlar uchun ham, chunki mehmonxona/restoran
-- broni login talab qilmaydi. `user_id` shu sabab endi majburiy emas.
ALTER TABLE "refunds" ALTER COLUMN "user_id" DROP NOT NULL;
