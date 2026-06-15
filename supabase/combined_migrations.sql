create table if not exists organisations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text check (type in ('domiciliary','supported_living','residential','internal')),
  cqc_provider_id text,
  ofsted_id text,
  address jsonb,
  phone text,
  on_call_phone text,
  email text,
  logo_url text,
  stripe_customer_id text,
  stripe_subscription_id text,
  plan text default 'seed' check (plan in ('seed','grow','scale','enterprise')),
  plan_status text default 'trial' check (plan_status in ('trial','active','suspended','cancelled')),
  trial_ends_at timestamptz,
  max_staff integer default 10,
  settings jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table organisations enable row level security;
create table if not exists users (
  id uuid primary key references auth.users(id) on delete cascade,
  organisation_id uuid references organisations(id),
  first_name text,
  last_name text,
  email text,
  phone text,
  role text check (role in ('superadmin','org_admin','manager','coordinator','carer','family','gp')),
  avatar_url text,
  is_active boolean default true,
  last_seen_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table users enable row level security;

create policy "users_org_isolation" on users
  for all using (
    organisation_id = (select organisation_id from users where id = auth.uid())
    or id = auth.uid()
  );
create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid references organisations(id),
  first_name text not null,
  last_name text not null,
  date_of_birth date,
  nhs_number text,
  address jsonb,
  phone text,
  email text,
  emergency_contact jsonb,
  gp_details jsonb,
  status text default 'active' check (status in ('active','inactive','hospital','deceased')),
  risk_level text default 'low' check (risk_level in ('low','medium','high','critical')),
  avatar_url text,
  cultural_background text,
  language_preferences text,
  communication_needs text,
  dnr_status boolean default false,
  notes text,
  onboarding_complete boolean default false,
  onboarding_step integer default 1,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table clients enable row level security;

create policy "clients_org_isolation" on clients
  for all using (
    organisation_id = (select organisation_id from users where id = auth.uid())
  );
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
create table if not exists visits (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid references organisations(id),
  client_id uuid references clients(id),
  carer_id uuid references users(id),
  scheduled_start timestamptz,
  scheduled_end timestamptz,
  actual_start timestamptz,
  actual_end timestamptz,
  status text default 'scheduled' check (status in (
    'scheduled','in_progress','completed','missed','cancelled'
  )),
  check_in_lat decimal,
  check_in_lng decimal,
  check_out_lat decimal,
  check_out_lng decimal,
  notes text,
  ai_summary text,
  tasks_completed jsonb default '[]',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table visits enable row level security;

create policy "visits_org_isolation" on visits
  for all using (
    organisation_id = (select organisation_id from users where id = auth.uid())
  );
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
create table if not exists medications (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id),
  organisation_id uuid references organisations(id),
  name text not null,
  dosage text,
  frequency text,
  route text,
  prescriber text,
  start_date date,
  end_date date,
  is_active boolean default true,
  notes text,
  created_at timestamptz default now()
);

alter table medications enable row level security;

create policy "medications_org_isolation" on medications
  for all using (
    organisation_id = (select organisation_id from users where id = auth.uid())
  );
create table if not exists medication_records (
  id uuid primary key default gen_random_uuid(),
  medication_id uuid references medications(id),
  client_id uuid references clients(id),
  visit_id uuid references visits(id),
  administered_by uuid references users(id),
  scheduled_time timestamptz,
  administered_at timestamptz,
  status text check (status in ('given','refused','unavailable','not_required')),
  notes text,
  created_at timestamptz default now()
);

alter table medication_records enable row level security;

create policy "medication_records_org_isolation" on medication_records
  for all using (
    client_id in (
      select id from clients
      where organisation_id = (select organisation_id from users where id = auth.uid())
    )
  );
create table if not exists incidents (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid references organisations(id),
  client_id uuid references clients(id),
  reported_by uuid references users(id),
  visit_id uuid references visits(id),
  title text not null,
  description text,
  severity text check (severity in ('low','medium','high','critical')),
  category text,
  status text default 'open' check (status in ('open','investigating','resolved','closed')),
  is_family_visible boolean default true,
  actions_taken text,
  reported_at timestamptz default now(),
  resolved_at timestamptz,
  created_at timestamptz default now()
);

alter table incidents enable row level security;

create policy "incidents_org_isolation" on incidents
  for all using (
    organisation_id = (select organisation_id from users where id = auth.uid())
  );

create policy "incidents_visibility" on incidents
  for select using (
    (select role from users where id = auth.uid())
    in ('superadmin','org_admin','manager','coordinator','carer')
    or is_family_visible = true
  );
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
create table if not exists rota (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid references organisations(id),
  carer_id uuid references users(id),
  client_id uuid references clients(id),
  visit_id uuid references visits(id),
  day_of_week integer check (day_of_week between 0 and 6),
  start_time time,
  end_time time,
  recurrence text check (recurrence in ('once','weekly','fortnightly','monthly')),
  effective_from date,
  effective_to date,
  created_at timestamptz default now()
);

alter table rota enable row level security;

create policy "rota_org_isolation" on rota
  for all using (
    organisation_id = (select organisation_id from users where id = auth.uid())
  );
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
create table if not exists family_briefings (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id),
  organisation_id uuid references organisations(id),
  content text,
  ai_generated boolean default true,
  sent_at timestamptz,
  sent_to jsonb,
  period_start date,
  period_end date,
  created_at timestamptz default now()
);

