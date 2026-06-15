create table if not exists emergency_events (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid references organisations(id),
  client_id uuid references clients(id),
  triggered_by uuid references users(id),
  trigger_source text check (trigger_source in ('carer','client','family','manager')),
  visit_id uuid references visits(id),
  lat decimal,
  lng decimal,
  address text,
  description text,
  notifications_sent jsonb default '[]',
  status text default 'active' check (status in ('active','resolved','false_alarm')),
  resolved_at timestamptz,
  resolved_by uuid references users(id),
  triggered_at timestamptz default now()
);

alter table emergency_events enable row level security;

create policy "emergency_events_org_isolation" on emergency_events
  for all using (
    organisation_id = (select organisation_id from users where id = auth.uid())
  );
