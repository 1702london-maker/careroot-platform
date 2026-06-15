create table if not exists rota (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid references organisations(id),
  carer_id uuid references users(id),
  client_id uuid references clients(id),
  visit_id uuid references visits(id),
  day_of_week integer check (day_of_week between 0 and 6),
  start_time time,
  end_time time,
  recurrence text check (recurrence in ('once','weekly','fortnightly','monthly')),
  effective_from date,
  effective_to date,
  created_at timestamptz default now()
);

alter table rota enable row level security;

create policy "rota_org_isolation" on rota
  for all using (
    organisation_id = (select organisation_id from users where id = auth.uid())
  );
