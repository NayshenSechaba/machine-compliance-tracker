-- Demo seed data — run after schema.sql to populate a sample fleet.
-- Replace the org_id below with your real org's id once you've created
-- your first profile (or keep this one for local testing).

insert into organisations (id, name) values
  ('00000000-0000-0000-0000-000000000001', 'Demo Fleet Co')
on conflict (id) do nothing;

insert into operators (id, org_id, full_name, phone, role) values
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Sipho Ndlovu', '+27821234567', 'driver'),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Ben van der Merwe', '+27827654321', 'driver'),
  ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Thandi Khumalo', '+27829998888', 'site_manager')
on conflict (id) do nothing;

insert into assets (id, org_id, name, registration, asset_type, odometer_or_hours, status) values
  ('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Volvo FH16 — Fleet 04', 'ND 45 GP', 'truck', 182340, 'in_service'),
  ('20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'CAT 336D Excavator', 'RIG-07', 'excavator', 6120, 'in_service'),
  ('20000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Isuzu FTR — Fleet 11', 'ND 88 HP', 'truck', 94210, 'blocked')
on conflict (id) do nothing;

insert into compliance_items (org_id, operator_id, item_type, reference_number, expiry_date) values
  ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'prdp', 'PRDP-88213', current_date + interval '5 days'),
  ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'drivers_licence', 'DL-40213', current_date + interval '45 days');

insert into compliance_items (org_id, asset_id, item_type, reference_number, expiry_date) values
  ('00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'vehicle_licence', 'VL-2201', current_date + interval '20 days'),
  ('00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000003', 'roadworthy_cert', 'RWC-9981', current_date - interval '3 days');
