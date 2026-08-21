CREATE TABLE "internal_notes" (
  "id" UUID NOT NULL,
  "entity_type" VARCHAR(32) NOT NULL,
  "entity_id" UUID NOT NULL,
  "author_id" UUID,
  "author_name" VARCHAR(255),
  "body" TEXT NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "internal_notes_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "internal_notes_entity_type_entity_id_created_at_idx"
  ON "internal_notes" ("entity_type", "entity_id", "created_at");
