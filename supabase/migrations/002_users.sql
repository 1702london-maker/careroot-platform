create table if not exists users (
  id uuid primary key references auth.users(id) on delete cascade,
  organisation_id uuid references organisations(id),
  first_name text,
  last_name text,
  email text,
  phone text,
  role text check (role in ('superadmin','org_admin','manager','coordinator','carer','family','gp')),
  avatar_url text,
  is_active boolean default true,
  last_seen_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table users enable row level security;

create policy "users_org_isolation" on users
  for all using (
    organisation_id = (select organisation_id from users where id = auth.uid())
    or id = auth.uid()
  );
