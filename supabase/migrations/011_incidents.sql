create table if not exists incidents (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid references organisations(id),
  client_id uuid references clients(id),
  reported_by uuid references users(id),
  visit_id uuid references visits(id),
  title text not null,
  description text,
  severity text check (severity in ('low','medium','high','critical')),
  category text,
  status text default 'open' check (status in ('open','investigating','resolved','closed')),
  is_family_visible boolean default true,
  actions_taken text,
  reported_at timestamptz default now(),
  resolved_at timestamptz,
  created_at timestamptz default now()
);

alter table incidents enable row level security;

create policy "incidents_org_isolation" on incidents
  for all using (
    organisation_id = (select organisation_id from users where id = auth.uid())
  );

create policy "incidents_visibility" on incidents
  for select using (
    (select role from users where id = auth.uid())
    in ('superadmin','org_admin','manager','coordinator','carer')
    or is_family_visible = true
  );
