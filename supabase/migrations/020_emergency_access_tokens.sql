create table if not exists emergency_access_tokens (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id),
  organisation_id uuid references organisations(id),
  token text unique not null,
  pin text not null,
  qr_code_url text,
  accessed_at timestamptz,
  accessed_by_role text,
  access_count integer default 0,
  last_access_ip text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table emergency_access_tokens enable row level security;

-- Public read for paramedics (no auth required)
create policy "emergency_token_public_read" on emergency_access_tokens
  for select using (true);

create policy "emergency_token_org_write" on emergency_access_tokens
  for all using (
    organisation_id = (select organisation_id from users where id = auth.uid())
  );