alter table family_briefings enable row level security;

create policy "family_briefings_org_isolation" on family_briefings
  for all using (
    organisation_id = (select organisation_id from users where id = auth.uid())
  );
create table if not exists complaints (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid references organisations(id),
  client_id uuid references clients(id),
  submitted_by uuid references users(id),
  reference_number text unique,
  category text check (category in (
    'care_quality','staff_conduct','missed_visit',
    'communication','medication','food','other'
  )),
  description text not null,
  desired_outcome text,
  incident_date date,
  is_anonymous boolean default false,
  wants_cqc_escalation boolean default false,
  status text default 'open' check (status in (
    'open','investigating','resolved','escalated','withdrawn'
  )),
  manager_response text,
  resolved_at timestamptz,
  resolved_by uuid references users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table complaints enable row level security;

create policy "complaints_manager_only" on complaints
  for select using (
    (select role from users where id = auth.uid())
    in ('superadmin','org_admin','manager','coordinator')
    or submitted_by = auth.uid()
  );

create policy "complaints_insert" on complaints
  for insert with check (
    organisation_id = (select organisation_id from users where id = auth.uid())
  );

create policy "complaints_update_manager" on complaints
  for update using (
    (select role from users where id = auth.uid())
    in ('superadmin','org_admin','manager','coordinator')
  );
create table if not exists emergency_events (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid references organisations(id),
  client_id uuid references clients(id),
  triggered_by uuid references users(id),
  trigger_source text check (trigger_source in ('carer','client','family','manager')),
  visit_id uuid references visits(id),
  lat decimal,
  lng decimal,
  address text,
  description text,
  notifications_sent jsonb default '[]',
  status text default 'active' check (status in ('active','resolved','false_alarm')),
  resolved_at timestamptz,
  resolved_by uuid references users(id),
  triggered_at timestamptz default now()
);

alter table emergency_events enable row level security;

create policy "emergency_events_org_isolation" on emergency_events
  for all using (
    organisation_id = (select organisation_id from users where id = auth.uid())
  );
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
create table if not exists family_access (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id),
  organisation_id uuid references organisations(id),
  user_id uuid references users(id),
  relationship text,
  access_level text default 'standard' check (access_level in ('limited','standard','full')),
  can_message_manager boolean default true,
  can_submit_complaints boolean default true,
  can_suggest_meals boolean default true,
  invited_by uuid references users(id),
  invite_accepted_at timestamptz,
  is_active boolean default true,
  created_at timestamptz default now()
);

