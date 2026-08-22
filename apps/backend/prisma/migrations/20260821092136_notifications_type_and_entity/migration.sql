ALTER TABLE "notifications" ADD COLUMN "type" VARCHAR(64);
ALTER TABLE "notifications" ADD COLUMN "related_entity_type" VARCHAR(32);
ALTER TABLE "notifications" ADD COLUMN "related_entity_id" UUID;
