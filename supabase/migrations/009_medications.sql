create table if not exists medications (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id),
  organisation_id uuid references organisations(id),
  name text not null,
  dosage text,
  frequency text,
  route text,
  prescriber text,
  start_date date,
  end_date date,
  is_active boolean default true,
  notes text,
  created_at timestamptz default now()
);

alter table medications enable row level security;

create policy "medications_org_isolation" on medications
  for all using (
    organisation_id = (select organisation_id from users where id = auth.uid())
  );
