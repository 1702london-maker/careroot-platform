-- Fix recursive users RLS policy.
-- The previous users_org_isolation policy queried public.users from a policy
-- on public.users, causing PostgreSQL error 42P17:
-- "infinite recursion detected in policy for relation users".

create or replace function public.current_user_org_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select organisation_id
  from public.users
  where id = auth.uid()
$$;

create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.users
  where id = auth.uid()
$$;

grant execute on function public.current_user_org_id() to authenticated;
grant execute on function public.current_user_role() to authenticated;

drop policy if exists "users_org_isolation" on public.users;

create policy "users_org_isolation" on public.users
  for all using (
    id = auth.uid()
    or organisation_id = public.current_user_org_id()
    or public.current_user_role() = 'superadmin'
  )
  with check (
    id = auth.uid()
    or organisation_id = public.current_user_org_id()
    or public.current_user_role() = 'superadmin'
  );
