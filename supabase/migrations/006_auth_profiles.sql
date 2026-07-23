-- Auth: auto-create CMS profile when Supabase user registers (FR-DASH / pre-live §1.9)
-- Apply after 001_initial.sql. Set role via raw_user_meta_data.role on invite or UPDATE profiles.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce((new.raw_user_meta_data->>'role')::public.app_role, 'business')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Example: promote user to legal after signup (run manually in SQL editor)
-- update public.profiles set role = 'legal', full_name = 'Legal Admin' where id = '<auth.users.id>';
