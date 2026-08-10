ALTER TABLE "cms_entries"
  ALTER COLUMN "id" SET DEFAULT gen_random_uuid(),
  ALTER COLUMN "metadata" SET DEFAULT '{}'::jsonb;

UPDATE "cms_entries"
SET "metadata" = '{}'::jsonb
WHERE "metadata" IS NULL;

CREATE INDEX IF NOT EXISTS "cms_entries_public_pages_slug_idx"
  ON "cms_entries" ("slug")
  WHERE "type" = 'page'
    AND "status" IN ('published', 'active');

INSERT INTO "cms_entries" (
  "id",
  "type",
  "slug",
  "title",
  "body",
  "status",
  "metadata",
  "published_at",
  "created_at",
  "updated_at"
)
VALUES (
  gen_random_uuid(),
  'page',
  'about',
  '{"uz":"Biz haqimizda","ru":null,"en":"About us"}'::jsonb,
  '{"uz":"Safaar - O''zbekiston bo''ylab mehmonxona va dam olish joylarini bron qilish platformasi.","ru":null,"en":"Safaar is a booking platform for hotels and stays across Uzbekistan."}'::jsonb,
  'published',
  '{"menu":"footer","seoTitle":"Biz haqimizda","seoDescription":"Safaar platformasi haqida ma''lumot"}'::jsonb,
  now(),
  now(),
  now()
)
ON CONFLICT ("type", "slug") DO NOTHING;
