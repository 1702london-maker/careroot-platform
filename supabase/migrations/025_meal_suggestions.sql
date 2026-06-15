create table if not exists meal_suggestions (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id),
  organisation_id uuid references organisations(id),
  suggested_by uuid references users(id),
  meal_name text,
  description text,
  steps jsonb default '[]',
  cultural_context text,
  status text default 'pending' check (status in ('pending','approved','rejected')),
  reviewed_by uuid references users(id),
  reviewed_at timestamptz,
  created_at timestamptz default now()
);

alter table meal_suggestions enable row level security;

create policy "meal_suggestions_org_isolation" on meal_suggestions
  for all using (
    organisation_id = (select organisation_id from users where id = auth.uid())
  );
