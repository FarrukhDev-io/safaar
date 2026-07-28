UPDATE "support_tickets"
SET "priority" = 'medium'
WHERE "priority" = 'normal';

ALTER TABLE "support_tickets"
ALTER COLUMN "priority" SET DEFAULT 'medium';
