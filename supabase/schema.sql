-- ============================================================================
-- Heavy Industry Ops Platform — Phase 1 schema
-- Four pillars: assets, operators, compliance_items, events
-- Every future tool (scheduler, dispatch, WhatsApp agent) reads/writes these
-- same tables — only the interface changes.
-- ============================================================================

create extension if not exists "uuid-ossp";

-- ---------------------------------------------------------------------------
-- ORGANISATIONS (multi-tenant from day one — every client is isolated by this)
-- ---------------------------------------------------------------------------
create table organisations (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 1. ASSETS — trucks, trailers, excavators, drill rigs, generators...
-- ---------------------------------------------------------------------------
create type asset_type as enum ('truck', 'trailer', 'excavator', 'tlb', 'drill_rig', 'generator', 'other');
create type asset_status as enum ('cleared', 'blocked', 'in_service');

create table assets (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid not null references organisations(id) on delete cascade,
  name text not null,                 -- e.g. "Volvo FH16 – Fleet 04"
  registration text,                  -- number plate / asset tag
  asset_type asset_type not null,
  odometer_or_hours numeric default 0,
  status asset_status not null default 'in_service',
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 2. OPERATORS — drivers, site managers, mechanics
-- ---------------------------------------------------------------------------
create table operators (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid not null references organisations(id) on delete cascade,
  full_name text not null,
  phone text,                          -- WhatsApp/SMS alerts land here
  role text not null default 'driver', -- driver | site_manager | mechanic
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 3. COMPLIANCE — expiry-tracked documents/certifications (the "Vault")
--    Can attach to an operator (PrDP, licence) OR an asset (vehicle licence,
--    roadworthy cert) — exactly one of operator_id / asset_id is set.
-- ---------------------------------------------------------------------------
create type compliance_type as enum (
  'prdp', 'drivers_licence', 'vehicle_licence', 'roadworthy_cert',
  'sadc_permit', 'mining_safety_cert', 'other'
);

create type verification_status as enum ('pending_upload', 'pending_verification', 'verified', 'rejected');

create table compliance_items (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid not null references organisations(id) on delete cascade,
  operator_id uuid references operators(id) on delete cascade,
  asset_id uuid references assets(id) on delete cascade,
  item_type compliance_type not null,
  reference_number text,
  expiry_date date not null,
  document_url text,                    -- Supabase Storage path to scanned doc
  verification_status verification_status not null default 'pending_upload',
  verified_by text,                     -- Manager profile/name who signed off
  verified_at timestamptz,
  rejection_reason text,
  ocr_data jsonb,                       -- Extracted OCR data payload & confidence
  last_alert_sent_at timestamptz,
  created_at timestamptz not null default now(),
  constraint one_owner check (
    (operator_id is not null and asset_id is null) or
    (operator_id is null and asset_id is not null)
  )
);

create index idx_compliance_expiry on compliance_items (expiry_date);

-- ---------------------------------------------------------------------------
-- 4. EVENTS — the log of everything that happens: checklists, breakdowns,
--    services, border crossings. This is the richest data source in the
--    whole system and what Phase 2/3 tools are built on top of.
-- ---------------------------------------------------------------------------
create type event_type as enum (
  'pre_start_checklist', 'breakdown', 'service', 'border_crossing', 'other'
);
create type checklist_result as enum ('pass', 'fail');

create table events (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid not null references organisations(id) on delete cascade,
  asset_id uuid not null references assets(id) on delete cascade,
  operator_id uuid not null references operators(id) on delete cascade,
  event_type event_type not null,
  checklist_result checklist_result,      -- set only when event_type = pre_start_checklist
  odometer_or_hours numeric,
  notes text,
  photo_urls text[] default '{}',         -- Supabase Storage paths
  flagged_components text[] default '{}', -- e.g. {"tyres","hydraulic_hoses"}
  created_at timestamptz not null default now()
);

create index idx_events_asset on events (asset_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Row-Level Security — every table scoped to org_id.
-- MVP uses a simple org_id claim on the JWT (set via Supabase custom claims
-- or a `profiles` table keyed to auth.uid()). Tighten before production.
-- ---------------------------------------------------------------------------
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  org_id uuid not null references organisations(id),
  full_name text
);

alter table organisations enable row level security;
alter table assets enable row level security;
alter table operators enable row level security;
alter table compliance_items enable row level security;
alter table events enable row level security;
alter table profiles enable row level security;

create or replace function current_org_id()
returns uuid
language sql stable
as $$
  select org_id from profiles where id = auth.uid()
$$;

create policy "org isolation - assets" on assets
  for all using (org_id = current_org_id()) with check (org_id = current_org_id());
create policy "org isolation - operators" on operators
  for all using (org_id = current_org_id()) with check (org_id = current_org_id());
create policy "org isolation - compliance" on compliance_items
  for all using (org_id = current_org_id()) with check (org_id = current_org_id());
create policy "org isolation - events" on events
  for all using (org_id = current_org_id()) with check (org_id = current_org_id());
create policy "read own profile" on profiles
  for select using (id = auth.uid());
create policy "read own org" on organisations
  for select using (id = current_org_id());

-- ---------------------------------------------------------------------------
-- 5. DEFECTS — issues found during checklists, managed by maintenance
-- ---------------------------------------------------------------------------
create type defect_status as enum ('open', 'in_progress', 'resolved');

create table defects (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid not null references organisations(id) on delete cascade,
  event_id uuid references events(id) on delete cascade,
  asset_id uuid not null references assets(id) on delete cascade,
  item_label text not null,               -- The checklist item that failed
  description text,                       -- Driver's notes
  photo_url text,                         -- Supabase Storage path
  status defect_status not null default 'open',
  resolved_by uuid references operators(id) on delete set null,
  resolved_at timestamptz,
  resolution_notes text,
  created_at timestamptz not null default now()
);

create index idx_defects_asset on defects (asset_id, status);
create index idx_defects_event on defects (event_id);

alter table defects enable row level security;
create policy "org isolation - defects" on defects
  for all using (org_id = current_org_id()) with check (org_id = current_org_id());

-- ---------------------------------------------------------------------------
-- Storage bucket for checklist photos and compliance documents
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public) values ('ops-media', 'ops-media', false)
on conflict (id) do nothing;

create policy "org members can upload media" on storage.objects
  for insert with check (bucket_id = 'ops-media' and auth.uid() is not null);
create policy "org members can read media" on storage.objects
  for select using (bucket_id = 'ops-media' and auth.uid() is not null);

-- ---------------------------------------------------------------------------
-- View: expiry status, used directly by the Vault dashboard
-- ---------------------------------------------------------------------------
create or replace view compliance_status as
select
  c.*,
  o.full_name as operator_name,
  a.name as asset_name,
  (c.expiry_date - current_date) as days_to_expiry,
  case
    when c.expiry_date < current_date then 'expired'
    when c.expiry_date - current_date <= 7 then 'critical'
    when c.expiry_date - current_date <= 30 then 'warning'
    when c.expiry_date - current_date <= 60 then 'upcoming'
    else 'ok'
  end as status
from compliance_items c
left join operators o on o.id = c.operator_id
left join assets a on a.id = c.asset_id;
