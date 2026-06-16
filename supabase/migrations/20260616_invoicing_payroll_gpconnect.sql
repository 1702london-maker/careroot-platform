-- Invoicing, Payroll, GP Connect tables
-- Run in Supabase SQL Editor: https://supabase.com/dashboard/project/ypwfwdaohkxhooehtyrp/sql

create table if not exists rate_cards (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid references organisations(id),
  name text not null,
  funder_type text check (funder_type in ('local_authority','nhs','private','mixed')),
  hourly_rate decimal(10,2),
  visit_rate decimal(10,2),
  overnight_rate decimal(10,2),
  travel_rate_per_mile decimal(10,4),
  currency text default 'GBP',
  is_default boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists client_billing (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id),
  organisation_id uuid references organisations(id),
  rate_card_id uuid references rate_cards(id),
  funder_type text check (funder_type in ('local_authority','nhs','private','mixed')),
  local_authority_name text,
  local_authority_ref text,
  private_rate_override decimal(10,2),
  split_billing boolean default false,
  la_percentage integer,
  private_percentage integer,
  billing_email text,
  billing_address jsonb,
  payment_terms_days integer default 30,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists invoices (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid references organisations(id),
  client_id uuid references clients(id),
  invoice_number text unique not null,
  funder_type text check (funder_type in ('local_authority','nhs','private')),
  status text default 'draft' check (status in ('draft','sent','paid','overdue','cancelled','void')),
  issue_date date not null,
  due_date date not null,
  period_start date not null,
  period_end date not null,
  subtotal decimal(10,2) default 0,
  vat_rate decimal(5,2) default 0,
  vat_amount decimal(10,2) default 0,
  total decimal(10,2) default 0,
  amount_paid decimal(10,2) default 0,
  amount_outstanding decimal(10,2) default 0,
  notes text,
  payment_reference text,
  paid_at timestamptz,
  sent_at timestamptz,
  pdf_url text,
  created_by uuid references users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists invoice_line_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid references invoices(id) on delete cascade,
  visit_id uuid references visits(id),
  description text not null,
  date date not null,
  quantity decimal(10,2) not null,
  unit text default 'hours',
  unit_price decimal(10,2) not null,
  total decimal(10,2) not null,
  created_at timestamptz default now()
);

create table if not exists carer_pay_rates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  organisation_id uuid references organisations(id),
  hourly_rate decimal(10,2) not null,
  overtime_rate decimal(10,2),
  weekend_rate decimal(10,2),
  bank_holiday_rate decimal(10,2),
  travel_rate_per_mile decimal(10,4),
  effective_from date not null,
  effective_to date,
  created_at timestamptz default now()
);

create table if not exists payroll_runs (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid references organisations(id),
  period_start date not null,
  period_end date not null,
  status text default 'draft' check (status in ('draft','processing','approved','exported','paid')),
  total_gross decimal(10,2) default 0,
  total_carers integer default 0,
  total_hours decimal(10,2) default 0,
  total_visits integer default 0,
  approved_by uuid references users(id),
  approved_at timestamptz,
  exported_at timestamptz,
  notes text,
  created_by uuid references users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists payroll_carer_summary (
  id uuid primary key default gen_random_uuid(),
  payroll_run_id uuid references payroll_runs(id) on delete cascade,
  carer_id uuid references users(id),
  organisation_id uuid references organisations(id),
  total_visits integer default 0,
  total_hours decimal(10,2) default 0,
  total_miles decimal(10,2) default 0,
  regular_pay decimal(10,2) default 0,
  overtime_pay decimal(10,2) default 0,
  travel_pay decimal(10,2) default 0,
  gross_pay decimal(10,2) default 0,
  visit_breakdown jsonb default '[]',
  created_at timestamptz default now()
);

create table if not exists gp_connect_requests (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid references organisations(id),
  client_id uuid references clients(id),
  requested_by uuid references users(id),
  status text default 'pending' check (status in ('pending','approved','rejected','coming_soon')),
  name text,
  email text,
  num_clients text,
  notes text,
  created_at timestamptz default now()
);

-- Enable RLS
alter table rate_cards enable row level security;
alter table client_billing enable row level security;
alter table invoices enable row level security;
alter table invoice_line_items enable row level security;
alter table carer_pay_rates enable row level security;
alter table payroll_runs enable row level security;
alter table payroll_carer_summary enable row level security;
alter table gp_connect_requests enable row level security;

-- RLS policies
create policy "org_isolation_rate_cards" on rate_cards for all using (organisation_id = (select organisation_id from users where id = auth.uid()));
create policy "org_isolation_client_billing" on client_billing for all using (organisation_id = (select organisation_id from users where id = auth.uid()));
create policy "org_isolation_invoices" on invoices for all using (organisation_id = (select organisation_id from users where id = auth.uid()));
create policy "org_isolation_invoice_lines" on invoice_line_items for all using (invoice_id in (select id from invoices where organisation_id = (select organisation_id from users where id = auth.uid())));
create policy "org_isolation_carer_pay_rates" on carer_pay_rates for all using (organisation_id = (select organisation_id from users where id = auth.uid()));
create policy "org_isolation_payroll_runs" on payroll_runs for all using (organisation_id = (select organisation_id from users where id = auth.uid()));
create policy "org_isolation_payroll_carer_summary" on payroll_carer_summary for all using (organisation_id = (select organisation_id from users where id = auth.uid()));
create policy "gp_connect_public_insert" on gp_connect_requests for insert with check (true);
create policy "org_isolation_gp_connect" on gp_connect_requests for select using (organisation_id is null or organisation_id = (select organisation_id from users where id = auth.uid()));
