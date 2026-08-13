ALTER TABLE "vehicles" ADD COLUMN "price_per_day" DECIMAL(18,2) NOT NULL DEFAULT 0;

ALTER TABLE "bookings" ADD COLUMN "vehicle_id" UUID;
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_vehicle_id_fkey"
  FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "bookings_vehicle_id_check_in_idx" ON "bookings" ("vehicle_id", "check_in")
  WHERE "vehicle_id" IS NOT NULL;
