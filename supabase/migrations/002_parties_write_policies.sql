-- Parties write policies + audit insert (run after 001_initial.sql)

create policy "parties_insert_authenticated" on public.parties
  for insert to authenticated with check (true);

create policy "parties_update_authenticated" on public.parties
  for update to authenticated using (true) with check (true);

create policy "audit_insert_authenticated" on public.audit_logs
  for insert to authenticated with check (true);

-- CMS app uses service role on server until Supabase Auth is wired in the UI.
