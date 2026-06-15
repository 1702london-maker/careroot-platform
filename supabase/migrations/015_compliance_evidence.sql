create table if not exists compliance_evidence (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid references organisations(id),
  framework text check (framework in ('cqc','ofsted')),
  category text,
  subcategory text,
  evidence_type text,
  title text,
  description text,
  file_url text,
  status text check (status in ('compliant','partial','non_compliant','not_applicable')),
  score integer,
  ai_assessment text,
  last_reviewed_at timestamptz,
  reviewed_by uuid references users(id),
  created_at timestamptz default now()
);

alter table compliance_evidence enable row level security;

create policy "compliance_evidence_org_isolation" on compliance_evidence
  for all using (
    organisation_id = (select organisation_id from users where id = auth.uid())
  );
