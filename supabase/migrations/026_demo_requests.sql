create table if not exists demo_requests (
  id uuid primary key default gen_random_uuid(),
  first_name text,
  last_name text,
  organisation_name text,
  email text,
  phone text,
  staff_count text,
  care_type text,
  created_at timestamptz default now()
);

alter table demo_requests enable row level security;

create policy "demo_requests_insert_only" on demo_requests
  for insert with check (true);

create policy "demo_requests_superadmin" on demo_requests
  for select using (
    (select role from users where id = auth.uid()) = 'superadmin'
  );
