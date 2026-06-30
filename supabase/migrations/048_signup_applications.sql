-- Signup applications: providers apply, superadmin vets, then issues access.
-- Replaces open self-signup. No account is created until an application is approved.

create table if not exists signup_applications (
  id uuid primary key default gen_random_uuid(),
  org_name text not null,
  org_type text check (org_type in ('domiciliary','supported_living','residential','internal')),
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text,
  cqc_provider_id text,
  message text,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  rejection_reason text,
  created_org_id uuid references organisations(id),
  created_at timestamptz default now()
);

create index if not exists idx_signup_applications_status on signup_applications(status);
create index if not exists idx_signup_applications_email on signup_applications(email);

alter table signup_applications enable row level security;

-- Anyone (anon) may submit an application — but cannot read them back.
drop policy if exists "applications_insert_anon" on signup_applications;
create policy "applications_insert_anon" on signup_applications
  for insert with check (true);

-- Only superadmins may read / update applications.
drop policy if exists "applications_superadmin_read" on signup_applications;
create policy "applications_superadmin_read" on signup_applications
  for select using (
    exists (select 1 from users where id = auth.uid() and role = 'superadmin')
  );

drop policy if exists "applications_superadmin_update" on signup_applications;
create policy "applications_superadmin_update" on signup_applications
  for update using (
    exists (select 1 from users where id = auth.uid() and role = 'superadmin')
  );

-- First-login security: force password change + terms acceptance on issued accounts.
alter table users add column if not exists must_change_password boolean default false;
alter table users add column if not exists terms_accepted_at timestamptz;
