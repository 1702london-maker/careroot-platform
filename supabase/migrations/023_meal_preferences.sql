create table if not exists meal_preferences (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id),
  organisation_id uuid references organisations(id),
  meal_time text check (meal_time in (
    'breakfast','morning_snack','lunch',
    'afternoon_snack','dinner','evening_snack'
  )),
  name text not null,
  description text,
  steps jsonb default '[]',
  notes text,
  warnings text,
  is_favourite boolean default false,
  frequency text check (frequency in (
    'daily','weekly','occasionally','special_occasion'
  )),
  day_of_week integer[],
  suggested_by text check (suggested_by in ('client','family','manager','carer')),
  approved_by uuid references users(id),
  is_active boolean default true,
  created_at timestamptz default now()
);

alter table meal_preferences enable row level security;

create policy "meal_preferences_org_isolation" on meal_preferences
  for all using (
    organisation_id = (select organisation_id from users where id = auth.uid())
  );
