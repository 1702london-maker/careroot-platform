create table if not exists complaints (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid references organisations(id),
  client_id uuid references clients(id),
  submitted_by uuid references users(id),
  reference_number text unique,
  category text check (category in (
    'care_quality','staff_conduct','missed_visit',
    'communication','medication','food','other'
  )),
  description text not null,
  desired_outcome text,
  incident_date date,
  is_anonymous boolean default false,
  wants_cqc_escalation boolean default false,
  status text default 'open' check (status in (
    'open','investigating','resolved','escalated','withdrawn'
  )),
  manager_response text,
  resolved_at timestamptz,
  resolved_by uuid references users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table complaints enable row level security;

create policy "complaints_manager_only" on complaints
  for select using (
    (select role from users where id = auth.uid())
    in ('superadmin','org_admin','manager','coordinator')
    or submitted_by = auth.uid()
  );

create policy "complaints_insert" on complaints
  for insert with check (
    organisation_id = (select organisation_id from users where id = auth.uid())
  );

create policy "complaints_update_manager" on complaints
  for update using (
    (select role from users where id = auth.uid())
    in ('superadmin','org_admin','manager','coordinator')
  );
