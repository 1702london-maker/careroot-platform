create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid references organisations(id),
  first_name text not null,
  last_name text not null,
  date_of_birth date,
  nhs_number text,
  address jsonb,
  phone text,
  email text,
  emergency_contact jsonb,
  gp_details jsonb,
  status text default 'active' check (status in ('active','inactive','hospital','deceased')),
  risk_level text default 'low' check (risk_level in ('low','medium','high','critical')),
  avatar_url text,
  cultural_background text,
  language_preferences text,
  communication_needs text,
  dnr_status boolean default false,
  notes text,
  onboarding_complete boolean default false,
  onboarding_step integer default 1,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table clients enable row level security;

create policy "clients_org_isolation" on clients
  for all using (
    organisation_id = (select organisation_id from users where id = auth.uid())
  );
