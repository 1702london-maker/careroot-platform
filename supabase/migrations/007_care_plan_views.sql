create table if not exists care_plan_views (
  id uuid primary key default gen_random_uuid(),
  care_plan_id uuid references care_plans(id),
  client_id uuid references clients(id),
  carer_id uuid references users(id),
  visit_id uuid references visits(id),
  viewed_at timestamptz default now()
);

alter table care_plan_views enable row level security;

create policy "care_plan_views_org_isolation" on care_plan_views
  for all using (
    carer_id = auth.uid()
    or (select role from users where id = auth.uid()) in ('superadmin','org_admin','manager','coordinator')
  );