alter table family_access enable row level security;

create policy "family_access_org_isolation" on family_access
  for all using (
    organisation_id = (select organisation_id from users where id = auth.uid())
    or user_id = auth.uid()
  );
create table if not exists nutrition_profiles (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id),
  organisation_id uuid references organisations(id),
  diet_type text,
  allergies jsonb default '[]',
  intolerances jsonb default '[]',
  liked_foods jsonb default '[]',
  disliked_foods jsonb default '[]',
  texture_requirement text check (texture_requirement in (
    'normal','soft','minced','pureed','liquidised'
  )),
  fluid_requirement_ml integer,
  thickened_fluids boolean default false,
  thickened_fluid_level text,
  supplements jsonb default '[]',
  eating_assistance jsonb default '{}',
  cultural_notes text,
  special_occasions text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table nutrition_profiles enable row level security;

create policy "nutrition_profiles_org_isolation" on nutrition_profiles
  for all using (
    organisation_id = (select organisation_id from users where id = auth.uid())
  );
create table if not exists meal_preferences (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id),
  organisation_id uuid references organisations(id),
  meal_time text check (meal_time in (
    'breakfast','morning_snack','lunch',
    'afternoon_snack','dinner','evening_snack'
  )),
  name text not null,
  description text,
  steps jsonb default '[]',
  notes text,
  warnings text,
  is_favourite boolean default false,
  frequency text check (frequency in (
    'daily','weekly','occasionally','special_occasion'
  )),
  day_of_week integer[],
  suggested_by text check (suggested_by in ('client','family','manager','carer')),
  approved_by uuid references users(id),
  is_active boolean default true,
  created_at timestamptz default now()
);

alter table meal_preferences enable row level security;

create policy "meal_preferences_org_isolation" on meal_preferences
  for all using (
    organisation_id = (select organisation_id from users where id = auth.uid())
  );
create table if not exists meal_records (
  id uuid primary key default gen_random_uuid(),
  visit_id uuid references visits(id),
  client_id uuid references clients(id),
  carer_id uuid references users(id),
  meal_preference_id uuid references meal_preferences(id),
  meal_time text,
  meal_name text,
  consumption_level text check (consumption_level in (
    'all','most','half','little','refused'
  )),
  fluid_intake_ml integer,
  assistance_provided text,
  notes text,
  ai_flag boolean default false,
  recorded_at timestamptz default now()
);

alter table meal_records enable row level security;

create policy "meal_records_org_isolation" on meal_records
  for all using (
    client_id in (
      select id from clients
      where organisation_id = (select organisation_id from users where id = auth.uid())
    )
  );
create table if not exists meal_suggestions (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id),
  organisation_id uuid references organisations(id),
  suggested_by uuid references users(id),
  meal_name text,
  description text,
  steps jsonb default '[]',
  cultural_context text,
  status text default 'pending' check (status in ('pending','approved','rejected')),
  reviewed_by uuid references users(id),
  reviewed_at timestamptz,
  created_at timestamptz default now()
);

alter table meal_suggestions enable row level security;

create policy "meal_suggestions_org_isolation" on meal_suggestions
  for all using (
    organisation_id = (select organisation_id from users where id = auth.uid())
  );
create table if not exists demo_requests (
  id uuid primary key default gen_random_uuid(),
  first_name text,
  last_name text,
  organisation_name text,
  email text,
  phone text,
  staff_count text,
  care_type text,
  created_at timestamptz default now()
);

alter table demo_requests enable row level security;

create policy "demo_requests_insert_only" on demo_requests
  for insert with check (true);

create policy "demo_requests_superadmin" on demo_requests
  for select using (
    (select role from users where id = auth.uid()) = 'superadmin'
  );
