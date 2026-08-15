-- Dacha amenities
INSERT INTO amenities (id, code, name, created_at, updated_at) VALUES 
(gen_random_uuid(), 'dacha_pool', '{"uz": "Hovuz", "ru": "Бассейн"}', now(), now()),
(gen_random_uuid(), 'dacha_sauna', '{"uz": "Sauna", "ru": "Сауна"}', now(), now()),
(gen_random_uuid(), 'dacha_billiard', '{"uz": "Bilyard", "ru": "Бильярд"}', now(), now()),
(gen_random_uuid(), 'dacha_tapchan', '{"uz": "Tapchan", "ru": "Топчан"}', now(), now()),
(gen_random_uuid(), 'dacha_bbq', '{"uz": "Mangal", "ru": "Мангал"}', now(), now()),
(gen_random_uuid(), 'dacha_karaoke', '{"uz": "Karaoke", "ru": "Караоке"}', now(), now())
ON CONFLICT (code) DO NOTHING;

-- Restaurant amenities
INSERT INTO amenities (id, code, name, created_at, updated_at) VALUES 
(gen_random_uuid(), 'restaurant_halal', '{"uz": "Halol taomlar", "ru": "Халяльная еда"}', now(), now()),
(gen_random_uuid(), 'restaurant_live_music', '{"uz": "Jonli musiqa", "ru": "Живая музыка"}', now(), now()),
(gen_random_uuid(), 'restaurant_kids_zone', '{"uz": "Bolalar maydonchasi", "ru": "Детская площадка"}', now(), now()),
(gen_random_uuid(), 'restaurant_terrace', '{"uz": "Ochiq terrasa", "ru": "Открытая терраса"}', now(), now()),
(gen_random_uuid(), 'restaurant_vip', '{"uz": "VIP xonalar", "ru": "VIP залы"}', now(), now()),
(gen_random_uuid(), 'restaurant_parking', '{"uz": "Maxsus avtoturargoh", "ru": "Своя парковка"}', now(), now())
ON CONFLICT (code) DO NOTHING;

-- Transport amenities
INSERT INTO amenities (id, code, name, created_at, updated_at) VALUES 
(gen_random_uuid(), 'transport_ac', '{"uz": "Konditsioner", "ru": "Кондиционер"}', now(), now()),
(gen_random_uuid(), 'transport_wifi', '{"uz": "Wi-Fi", "ru": "Wi-Fi"}', now(), now()),
(gen_random_uuid(), 'transport_tv', '{"uz": "Televizor", "ru": "Телевизор"}', now(), now()),
(gen_random_uuid(), 'transport_usb', '{"uz": "USB quvvatlagich", "ru": "USB зарядка"}', now(), now()),
(gen_random_uuid(), 'transport_baggage', '{"uz": "Katta yukxona", "ru": "Большой багажник"}', now(), now()),
(gen_random_uuid(), 'transport_water', '{"uz": "Bepul ichimlik suvi", "ru": "Бесплатная питьевая вода"}', now(), now())
ON CONFLICT (code) DO NOTHING;

-- Hotel/Room amenities
INSERT INTO amenities (id, code, name, created_at, updated_at) VALUES 
(gen_random_uuid(), 'hotel_wifi', '{"uz": "Bepul Wi-Fi", "ru": "Бесплатный Wi-Fi"}', now(), now()),
(gen_random_uuid(), 'hotel_parking', '{"uz": "Bepul parking", "ru": "Бесплатная парковка"}', now(), now()),
(gen_random_uuid(), 'hotel_pool', '{"uz": "Hovuz", "ru": "Бассейн"}', now(), now()),
(gen_random_uuid(), 'hotel_breakfast', '{"uz": "Nonushta", "ru": "Завтрак"}', now(), now()),
(gen_random_uuid(), 'hotel_gym', '{"uz": "Fitness zal", "ru": "Тренажерный зал"}', now(), now()),
(gen_random_uuid(), 'hotel_spa', '{"uz": "Spa", "ru": "Спа"}', now(), now()),
(gen_random_uuid(), 'hotel_reception_24', '{"uz": "24/7 resepsiyon", "ru": "Круглосуточный ресепшн"}', now(), now()),
(gen_random_uuid(), 'room_ac', '{"uz": "Konditsioner", "ru": "Кондиционер"}', now(), now()),
(gen_random_uuid(), 'room_tv', '{"uz": "Televizor", "ru": "Телевизор"}', now(), now()),
(gen_random_uuid(), 'room_safe', '{"uz": "Seyf", "ru": "Сейф"}', now(), now()),
(gen_random_uuid(), 'room_minibar', '{"uz": "Mini-bar", "ru": "Мини-бар"}', now(), now())
ON CONFLICT (code) DO NOTHING;
