create table if not exists family_briefings (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id),
  organisation_id uuid references organisations(id),
  content text,
  ai_generated boolean default true,
  sent_at timestamptz,
  sent_to jsonb,
  period_start date,
  period_end date,
  created_at timestamptz default now()
);

alter table family_briefings enable row level security;

create policy "family_briefings_org_isolation" on family_briefings
  for all using (
    organisation_id = (select organisation_id from users where id = auth.uid())
  );
