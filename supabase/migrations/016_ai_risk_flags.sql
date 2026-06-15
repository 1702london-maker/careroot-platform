create table if not exists ai_risk_flags (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid references organisations(id),
  client_id uuid references clients(id),
  flag_type text,
  severity text check (severity in ('low','medium','high','critical')),
  description text,
  evidence jsonb,
  status text default 'open' check (status in ('open','acknowledged','resolved','false_positive')),
  acknowledged_by uuid references users(id),
  acknowledged_at timestamptz,
  created_at timestamptz default now()
);

alter table ai_risk_flags enable row level security;

create policy "ai_risk_flags_org_isolation" on ai_risk_flags
  for all using (
    organisation_id = (select organisation_id from users where id = auth.uid())
  );
