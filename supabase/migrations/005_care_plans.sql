create table if not exists care_plans (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id),
  organisation_id uuid references organisations(id),
  title text not null,
  summary text,
  ai_summary text,
  status text default 'draft' check (status in ('draft','active','review','archived')),
  review_date date,
  created_by uuid references users(id),
  approved_by uuid references users(id),
  approved_at timestamptz,
  content jsonb default '{}',
  template_id uuid references care_plan_templates(id),
  version integer default 1,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table care_plans enable row level security;

create policy "care_plans_org_isolation" on care_plans
  for all using (
    organisation_id = (select organisation_id from users where id = auth.uid())
  );
