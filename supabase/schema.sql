-- ============================================================
-- CAREROOT PLATFORM — COMPLETE DATABASE SCHEMA
-- Paste this entire file into Supabase SQL Editor and run.
-- ============================================================

-- Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ============================================================
-- ORGANISATIONS
-- ============================================================
create table if not exists organisations (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text unique not null,
  logo_url text,
  address jsonb default '{}',
  phone text,
  email text,
  website text,
  cqc_registration_number text,
  cqc_rating text check (cqc_rating in ('Outstanding','Good','Requires Improvement','Inadequate','Not yet inspected')) default 'Not yet inspected',
  subscription_tier text check (subscription_tier in ('starter','growth','enterprise')) default 'starter',
  subscription_status text check (subscription_status in ('trialing','active','past_due','canceled')) default 'trialing',
  stripe_customer_id text,
  stripe_subscription_id text,
  trial_ends_at timestamptz default (now() + interval '14 days'),
  max_clients int default 25,
  max_carers int default 10,
  settings jsonb default '{}',
  onboarding_completed boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- USERS (extends Supabase auth.users)
-- ============================================================
create table if not exists users (
  id uuid primary key references auth.users(id) on delete cascade,
  organisation_id uuid references organisations(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text,
  role text check (role in ('owner','manager','coordinator','carer','family','admin')) default 'carer',
  avatar_url text,
  dbs_number text,
  dbs_expiry date,
  dbs_checked boolean default false,
  right_to_work_verified boolean default false,
  contract_type text check (contract_type in ('full_time','part_time','zero_hours','bank')) default 'zero_hours',
  employment_start date,
  employment_end date,
  is_active boolean default true,
  last_login_at timestamptz,
  preferences jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- CLIENTS
-- ============================================================
create table if not exists clients (
  id uuid primary key default uuid_generate_v4(),
  organisation_id uuid not null references organisations(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  date_of_birth date,
  nhs_number text,
  phone text,
  email text,
  photo_url text,
  address jsonb default '{}',
  status text check (status in ('active','inactive','hospital','deceased','on_hold')) default 'active',
  risk_level text check (risk_level in ('low','medium','high','critical')) default 'low',
  dnr_status boolean default false,
  dnr_document_url text,
  primary_diagnosis text,
  secondary_diagnoses text[],
  allergies jsonb default '[]',
  medications_summary text,
  mobility_level text check (mobility_level in ('independent','supervised','assisted','fully_dependent')),
  cognitive_status text check (cognitive_status in ('orientated','mild_impairment','moderate_impairment','severe_impairment')),
  communication_needs text,
  language_preferences text,
  cultural_background text,
  religious_preferences text,
  dietary_requirements text,
  gp_details jsonb default '{}',
  nok_details jsonb default '{}',
  emergency_contact jsonb default '[]',
  funding_type text check (funding_type in ('local_authority','nhs','private','direct_payment','mixed')),
  weekly_hours numeric(5,2),
  hourly_rate numeric(8,2),
  care_package_start date,
  care_package_end date,
  key_safe_code text,
  access_notes text,
  onboarding_completed boolean default false,
  onboarding_step int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- CARE PLANS
-- ============================================================
create table if not exists care_plans (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid not null references clients(id) on delete cascade,
  organisation_id uuid not null references organisations(id) on delete cascade,
  version int default 1,
  status text check (status in ('draft','pending_approval','active','superseded','archived')) default 'draft',
  title text not null default 'Care Plan',
  personal_goals text,
  daily_routine jsonb default '{}',
  care_needs jsonb default '{}',
  risk_factors jsonb default '[]',
  interventions jsonb default '[]',
  outcomes jsonb default '[]',
  review_date date,
  approved_by uuid references users(id),
  approved_at timestamptz,
  ai_generated boolean default false,
  ai_prompt_used text,
  created_by uuid references users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Track who viewed a care plan (for CQC audit trail)
create table if not exists care_plan_views (
  id uuid primary key default uuid_generate_v4(),
  care_plan_id uuid not null references care_plans(id) on delete cascade,
  carer_id uuid references users(id),
  viewed_at timestamptz default now()
);

-- ============================================================
-- MEDICATIONS
-- ============================================================
create table if not exists medications (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid not null references clients(id) on delete cascade,
  organisation_id uuid not null references organisations(id) on delete cascade,
  name text not null,
  generic_name text,
  dose text not null,
  frequency text not null,
  route text check (route in ('oral','topical','inhaled','injection','patch','drops','other')) default 'oral',
  times text[],
  with_food boolean default false,
  prescriber text,
  pharmacy text,
  start_date date,
  end_date date,
  is_active boolean default true,
  mar_required boolean default true,
  controlled_drug boolean default false,
  storage_instructions text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Medication administration records
create table if not exists medication_records (
  id uuid primary key default uuid_generate_v4(),
  medication_id uuid not null references medications(id) on delete cascade,
  client_id uuid not null references clients(id) on delete cascade,
  visit_id uuid,
  administered_by uuid references users(id),
  scheduled_time timestamptz,
  administered_at timestamptz,
  status text check (status in ('given','refused','omitted','not_available','self_administered')) not null,
  dose_given text,
  notes text,
  created_at timestamptz default now()
);

-- ============================================================
-- VISITS
-- ============================================================
create table if not exists visits (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid not null references clients(id) on delete cascade,
  organisation_id uuid not null references organisations(id) on delete cascade,
  carer_id uuid references users(id),
  scheduled_start timestamptz not null,
  scheduled_end timestamptz not null,
  actual_start timestamptz,
  actual_end timestamptz,
  status text check (status in ('scheduled','confirmed','in_progress','completed','missed','cancelled')) default 'scheduled',
  visit_type text check (visit_type in ('personal_care','medication','social','domestic','waking_night','sleep_in','day_centre')) default 'personal_care',
  tasks_completed jsonb default '[]',
  tasks_total jsonb default '[]',
  location_check_in jsonb,
  location_check_out jsonb,
  handover_notes text,
  wellbeing_score int check (wellbeing_score between 1 and 5),
  cancelled_reason text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- VISIT NOTES
-- ============================================================
create table if not exists visit_notes (
  id uuid primary key default uuid_generate_v4(),
  visit_id uuid not null references visits(id) on delete cascade,
  client_id uuid not null references clients(id) on delete cascade,
  author_id uuid references users(id),
  note_type text check (note_type in ('general','concern','positive','handover','body_map','voice')) default 'general',
  body text not null,
  transcript text,
  audio_url text,
  flagged boolean default false,
  flag_reason text,
  created_at timestamptz default now()
);

-- ============================================================
-- RISK ASSESSMENTS
-- ============================================================
create table if not exists risk_assessments (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid not null references clients(id) on delete cascade,
  organisation_id uuid not null references organisations(id) on delete cascade,
  assessed_by uuid references users(id),
  overall_risk text check (overall_risk in ('low','medium','high','critical')) default 'low',
  falls_risk jsonb default '{}',
  medication_risk jsonb default '{}',
  nutrition_risk jsonb default '{}',
  skin_integrity_risk jsonb default '{}',
  mental_health_risk jsonb default '{}',
  environmental_risk jsonb default '{}',
  moving_handling_risk jsonb default '{}',
  additional_risks jsonb default '[]',
  review_date date,
  approved_by uuid references users(id),
  approved_at timestamptz,
  ai_generated boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- AI-generated risk flags (live monitoring)
create table if not exists ai_risk_flags (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid not null references clients(id) on delete cascade,
  organisation_id uuid not null references organisations(id) on delete cascade,
  flag_type text not null,
  severity text check (severity in ('info','warning','urgent','critical')) default 'warning',
  title text not null,
  description text not null,
  evidence jsonb default '[]',
  recommended_action text,
  is_resolved boolean default false,
  resolved_by uuid references users(id),
  resolved_at timestamptz,
  resolution_notes text,
  created_at timestamptz default now()
);

-- ============================================================
-- INCIDENTS
-- ============================================================
create table if not exists incidents (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid not null references clients(id) on delete cascade,
  organisation_id uuid not null references organisations(id) on delete cascade,
  reported_by uuid references users(id),
  incident_type text check (incident_type in ('fall','medication_error','behaviour','injury','near_miss','safeguarding','property_damage','complaint','other')) not null,
  severity text check (severity in ('minor','moderate','serious','critical')) default 'minor',
  title text not null,
  description text not null,
  date_time timestamptz not null,
  location text,
  witnesses jsonb default '[]',
  injuries_sustained boolean default false,
  injury_details text,
  hospital_attendance boolean default false,
  ambulance_called boolean default false,
  gp_notified boolean default false,
  nok_notified boolean default false,
  cqc_reportable boolean default false,
  cqc_reported boolean default false,
  cqc_reference text,
  actions_taken text,
  preventive_measures text,
  investigation_status text check (investigation_status in ('open','under_investigation','closed')) default 'open',
  closed_by uuid references users(id),
  closed_at timestamptz,
  report_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- COMPLAINTS
-- ============================================================
create table if not exists complaints (
  id uuid primary key default uuid_generate_v4(),
  organisation_id uuid not null references organisations(id) on delete cascade,
  client_id uuid references clients(id),
  complainant_name text not null,
  complainant_relationship text,
  complainant_email text,
  complainant_phone text,
  complaint_type text check (complaint_type in ('care_quality','staff_conduct','communication','scheduling','billing','other')) default 'other',
  description text not null,
  date_received date not null,
  target_resolution_date date,
  actual_resolution_date date,
  status text check (status in ('received','acknowledged','investigating','resolved','escalated','closed')) default 'received',
  priority text check (priority in ('low','medium','high','urgent')) default 'medium',
  assigned_to uuid references users(id),
  outcome text,
  lessons_learned text,
  cqc_reportable boolean default false,
  ombudsman_escalated boolean default false,
  created_by uuid references users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- EMERGENCY ACCESS TOKENS (for paramedics)
-- ============================================================
create table if not exists emergency_access_tokens (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid not null references clients(id) on delete cascade,
  organisation_id uuid not null references organisations(id) on delete cascade,
  token text unique not null default encode(gen_random_bytes(16), 'hex'),
  pin_hash text not null,
  is_active boolean default true,
  last_accessed_at timestamptz,
  access_count int default 0,
  created_at timestamptz default now()
);

-- ============================================================
-- EMERGENCY EVENTS (paramedic access log)
-- ============================================================
create table if not exists emergency_events (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid not null references clients(id) on delete cascade,
  token_id uuid references emergency_access_tokens(id),
  accessed_at timestamptz default now(),
  accessor_ip text,
  notes text
);

-- ============================================================
-- FAMILY ACCESS
-- ============================================================
create table if not exists family_access (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid not null references clients(id) on delete cascade,
  organisation_id uuid not null references organisations(id) on delete cascade,
  user_id uuid references users(id),
  invited_email text not null,
  relationship text,
  access_level text check (access_level in ('view_only','view_and_message')) default 'view_only',
  can_view_care_plan boolean default true,
  can_view_visits boolean default true,
  can_view_medications boolean default false,
  can_view_incidents boolean default false,
  invite_token text unique default encode(gen_random_bytes(16), 'hex'),
  invite_accepted boolean default false,
  invite_accepted_at timestamptz,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- ============================================================
-- FAMILY BRIEFINGS (AI-generated)
-- ============================================================
create table if not exists family_briefings (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid not null references clients(id) on delete cascade,
  organisation_id uuid not null references organisations(id) on delete cascade,
  generated_by uuid references users(id),
  period_start date not null,
  period_end date not null,
  briefing_text text not null,
  highlights jsonb default '[]',
  concerns jsonb default '[]',
  sent_to jsonb default '[]',
  sent_at timestamptz,
  created_at timestamptz default now()
);

-- ============================================================
-- NUTRITION PROFILES
-- ============================================================
create table if not exists nutrition_profiles (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid not null references clients(id) on delete cascade,
  organisation_id uuid not null references organisations(id) on delete cascade,
  iddsi_food_level int check (iddsi_food_level between 0 and 7) default 7,
  iddsi_drink_level int check (iddsi_drink_level between 0 and 4) default 0,
  weight_kg numeric(5,2),
  height_cm numeric(5,2),
  bmi numeric(4,1),
  must_score int,
  requires_supplement boolean default false,
  supplement_name text,
  fortified_diet boolean default false,
  fluid_restriction_ml int,
  fluid_restriction_reason text,
  feeding_method text check (feeding_method in ('oral','peg','nasogastric','assisted')) default 'oral',
  assistance_required text,
  food_preferences jsonb default '{}',
  food_allergies text[],
  cultural_dietary_needs text,
  last_weighed_at date,
  dietitian_referral boolean default false,
  dietitian_name text,
  slp_referral boolean default false,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- MEAL PREFERENCES
-- ============================================================
create table if not exists meal_preferences (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid not null references clients(id) on delete cascade,
  meal_type text check (meal_type in ('breakfast','morning_snack','lunch','afternoon_snack','dinner','evening_snack')) not null,
  preferences jsonb default '[]',
  dislikes jsonb default '[]',
  notes text,
  created_at timestamptz default now()
);

-- ============================================================
-- MEAL RECORDS
-- ============================================================
create table if not exists meal_records (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid not null references clients(id) on delete cascade,
  visit_id uuid references visits(id),
  recorded_by uuid references users(id),
  meal_type text not null,
  food_offered text,
  percentage_eaten int check (percentage_eaten between 0 and 100),
  fluid_ml int,
  refused boolean default false,
  refusal_reason text,
  notes text,
  recorded_at timestamptz default now()
);

-- ============================================================
-- COMPLIANCE EVIDENCE (CQC)
-- ============================================================
create table if not exists compliance_evidence (
  id uuid primary key default uuid_generate_v4(),
  organisation_id uuid not null references organisations(id) on delete cascade,
  uploaded_by uuid references users(id),
  category text check (category in ('safe','effective','caring','responsive','well_led')) not null,
  title text not null,
  description text,
  document_url text,
  document_type text,
  evidence_date date,
  expiry_date date,
  tags text[],
  created_at timestamptz default now()
);

-- ============================================================
-- DEMO REQUESTS (from marketing site)
-- ============================================================
create table if not exists demo_requests (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  email text not null,
  phone text,
  organisation_name text not null,
  role text,
  client_count text,
  message text,
  status text check (status in ('new','contacted','demo_scheduled','converted','not_interested')) default 'new',
  created_at timestamptz default now()
);

-- ============================================================
-- INDEXES
-- ============================================================
create index if not exists idx_clients_org on clients(organisation_id);
create index if not exists idx_clients_status on clients(status);
create index if not exists idx_visits_client on visits(client_id);
create index if not exists idx_visits_carer on visits(carer_id);
create index if not exists idx_visits_org on visits(organisation_id);
create index if not exists idx_visits_start on visits(scheduled_start);
create index if not exists idx_visit_notes_visit on visit_notes(visit_id);
create index if not exists idx_medications_client on medications(client_id);
create index if not exists idx_care_plans_client on care_plans(client_id);
create index if not exists idx_incidents_client on incidents(client_id);
create index if not exists idx_incidents_org on incidents(organisation_id);
create index if not exists idx_ai_risk_flags_client on ai_risk_flags(client_id);
create index if not exists idx_family_access_client on family_access(client_id);
create index if not exists idx_users_org on users(organisation_id);
create index if not exists idx_users_role on users(role);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table organisations enable row level security;
alter table users enable row level security;
alter table clients enable row level security;
alter table care_plans enable row level security;
alter table care_plan_views enable row level security;
alter table medications enable row level security;
alter table medication_records enable row level security;
alter table visits enable row level security;
alter table visit_notes enable row level security;
alter table risk_assessments enable row level security;
alter table ai_risk_flags enable row level security;
alter table incidents enable row level security;
alter table complaints enable row level security;
alter table emergency_access_tokens enable row level security;
alter table emergency_events enable row level security;
alter table family_access enable row level security;
alter table family_briefings enable row level security;
alter table nutrition_profiles enable row level security;
alter table meal_preferences enable row level security;
alter table meal_records enable row level security;
alter table compliance_evidence enable row level security;
alter table demo_requests enable row level security;

-- Helper: get caller's organisation_id
create or replace function get_my_org_id()
returns uuid language sql stable security definer as $$
  select organisation_id from users where id = auth.uid()
$$;

-- Helper: get caller's role
create or replace function get_my_role()
returns text language sql stable security definer as $$
  select role from users where id = auth.uid()
$$;

-- ORGANISATIONS — members see their own org
create policy "org_select" on organisations for select
  using (id = get_my_org_id());

create policy "org_update" on organisations for update
  using (id = get_my_org_id() and get_my_role() in ('owner','admin'));

-- USERS — same org
create policy "users_select" on users for select
  using (organisation_id = get_my_org_id());

create policy "users_insert" on users for insert
  with check (organisation_id = get_my_org_id());

create policy "users_update" on users for update
  using (id = auth.uid() or get_my_role() in ('owner','manager','admin'));

-- CLIENTS — same org
create policy "clients_select" on clients for select
  using (organisation_id = get_my_org_id());

create policy "clients_insert" on clients for insert
  with check (organisation_id = get_my_org_id());

create policy "clients_update" on clients for update
  using (organisation_id = get_my_org_id());

-- CARE PLANS
create policy "care_plans_select" on care_plans for select
  using (organisation_id = get_my_org_id());

create policy "care_plans_insert" on care_plans for insert
  with check (organisation_id = get_my_org_id());

create policy "care_plans_update" on care_plans for update
  using (organisation_id = get_my_org_id());

-- CARE PLAN VIEWS
create policy "care_plan_views_select" on care_plan_views for select
  using (exists (select 1 from care_plans cp where cp.id = care_plan_id and cp.organisation_id = get_my_org_id()));

create policy "care_plan_views_insert" on care_plan_views for insert
  with check (carer_id = auth.uid());

-- MEDICATIONS
create policy "medications_select" on medications for select
  using (organisation_id = get_my_org_id());

create policy "medications_insert" on medications for insert
  with check (organisation_id = get_my_org_id());

create policy "medications_update" on medications for update
  using (organisation_id = get_my_org_id());

-- MEDICATION RECORDS
create policy "medication_records_select" on medication_records for select
  using (exists (select 1 from clients c where c.id = client_id and c.organisation_id = get_my_org_id()));

create policy "medication_records_insert" on medication_records for insert
  with check (exists (select 1 from clients c where c.id = client_id and c.organisation_id = get_my_org_id()));

-- VISITS
create policy "visits_select" on visits for select
  using (organisation_id = get_my_org_id());

create policy "visits_insert" on visits for insert
  with check (organisation_id = get_my_org_id());

create policy "visits_update" on visits for update
  using (organisation_id = get_my_org_id());

-- VISIT NOTES
create policy "visit_notes_select" on visit_notes for select
  using (exists (select 1 from visits v where v.id = visit_id and v.organisation_id = get_my_org_id()));

create policy "visit_notes_insert" on visit_notes for insert
  with check (exists (select 1 from visits v where v.id = visit_id and v.organisation_id = get_my_org_id()));

-- RISK ASSESSMENTS
create policy "risk_assessments_select" on risk_assessments for select
  using (organisation_id = get_my_org_id());

create policy "risk_assessments_insert" on risk_assessments for insert
  with check (organisation_id = get_my_org_id());

create policy "risk_assessments_update" on risk_assessments for update
  using (organisation_id = get_my_org_id());

-- AI RISK FLAGS
create policy "ai_risk_flags_select" on ai_risk_flags for select
  using (organisation_id = get_my_org_id());

create policy "ai_risk_flags_insert" on ai_risk_flags for insert
  with check (organisation_id = get_my_org_id());

create policy "ai_risk_flags_update" on ai_risk_flags for update
  using (organisation_id = get_my_org_id());

-- INCIDENTS
create policy "incidents_select" on incidents for select
  using (organisation_id = get_my_org_id());

create policy "incidents_insert" on incidents for insert
  with check (organisation_id = get_my_org_id());

create policy "incidents_update" on incidents for update
  using (organisation_id = get_my_org_id());

-- COMPLAINTS
create policy "complaints_select" on complaints for select
  using (organisation_id = get_my_org_id());

create policy "complaints_insert" on complaints for insert
  with check (organisation_id = get_my_org_id());

create policy "complaints_update" on complaints for update
  using (organisation_id = get_my_org_id());

-- EMERGENCY ACCESS TOKENS — public select by token (for paramedics)
create policy "emergency_tokens_public_select" on emergency_access_tokens for select
  using (true);

create policy "emergency_tokens_org_insert" on emergency_access_tokens for insert
  with check (organisation_id = get_my_org_id());

-- EMERGENCY EVENTS — public insert (paramedic logs access without auth)
create policy "emergency_events_insert" on emergency_events for insert
  with check (true);

create policy "emergency_events_select" on emergency_events for select
  using (exists (select 1 from emergency_access_tokens t where t.id = token_id and t.organisation_id = get_my_org_id()));

-- FAMILY ACCESS
create policy "family_access_select" on family_access for select
  using (organisation_id = get_my_org_id() or user_id = auth.uid());

create policy "family_access_insert" on family_access for insert
  with check (organisation_id = get_my_org_id());

create policy "family_access_update" on family_access for update
  using (organisation_id = get_my_org_id() or user_id = auth.uid());

-- FAMILY BRIEFINGS
create policy "family_briefings_select" on family_briefings for select
  using (organisation_id = get_my_org_id() or
    exists (select 1 from family_access fa where fa.client_id = family_briefings.client_id and fa.user_id = auth.uid() and fa.is_active));

create policy "family_briefings_insert" on family_briefings for insert
  with check (organisation_id = get_my_org_id());

-- NUTRITION PROFILES
create policy "nutrition_select" on nutrition_profiles for select
  using (organisation_id = get_my_org_id());

create policy "nutrition_insert" on nutrition_profiles for insert
  with check (organisation_id = get_my_org_id());

create policy "nutrition_update" on nutrition_profiles for update
  using (organisation_id = get_my_org_id());

-- MEAL PREFERENCES
create policy "meal_pref_select" on meal_preferences for select
  using (exists (select 1 from clients c where c.id = client_id and c.organisation_id = get_my_org_id()));

create policy "meal_pref_insert" on meal_preferences for insert
  with check (exists (select 1 from clients c where c.id = client_id and c.organisation_id = get_my_org_id()));

-- MEAL RECORDS
create policy "meal_records_select" on meal_records for select
  using (exists (select 1 from clients c where c.id = client_id and c.organisation_id = get_my_org_id()));

create policy "meal_records_insert" on meal_records for insert
  with check (exists (select 1 from clients c where c.id = client_id and c.organisation_id = get_my_org_id()));

-- COMPLIANCE EVIDENCE
create policy "compliance_select" on compliance_evidence for select
  using (organisation_id = get_my_org_id());

create policy "compliance_insert" on compliance_evidence for insert
  with check (organisation_id = get_my_org_id());

-- DEMO REQUESTS — anyone can insert, only service role reads
create policy "demo_requests_insert" on demo_requests for insert
  with check (true);

-- ============================================================
-- AUTH TRIGGER — auto-create user row on signup
-- ============================================================
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into users (id, email, first_name, last_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'first_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'last_name', ''),
    coalesce(new.raw_user_meta_data->>'role', 'owner')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================
create or replace function touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger touch_organisations before update on organisations for each row execute function touch_updated_at();
create trigger touch_users before update on users for each row execute function touch_updated_at();
create trigger touch_clients before update on clients for each row execute function touch_updated_at();
create trigger touch_care_plans before update on care_plans for each row execute function touch_updated_at();
create trigger touch_medications before update on medications for each row execute function touch_updated_at();
create trigger touch_visits before update on visits for each row execute function touch_updated_at();
create trigger touch_risk_assessments before update on risk_assessments for each row execute function touch_updated_at();
create trigger touch_incidents before update on incidents for each row execute function touch_updated_at();
create trigger touch_complaints before update on complaints for each row execute function touch_updated_at();
create trigger touch_nutrition_profiles before update on nutrition_profiles for each row execute function touch_updated_at();
