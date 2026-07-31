-- Allow direct client portal accounts.
-- Live production had client_access but the users.role check constraint still rejected role = 'client'.

ALTER TABLE public.users
  DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE public.users
  ADD CONSTRAINT users_role_check
  CHECK (role IN (
    'superadmin',
    'org_admin',
    'manager',
    'coordinator',
    'senior_carer',
    'carer',
    'family',
    'client',
    'gp'
  ));
