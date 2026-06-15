create table if not exists meal_records (
  id uuid primary key default gen_random_uuid(),
  visit_id uuid references visits(id),
  client_id uuid references clients(id),
  carer_id uuid references users(id),
  meal_preference_id uuid references meal_preferences(id),
  meal_time text,
  meal_name text,
  consumption_level text check (consumption_level in (
    'all','most','half','little','refused'
  )),
  fluid_intake_ml integer,
  assistance_provided text,
  notes text,
  ai_flag boolean default false,
  recorded_at timestamptz default now()
);

alter table meal_records enable row level security;

create policy "meal_records_org_isolation" on meal_records
  for all using (
    client_id in (
      select id from clients
      where organisation_id = (select organisation_id from users where id = auth.uid())
    )
  );
