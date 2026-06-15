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
