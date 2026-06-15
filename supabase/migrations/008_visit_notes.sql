create table if not exists visit_notes (
  id uuid primary key default gen_random_uuid(),
  visit_id uuid references visits(id),
  client_id uuid references clients(id),
  author_id uuid references users(id),
  organisation_id uuid references organisations(id),
  content text,
  voice_transcript text,
  ai_structured jsonb,
  risk_flags jsonb default '[]',
  sentiment text check (sentiment in ('positive','neutral','concerning','urgent')),
  is_family_visible boolean default true,
  is_internal boolean default false,
  created_at timestamptz default now()
);

alter table visit_notes enable row level security;

create policy "visit_notes_org_isolation" on visit_notes
  for all using (
    organisation_id = (select organisation_id from users where id = auth.uid())
  );

create policy "visit_notes_family_filter" on visit_notes
  for select using (
    (select role from users where id = auth.uid()) in ('superadmin','org_admin','manager','coordinator','carer')
    or (is_internal = false and is_family_visible = true)
  );
