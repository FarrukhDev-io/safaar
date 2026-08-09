create table if not exists admin_settings (
  group_key varchar(80) primary key,
  value jsonb not null default '{}'::jsonb,
  updated_by uuid references admin_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists admin_settings_updated_at_idx
  on admin_settings (updated_at);

insert into admin_settings (group_key, value)
values
  (
    'general',
    jsonb_build_object(
      'app_name', 'safaar',
      'timezone', 'Asia/Tashkent',
      'support_email', 'support@safaar.uz',
      'maintenance_mode', false
    )
  ),
  (
    'finance',
    jsonb_build_object(
      'hotel_commission_rate', 15,
      'bus_commission_rate', 10
    )
  ),
  ('security', jsonb_build_object('admin_2fa_required', true)),
  ('booking', jsonb_build_object('hold_minutes', 15)),
  (
    'providers',
    jsonb_build_object(
      'click', jsonb_build_object('enabled', true),
      'payme', jsonb_build_object('enabled', true)
    )
  )
on conflict (group_key) do nothing;
