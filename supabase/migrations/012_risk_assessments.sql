create table if not exists risk_assessments (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id),
  organisation_id uuid references organisations(id),
  type text not null,
  score integer,
  risk_level text check (risk_level in ('low','medium','high','critical')),
  findings jsonb,
  ai_analysis text,
  reviewed_by uuid references users(id),
  review_date date,
  next_review_date date,
  created_at timestamptz default now()
);

alter table risk_assessments enable row level security;

create policy "risk_assessments_org_isolation" on risk_assessments
  for all using (
    organisation_id = (select organisation_id from users where id = auth.uid())
  );
