create table if not exists care_plan_templates (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid references organisations(id),
  name text not null,
  category text check (category in (
    'personal_care','dementia','learning_disability',
    'physical_disability','end_of_life','mental_health',
    'children_young_people','acquired_brain_injury','other'
  )),
  content jsonb,
  is_system boolean default false,
  created_by uuid references users(id),
  created_at timestamptz default now()
);

alter table care_plan_templates enable row level security;

create policy "care_plan_templates_org_isolation" on care_plan_templates
  for all using (
    organisation_id = (select organisation_id from users where id = auth.uid())
    or is_system = true
  );
