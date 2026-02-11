-- ============================================
-- PROJ-1 Fix: Login-Sperre via RPC Funktionen
-- ============================================
-- Diese Funktionen umgehen RLS mit "security definer",
-- damit die Login-Seite (ohne Auth) die Sperre pruefen kann.

-- 1. Account-Sperre pruefen (aufrufbar ohne Auth)
create or replace function public.check_account_locked(p_email text)
returns json as $$
declare
  result json;
begin
  select json_build_object('is_locked', coalesce(p.is_locked, false))
  into result
  from public.profiles p
  where p.email = p_email;

  if result is null then
    return json_build_object('is_locked', false);
  end if;

  return result;
end;
$$ language plpgsql security definer;

-- 2. Fehlversuch zaehlen und ggf. sperren (aufrufbar ohne Auth)
create or replace function public.record_failed_login(p_email text)
returns json as $$
declare
  new_attempts integer;
  now_locked boolean;
begin
  update public.profiles
  set
    failed_login_attempts = failed_login_attempts + 1,
    is_locked = case when failed_login_attempts + 1 >= 5 then true else false end,
    locked_at = case when failed_login_attempts + 1 >= 5 then now() else locked_at end
  where email = p_email
  returning failed_login_attempts, is_locked into new_attempts, now_locked;

  if new_attempts is null then
    return json_build_object('is_locked', false, 'attempts', 0);
  end if;

  return json_build_object('is_locked', coalesce(now_locked, false), 'attempts', coalesce(new_attempts, 0));
end;
$$ language plpgsql security definer;

-- 3. Fehlversuche zuruecksetzen (nach erfolgreichem Login)
create or replace function public.reset_failed_login(p_user_id uuid)
returns void as $$
begin
  update public.profiles
  set failed_login_attempts = 0
  where id = p_user_id;
end;
$$ language plpgsql security definer;

-- 4. Alte offene Update-Policy entfernen (nicht mehr noetig)
drop policy if exists "Allow login attempt tracking" on public.profiles;

-- ============================================
-- Dieses SQL im Supabase SQL Editor ausfuehren!
-- ============================================
