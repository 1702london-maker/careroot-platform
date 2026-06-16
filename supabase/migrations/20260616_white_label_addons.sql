-- billing_cycle on organisations
alter table organisations add column if not exists
  billing_cycle text default 'monthly'
  check (billing_cycle in ('monthly','annual'));

-- White label fields
alter table organisations add column if not exists white_label boolean default false;
alter table organisations add column if not exists wl_app_name text;
alter table organisations add column if not exists wl_logo_url text;
alter table organisations add column if not exists wl_primary_colour text;
alter table organisations add column if not exists wl_secondary_colour text;
alter table organisations add column if not exists wl_accent_colour text;
alter table organisations add column if not exists wl_domain text;
alter table organisations add column if not exists wl_email_from text;
alter table organisations add column if not exists wl_support_email text;
alter table organisations add column if not exists wl_play_store_url text;
alter table organisations add column if not exists wl_app_store_url text;
alter table organisations add column if not exists wl_package_tier text check (wl_package_tier in ('basic','full','enterprise'));
alter table organisations add column if not exists wl_setup_complete boolean default false;
alter table organisations add column if not exists wl_stripe_extra_subscription_id text;

-- Add-ons tracking
create table if not exists organisation_addons (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid references organisations(id) on delete cascade,
  addon_type text check (addon_type in (
    'cqc_inspection_pack','onboarding_support','paper_migration',
    'extra_staff_block','api_access',
    'white_label_basic','white_label_full','white_label_enterprise'
  )),
  status text default 'active' check (status in ('active','cancelled','pending')),
  stripe_subscription_id text,
  stripe_payment_intent_id text,
  quantity integer default 1,
  purchased_at timestamptz default now(),
  expires_at timestamptz,
  created_at timestamptz default now()
);

alter table organisation_addons enable row level security;
create policy "addons_org_isolation" on organisation_addons
  for all using (
    organisation_id = (select organisation_id from users where id = auth.uid())
  );

-- White label domain mapping
create table if not exists white_label_domains (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid references organisations(id) on delete cascade,
  domain text unique not null,
  verified boolean default false,
  verification_token text,
  ssl_provisioned boolean default false,
  created_at timestamptz default now()
);

alter table white_label_domains enable row level security;
create policy "wl_domains_org_isolation" on white_label_domains
  for all using (
    organisation_id = (select organisation_id from users where id = auth.uid())
  );

-- API logs
create table if not exists api_logs (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid references organisations(id) on delete cascade,
  endpoint text,
  method text,
  status_code integer,
  response_time_ms integer,
  created_at timestamptz default now()
);

alter table api_logs enable row level security;
create policy "api_logs_superadmin_only" on api_logs
  for all using (
    organisation_id = (select organisation_id from users where id = auth.uid())
  );
