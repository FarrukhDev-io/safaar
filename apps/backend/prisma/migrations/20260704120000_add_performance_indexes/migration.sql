-- Safe additive indexes for safaar backend list/search/dashboard workloads.
-- All indexes are non-destructive and preserve existing data.

create index if not exists "users_status_created_at_idx" on "users" ("status", "created_at");
create index if not exists "users_deleted_at_created_at_idx" on "users" ("deleted_at", "created_at");

create index if not exists "admin_users_deleted_at_created_at_idx" on "admin_users" ("deleted_at", "created_at");

create index if not exists "partner_organizations_city_id_status_idx" on "partner_organizations" ("city_id", "status");
create index if not exists "partner_organizations_status_created_at_idx" on "partner_organizations" ("status", "created_at");
create index if not exists "partner_users_email_idx" on "partner_users" ("email");

create index if not exists "hotels_partner_organization_id_status_idx" on "hotels" ("partner_organization_id", "status");
create index if not exists "hotels_status_created_at_idx" on "hotels" ("status", "created_at");
create index if not exists "hotels_status_rating_average_idx" on "hotels" ("status", "rating_average");
create index if not exists "hotels_status_stars_idx" on "hotels" ("status", "stars");

create index if not exists "room_inventory_date_idx" on "room_inventory" ("date");

create index if not exists "bus_companies_partner_organization_id_status_idx" on "bus_companies" ("partner_organization_id", "status");
create index if not exists "bus_companies_status_created_at_idx" on "bus_companies" ("status", "created_at");
create index if not exists "vehicles_company_id_status_idx" on "vehicles" ("company_id", "status");

create index if not exists "trips_status_departure_at_idx" on "trips" ("status", "departure_at");
create index if not exists "trips_route_id_departure_at_status_idx" on "trips" ("route_id", "departure_at", "status");
create index if not exists "trips_company_id_status_departure_at_idx" on "trips" ("company_id", "status", "departure_at");
create index if not exists "trip_seats_trip_id_status_idx" on "trip_seats" ("trip_id", "status");

create index if not exists "bookings_partner_organization_id_created_at_idx" on "bookings" ("partner_organization_id", "created_at");
create index if not exists "bookings_status_created_at_idx" on "bookings" ("status", "created_at");
create index if not exists "bookings_type_status_created_at_idx" on "bookings" ("type", "status", "created_at");
create index if not exists "bookings_hotel_id_created_at_idx" on "bookings" ("hotel_id", "created_at");
create index if not exists "bookings_trip_id_created_at_idx" on "bookings" ("trip_id", "created_at");

create index if not exists "payments_status_created_at_idx" on "payments" ("status", "created_at");
create index if not exists "payments_provider_provider_reference_idx" on "payments" ("provider", "provider_reference");

create index if not exists "refunds_booking_id_idx" on "refunds" ("booking_id");
create index if not exists "refunds_status_created_at_idx" on "refunds" ("status", "created_at");

create index if not exists "withdrawal_requests_status_created_at_idx" on "withdrawal_requests" ("status", "created_at");

create index if not exists "notifications_owner_type_owner_id_read_at_created_at_idx" on "notifications" ("owner_type", "owner_id", "read_at", "created_at");

create index if not exists "support_tickets_user_id_status_created_at_idx" on "support_tickets" ("user_id", "status", "created_at");
create index if not exists "support_tickets_status_created_at_idx" on "support_tickets" ("status", "created_at");

create index if not exists "audit_logs_entity_type_entity_id_idx" on "audit_logs" ("entity_type", "entity_id");

create index if not exists "export_jobs_owner_type_owner_id_created_at_idx" on "export_jobs" ("owner_type", "owner_id", "created_at");
create index if not exists "export_jobs_status_created_at_idx" on "export_jobs" ("status", "created_at");

create index if not exists "cms_entries_type_status_created_at_idx" on "cms_entries" ("type", "status", "created_at");
create index if not exists "cms_entries_published_at_idx" on "cms_entries" ("published_at");
