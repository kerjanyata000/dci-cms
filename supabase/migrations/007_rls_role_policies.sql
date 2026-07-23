-- RLS tighten (§10.5 / BRL-CMS-001) — applies when using Supabase client with user JWT.
-- Server API uses service role and bypasses RLS; these policies protect direct client access.

create or replace function public.current_app_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select role from public.profiles where id = auth.uid()),
    'business'::public.app_role
  );
$$;

-- Drop starter read-all policies
drop policy if exists "parties_select_authenticated" on public.parties;
drop policy if exists "contracts_select_authenticated" on public.contracts;
drop policy if exists "documents_select_authenticated" on public.documents;
drop policy if exists "audit_select_authenticated" on public.audit_logs;

-- Parties: all authenticated read; legal write
create policy "parties_select_auth" on public.parties
  for select to authenticated using (true);

create policy "parties_insert_legal" on public.parties
  for insert to authenticated
  with check (public.current_app_role() = 'legal');

create policy "parties_update_legal" on public.parties
  for update to authenticated
  using (public.current_app_role() = 'legal')
  with check (public.current_app_role() = 'legal');

-- Contracts
create policy "contracts_select_auth" on public.contracts
  for select to authenticated using (true);

create policy "contracts_write_legal" on public.contracts
  for all to authenticated
  using (public.current_app_role() = 'legal')
  with check (public.current_app_role() = 'legal');

-- Documents
create policy "documents_select_auth" on public.documents
  for select to authenticated using (true);

create policy "documents_write_legal" on public.documents
  for all to authenticated
  using (public.current_app_role() = 'legal')
  with check (public.current_app_role() = 'legal');

-- Audit: legal, management, it
create policy "audit_select_roles" on public.audit_logs
  for select to authenticated
  using (public.current_app_role() in ('legal', 'management', 'it'));
