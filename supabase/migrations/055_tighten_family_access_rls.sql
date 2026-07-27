-- Family access rows expose links between relatives and service users.
-- Office users can manage them; family users only see their own access rows.
-- Care staff must not browse family access records.

drop policy if exists "family_access_org_isolation" on public.family_access;
drop policy if exists "family_access_select_office_org" on public.family_access;
drop policy if exists "family_access_select_self" on public.family_access;
drop policy if exists "family_access_insert_office_org" on public.family_access;
drop policy if exists "family_access_update_office_org" on public.family_access;

create policy "family_access_select_self" on public.family_access
  for select using (user_id = auth.uid());

create policy "family_access_select_office_org" on public.family_access
  for select using (
    public.current_user_role() = 'superadmin'
    or (
      public.current_user_role() in ('org_admin', 'manager', 'coordinator', 'admin')
      and organisation_id = public.current_user_org_id()
    )
  );

create policy "family_access_insert_office_org" on public.family_access
  for insert with check (
    public.current_user_role() = 'superadmin'
    or (
      public.current_user_role() in ('org_admin', 'manager', 'coordinator', 'admin')
      and organisation_id = public.current_user_org_id()
    )
  );

create policy "family_access_update_office_org" on public.family_access
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
