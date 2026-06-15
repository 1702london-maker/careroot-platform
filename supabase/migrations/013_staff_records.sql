create table if not exists staff_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  organisation_id uuid references organisations(id),
  job_title text,
  contract_type text check (contract_type in ('full_time','part_time','zero_hours','bank')),
  start_date date,
  dbs_number text,
  dbs_expiry date,
  right_to_work_verified boolean default false,
  qualifications jsonb default '[]',
  training_records jsonb default '[]',
  wellbeing_score integer,
  burnout_risk text check (burnout_risk in ('low','medium','high')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table staff_records enable row level security;

create policy "staff_records_org_isolation" on staff_records
  for all using (
    organisation_id = (select organisation_id from users where id = auth.uid())
  );
