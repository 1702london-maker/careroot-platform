create table if not exists organisations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text check (type in ('domiciliary','supported_living','residential','internal')),
  cqc_provider_id text,
  ofsted_id text,
  address jsonb,
  phone text,
  on_call_phone text,
  email text,
  logo_url text,
  stripe_customer_id text,
  stripe_subscription_id text,
  plan text default 'seed' check (plan in ('seed','grow','scale','enterprise')),
  plan_status text default 'trial' check (plan_status in ('trial','active','suspended','cancelled')),
  trial_ends_at timestamptz,
  max_staff integer default 10,
  settings jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table organisations enable row level security;
