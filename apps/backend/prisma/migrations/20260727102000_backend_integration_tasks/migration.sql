-- Geo fields for CMS-backed restaurants and attractions.
ALTER TABLE "cms_entries"
  ADD COLUMN IF NOT EXISTS "latitude" DECIMAL(10,7),
  ADD COLUMN IF NOT EXISTS "longitude" DECIMAL(10,7);

UPDATE "cms_entries"
SET
  "latitude" = COALESCE(
    "latitude",
    CASE
      WHEN metadata ->> 'latitude' ~ '^-?[0-9]+(\.[0-9]+)?$' THEN (metadata ->> 'latitude')::numeric
    END,
    CASE
      WHEN metadata ->> 'lat' ~ '^-?[0-9]+(\.[0-9]+)?$' THEN (metadata ->> 'lat')::numeric
    END
  ),
  "longitude" = COALESCE(
    "longitude",
    CASE
      WHEN metadata ->> 'longitude' ~ '^-?[0-9]+(\.[0-9]+)?$' THEN (metadata ->> 'longitude')::numeric
    END,
    CASE
      WHEN metadata ->> 'lng' ~ '^-?[0-9]+(\.[0-9]+)?$' THEN (metadata ->> 'lng')::numeric
    END,
    CASE
      WHEN metadata ->> 'lon' ~ '^-?[0-9]+(\.[0-9]+)?$' THEN (metadata ->> 'lon')::numeric
    END
  )
WHERE "type" IN ('restaurant', 'attraction');

CREATE INDEX IF NOT EXISTS "cms_entries_type_latitude_longitude_idx"
  ON "cms_entries"("type", "latitude", "longitude");

-- Reviews: photo attachments and detailed rating criteria.
ALTER TABLE "reviews"
  ALTER COLUMN "rating" TYPE DECIMAL(2,1) USING "rating"::numeric(2,1),
  ADD COLUMN IF NOT EXISTS "cleanliness" DECIMAL(2,1),
  ADD COLUMN IF NOT EXISTS "staff" DECIMAL(2,1),
  ADD COLUMN IF NOT EXISTS "location" DECIMAL(2,1),
  ADD COLUMN IF NOT EXISTS "value_for_money" DECIMAL(2,1),
  ADD COLUMN IF NOT EXISTS "photos" JSONB NOT NULL DEFAULT '[]'::jsonb;

-- Live chat.
DO $$
BEGIN
  CREATE TYPE "ChatRoomStatus" AS ENUM ('OPEN', 'RESOLVED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "chat_rooms" (
  "id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "status" "ChatRoomStatus" NOT NULL DEFAULT 'OPEN',
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "chat_rooms_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "chat_rooms_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "chat_messages" (
  "id" UUID NOT NULL,
  "room_id" UUID NOT NULL,
  "sender_id" UUID NOT NULL,
  "sender_type" VARCHAR(32) NOT NULL,
  "text" TEXT NOT NULL,
  "read_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "chat_messages_room_id_fkey"
    FOREIGN KEY ("room_id") REFERENCES "chat_rooms"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "chat_rooms_user_id_status_idx"
  ON "chat_rooms"("user_id", "status");
CREATE INDEX IF NOT EXISTS "chat_rooms_status_created_at_idx"
  ON "chat_rooms"("status", "created_at");
CREATE INDEX IF NOT EXISTS "chat_messages_room_id_created_at_idx"
  ON "chat_messages"("room_id", "created_at");
CREATE INDEX IF NOT EXISTS "chat_messages_sender_id_created_at_idx"
  ON "chat_messages"("sender_id", "created_at");

-- CBU-backed exchange rates.
CREATE TABLE IF NOT EXISTS "currency_rates" (
  "id" UUID NOT NULL,
  "code" CHAR(3) NOT NULL,
  "base" CHAR(3) NOT NULL DEFAULT 'UZS',
  "rate" DECIMAL(18,6) NOT NULL,
  "source" VARCHAR(80) NOT NULL DEFAULT 'cbu.uz',
  "effective_date" DATE,
  "fetched_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "currency_rates_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "currency_rates_code_fetched_at_idx"
  ON "currency_rates"("code", "fetched_at");
CREATE INDEX IF NOT EXISTS "currency_rates_effective_date_idx"
  ON "currency_rates"("effective_date");

-- Session-aware analytics events.
CREATE TABLE IF NOT EXISTS "analytics_events" (
  "id" UUID NOT NULL,
  "user_id" UUID,
  "session_id" VARCHAR(120),
  "event_name" VARCHAR(120) NOT NULL,
  "params" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "occurred_at" TIMESTAMPTZ NOT NULL,
  "received_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "user_agent" TEXT,
  "ip" VARCHAR(80),
  CONSTRAINT "analytics_events_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "analytics_events_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id")
    ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "analytics_events_event_name_occurred_at_idx"
  ON "analytics_events"("event_name", "occurred_at");
CREATE INDEX IF NOT EXISTS "analytics_events_user_id_occurred_at_idx"
  ON "analytics_events"("user_id", "occurred_at");
CREATE INDEX IF NOT EXISTS "analytics_events_session_id_occurred_at_idx"
  ON "analytics_events"("session_id", "occurred_at");
