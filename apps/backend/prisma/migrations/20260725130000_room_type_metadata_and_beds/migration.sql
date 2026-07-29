ALTER TABLE "room_types"
  ADD COLUMN IF NOT EXISTS "description" TEXT,
  ADD COLUMN IF NOT EXISTS "image_url" TEXT,
  ADD COLUMN IF NOT EXISTS "bed_type" VARCHAR(80),
  ADD COLUMN IF NOT EXISTS "size_sqm" INTEGER,
  ADD COLUMN IF NOT EXISTS "base_price" DECIMAL(18, 2),
  ADD COLUMN IF NOT EXISTS "capacity" INTEGER,
  ADD COLUMN IF NOT EXISTS "amenities" JSONB NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE "hotel_rooms"
  ADD COLUMN IF NOT EXISTS "floor" INTEGER,
  ADD COLUMN IF NOT EXISTS "housekeeping_status" VARCHAR(32) NOT NULL DEFAULT 'VACANT_CLEAN',
  ADD COLUMN IF NOT EXISTS "is_listed" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "hotels"
  ADD COLUMN IF NOT EXISTS "nearby_places" JSONB NOT NULL DEFAULT '[]'::jsonb;

CREATE TABLE IF NOT EXISTS "room_beds" (
  "id" UUID NOT NULL,
  "room_id" UUID NOT NULL,
  "label" VARCHAR(80) NOT NULL,
  "status" VARCHAR(32) NOT NULL DEFAULT 'VACANT_CLEAN',
  "is_listed" BOOLEAN NOT NULL DEFAULT true,
  "nightly_price" DECIMAL(18, 2),
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "room_beds_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "room_beds_room_id_label_key"
  ON "room_beds"("room_id", "label");

CREATE INDEX IF NOT EXISTS "room_beds_room_id_status_idx"
  ON "room_beds"("room_id", "status");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'room_beds_room_id_fkey'
  ) THEN
    ALTER TABLE "room_beds"
      ADD CONSTRAINT "room_beds_room_id_fkey"
      FOREIGN KEY ("room_id") REFERENCES "hotel_rooms"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
