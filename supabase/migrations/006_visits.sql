create table if not exists visits (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid references organisations(id),
  client_id uuid references clients(id),
  carer_id uuid references users(id),
  scheduled_start timestamptz,
  scheduled_end timestamptz,
  actual_start timestamptz,
  actual_end timestamptz,
  status text default 'scheduled' check (status in (
    'scheduled','in_progress','completed','missed','cancelled'
  )),
  check_in_lat decimal,
  check_in_lng decimal,
  check_out_lat decimal,
  check_out_lng decimal,
  notes text,
  ai_summary text,
  tasks_completed jsonb default '[]',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table visits enable row level security;

create policy "visits_org_isolation" on visits
  for all using (
    organisation_id = (select organisation_id from users where id = auth.uid())
  );
