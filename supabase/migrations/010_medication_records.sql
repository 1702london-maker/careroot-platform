create table if not exists medication_records (
  id uuid primary key default gen_random_uuid(),
  medication_id uuid references medications(id),
  client_id uuid references clients(id),
  visit_id uuid references visits(id),
  administered_by uuid references users(id),
  scheduled_time timestamptz,
  administered_at timestamptz,
  status text check (status in ('given','refused','unavailable','not_required')),
  notes text,
  created_at timestamptz default now()
);

alter table medication_records enable row level security;

create policy "medication_records_org_isolation" on medication_records
  for all using (
    client_id in (
      select id from clients
      where organisation_id = (select organisation_id from users where id = auth.uid())
    )
  );
