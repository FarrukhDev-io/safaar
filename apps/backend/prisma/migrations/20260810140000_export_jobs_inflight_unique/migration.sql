-- M-2: bir xil (owner, type, format) uchun bir vaqtda faqat bitta
-- "queued"/"processing" export_jobs qatori bo'lishini DB darajasida
-- kafolatlaydi — aks holda parallel/takroriy so'rovlar bir xil export'ni
-- bir necha marta yaratib, ortiqchalari abadiy "queued" holida qolib
-- ketardi.
CREATE UNIQUE INDEX IF NOT EXISTS "export_jobs_inflight_unique"
  ON "export_jobs" ("owner_type", "owner_id", "type", "format")
  WHERE "status" IN ('queued', 'processing');
