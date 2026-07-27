-- Tighten broad organisation-level RLS found during live role testing.
-- Office users can manage organisation records. Care staff and family members
-- only see records they are directly assigned or granted access to.

drop policy if exists "users_org_isolation" on public.users;

create policy "users_select_self" on public.users
  for select using (id = auth.uid());

create policy "users_select_office_org" on public.users
  for select using (
    public.current_user_role() = 'superadmin'
    or (
      public.current_user_role() in ('org_admin', 'manager', 'coordinator', 'admin')
      and organisation_id = public.current_user_org_id()
    )
  );

create policy "users_insert_office_org" on public.users
  for insert with check (
    public.current_user_role() = 'superadmin'
    or (
      public.current_user_role() in ('org_admin', 'manager', 'coordinator', 'admin')
      and organisation_id = public.current_user_org_id()
    )
  );

create policy "users_update_office_org" on public.users
  for update using (
    public.current_user_role() = 'superadmin'
    or (
      public.current_user_role() in ('org_admin', 'manager', 'coordinator', 'admin')
      and organisation_id = public.current_user_org_id()
    )
  )
  with check (
    public.current_user_role() = 'superadmin'
    or (
      public.current_user_role() in ('org_admin', 'manager', 'coordinator', 'admin')
      and organisation_id = public.current_user_org_id()
    )
  );

drop policy if exists "clients_org_isolation" on public.clients;
drop policy if exists "clients_select" on public.clients;
drop policy if exists "clients_insert" on public.clients;
drop policy if exists "clients_update" on public.clients;

create policy "clients_select_office_org" on public.clients
  for select using (
    public.current_user_role() = 'superadmin'
    or (
      public.current_user_role() in ('org_admin', 'manager', 'coordinator', 'admin')
      and organisation_id = public.current_user_org_id()
    )
  );

create policy "clients_select_family_access" on public.clients
  for select using (
    exists (
      select 1
      from public.family_access fa
      where fa.client_id = clients.id
        and fa.user_id = auth.uid()
        and fa.is_active = true
    )
  );

create policy "clients_select_carer_visits" on public.clients
  for select using (
    exists (
      select 1
      from public.visits v
      where v.client_id = clients.id
        and v.carer_id = auth.uid()
    )
  );

create policy "clients_select_carer_shifts" on public.clients
  for select using (
    exists (
      select 1
      from public.shifts s
      where clients.id = any(s.client_ids)
        and s.staff_id = auth.uid()
    )
  );

create policy "clients_insert_office_org" on public.clients
  for insert with check (
    public.current_user_role() = 'superadmin'
    or (
      public.current_user_role() in ('org_admin', 'manager', 'coordinator', 'admin')
      and organisation_id = public.current_user_org_id()
    )
  );

create policy "clients_update_office_org" on public.clients
  for update using (
    public.current_user_role() = 'superadmin'
    or (
      public.current_user_role() in ('org_admin', 'manager', 'coordinator', 'admin')
      and organisation_id = public.current_user_org_id()
    )
  )
  with check (
    public.current_user_role() = 'superadmin'
    or (
      public.current_user_role() in ('org_admin', 'manager', 'coordinator', 'admin')
      and organisation_id = public.current_user_org_id()
    )
  );
