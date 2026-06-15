create table if not exists family_access (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id),
  organisation_id uuid references organisations(id),
  user_id uuid references users(id),
  relationship text,
  access_level text default 'standard' check (access_level in ('limited','standard','full')),
  can_message_manager boolean default true,
  can_submit_complaints boolean default true,
  can_suggest_meals boolean default true,
  invited_by uuid references users(id),
  invite_accepted_at timestamptz,
  is_active boolean default true,
  created_at timestamptz default now()
);

alter table family_access enable row level security;

create policy "family_access_org_isolation" on family_access
  for all using (
    organisation_id = (select organisation_id from users where id = auth.uid())
    or user_id = auth.uid()
  );
