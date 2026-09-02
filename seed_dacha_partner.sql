INSERT INTO partner_organizations (id, type, name, legal_name, tax_id, phone, email, city_id, address, status, commission_rate, user_id, created_at, updated_at)
VALUES ('00000000-0000-3001-0000-000000000099', 'dacha', 'Test Dacha LLC', 'Test Dacha', 'DEMO-DACHA-001', '+998901112299', 'dacha@demo.uz', '00000000-0000-1002-0000-000000000001', 'Toshkent, Burchak 1', 'approved', 10.00, '00000000-0000-1006-0000-000000000001', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Also need a partner user if authentication is separate? Let's check `partner_users` table in admin-demo-seed.sql.
