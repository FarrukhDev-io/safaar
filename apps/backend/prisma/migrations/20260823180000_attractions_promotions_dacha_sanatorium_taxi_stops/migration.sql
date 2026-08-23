-- CreateEnum
CREATE TYPE "AttractionCategory" AS ENUM ('historical', 'nature', 'museum', 'architectural', 'religious', 'culinary');

-- AlterEnum: dacha/sanatorium/resort partner turlari
ALTER TYPE "PartnerOrganizationType" ADD VALUE IF NOT EXISTS 'sanatorium';
ALTER TYPE "PartnerOrganizationType" ADD VALUE IF NOT EXISTS 'resort';

-- CreateTable
CREATE TABLE IF NOT EXISTS "attractions" (
  "id" UUID NOT NULL,
  "city_id" UUID NOT NULL,
  "slug" VARCHAR(255) NOT NULL,
  "title" JSONB NOT NULL,
  "description" JSONB NOT NULL,
  "category" "AttractionCategory" NOT NULL DEFAULT 'historical',
  "cover_image_url" TEXT,
  "gallery_images" JSONB NOT NULL DEFAULT '[]',
  "latitude" DECIMAL(10,7),
  "longitude" DECIMAL(10,7),
  "ticket_price" DECIMAL(18,2),
  "opening_hours" VARCHAR(100),
  "recommended_visit_duration_minutes" INTEGER,
  "rating_average" DECIMAL(3,2) NOT NULL DEFAULT 0,
  "reviews_count" INTEGER NOT NULL DEFAULT 0,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "attractions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "attractions_slug_key" UNIQUE ("slug"),
  CONSTRAINT "attractions_city_id_fkey"
    FOREIGN KEY ("city_id") REFERENCES "cities"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "attractions_city_id_idx" ON "attractions"("city_id");
CREATE INDEX IF NOT EXISTS "attractions_category_idx" ON "attractions"("category");
CREATE INDEX IF NOT EXISTS "attractions_is_active_rating_average_idx" ON "attractions"("is_active", "rating_average");

-- CreateTable
CREATE TABLE IF NOT EXISTS "promotion_banners" (
  "id" UUID NOT NULL,
  "title" JSONB NOT NULL,
  "subtitle" JSONB,
  "badge_text" VARCHAR(50),
  "image_url" TEXT NOT NULL,
  "target_url" TEXT,
  "discount_percentage" INTEGER,
  "start_date" TIMESTAMPTZ NOT NULL,
  "end_date" TIMESTAMPTZ NOT NULL,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "promotion_banners_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "promotion_banners_is_active_sort_order_idx" ON "promotion_banners"("is_active", "sort_order");

-- CreateTable: yo'nalish oraliq bekatlari (masalan Toshkent -> Jizzax -> Samarqand)
CREATE TABLE IF NOT EXISTS "trip_stops" (
  "id" UUID NOT NULL,
  "trip_id" UUID NOT NULL,
  "city_id" UUID NOT NULL,
  "stop_order" INTEGER NOT NULL,
  "arrival_offset_minutes" INTEGER,
  "departure_offset_minutes" INTEGER,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "trip_stops_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "trip_stops_trip_id_stop_order_key" UNIQUE ("trip_id", "stop_order"),
  CONSTRAINT "trip_stops_trip_id_fkey"
    FOREIGN KEY ("trip_id") REFERENCES "trips"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "trip_stops_city_id_fkey"
    FOREIGN KEY ("city_id") REFERENCES "cities"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "trip_stops_trip_id_idx" ON "trip_stops"("trip_id");

-- AlterTable: dacha va sanatoriy uchun qo'shimcha xususiyatlar
ALTER TABLE "hotels"
  ADD COLUMN IF NOT EXISTS "land_area_sotix" INTEGER,
  ADD COLUMN IF NOT EXISTS "has_outdoor_pool" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "has_indoor_pool" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "has_sauna" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "has_playstation" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "has_billiards" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "capacity_people" INTEGER,
  ADD COLUMN IF NOT EXISTS "medical_profiles" JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS "included_treatments" JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS "meal_plan_type" VARCHAR(64);

-- AlterTable: taksi/shaxsiy transfer uchun qo'shimcha mezonlar
ALTER TABLE "vehicles"
  ADD COLUMN IF NOT EXISTS "fuel_type" VARCHAR(32),
  ADD COLUMN IF NOT EXISTS "has_ac" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "luggage_capacity_bags" INTEGER,
  ADD COLUMN IF NOT EXISTS "photos" JSONB NOT NULL DEFAULT '[]';
