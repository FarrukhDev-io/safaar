-- Make partner walk-in bookings possible without creating fake users.
ALTER TABLE "bookings" ALTER COLUMN "user_id" DROP NOT NULL;

ALTER TABLE "bookings" DROP CONSTRAINT IF EXISTS "bookings_user_id_fkey";
ALTER TABLE "bookings"
  ADD CONSTRAINT "bookings_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- Persist partner team roles in the existing partner users table.
ALTER TABLE "partner_users"
  ADD COLUMN IF NOT EXISTS "role" VARCHAR(64) NOT NULL DEFAULT 'operator';

-- Match partner API key runtime state with the service contract.
ALTER TABLE "partner_api_keys"
  ADD COLUMN IF NOT EXISTS "status" VARCHAR(32) NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Persist user avatar and bonus ledger.
ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "avatar_media_id" UUID;

ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_avatar_media_id_fkey";
ALTER TABLE "users"
  ADD CONSTRAINT "users_avatar_media_id_fkey"
  FOREIGN KEY ("avatar_media_id") REFERENCES "media_files"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "user_bonus_ledger" (
  "id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "amount" DECIMAL(18,2) NOT NULL,
  "reason" TEXT NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "user_bonus_ledger_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "user_bonus_ledger_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "user_bonus_ledger_user_id_created_at_idx"
  ON "user_bonus_ledger"("user_id", "created_at");

CREATE TABLE IF NOT EXISTS "user_deletion_requests" (
  "id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "status" VARCHAR(32) NOT NULL DEFAULT 'requested',
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "resolved_at" TIMESTAMPTZ,
  CONSTRAINT "user_deletion_requests_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "user_deletion_requests_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "user_deletion_requests_user_id_status_idx"
  ON "user_deletion_requests"("user_id", "status");

-- Persist user notification preferences instead of keeping them in memory.
CREATE TABLE IF NOT EXISTS "user_notification_preferences" (
  "user_id" UUID NOT NULL,
  "sms" BOOLEAN NOT NULL DEFAULT true,
  "email" BOOLEAN NOT NULL DEFAULT true,
  "push" BOOLEAN NOT NULL DEFAULT true,
  "in_app" BOOLEAN NOT NULL DEFAULT true,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "user_notification_preferences_pkey" PRIMARY KEY ("user_id"),
  CONSTRAINT "user_notification_preferences_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

-- Persist push tokens for notification delivery.
CREATE TABLE IF NOT EXISTS "push_tokens" (
  "id" UUID NOT NULL,
  "owner_type" VARCHAR(32) NOT NULL,
  "owner_id" UUID NOT NULL,
  "token" TEXT NOT NULL,
  "platform" VARCHAR(32) NOT NULL DEFAULT 'web',
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deleted_at" TIMESTAMPTZ,
  CONSTRAINT "push_tokens_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "push_tokens_owner_type_owner_id_deleted_at_idx"
  ON "push_tokens"("owner_type", "owner_id", "deleted_at");

-- Persist partner compliance/application documents.
CREATE TABLE IF NOT EXISTS "partner_documents" (
  "id" UUID NOT NULL,
  "organization_id" UUID NOT NULL,
  "type" VARCHAR(64) NOT NULL,
  "file_id" UUID,
  "status" VARCHAR(32) NOT NULL DEFAULT 'uploaded',
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "partner_documents_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "partner_documents_organization_id_fkey"
    FOREIGN KEY ("organization_id") REFERENCES "partner_organizations"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "partner_documents_organization_id_status_idx"
  ON "partner_documents"("organization_id", "status");

-- Persist partner webhook delivery attempts.
CREATE TABLE IF NOT EXISTS "partner_webhook_deliveries" (
  "id" UUID NOT NULL,
  "endpoint_id" UUID NOT NULL,
  "event_type" VARCHAR(80) NOT NULL,
  "status" VARCHAR(32) NOT NULL DEFAULT 'queued',
  "payload" JSONB,
  "response_status" INTEGER,
  "response_body" TEXT,
  "attempted_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "partner_webhook_deliveries_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "partner_webhook_deliveries_endpoint_id_fkey"
    FOREIGN KEY ("endpoint_id") REFERENCES "partner_webhook_endpoints"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "partner_webhook_deliveries_endpoint_id_created_at_idx"
  ON "partner_webhook_deliveries"("endpoint_id", "created_at");

CREATE INDEX IF NOT EXISTS "partner_webhook_deliveries_status_created_at_idx"
  ON "partner_webhook_deliveries"("status", "created_at");
