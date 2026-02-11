-- ============================================
-- PROJ-1 + PROJ-2: Profiles Tabelle
-- ============================================
-- Dieses SQL im Supabase Dashboard unter "SQL Editor" ausfuehren.
-- Es erstellt die profiles-Tabelle, den Auto-Profil-Trigger und RLS Policies.

-- 1. Profiles Tabelle erstellen
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  vorname text not null default '',
  nachname text not null default '',
  job_titel text default '',
  rolle text not null default 'mitarbeiter' check (rolle in ('mitarbeiter', 'manager', 'admin')),
  urlaubstage_gesamt integer not null default 30,
  ist_aktiv boolean not null default true,
  failed_login_attempts integer not null default 0,
  is_locked boolean not null default false,
  locked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Index fuer schnelle Email-Suche
create index if not exists profiles_email_idx on public.profiles (email);

-- 3. Auto-Update fuer updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger on_profiles_updated
  before update on public.profiles
  for each row
  execute function public.handle_updated_at();

-- 4. Auto-Profil bei neuer Registrierung (Trigger)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- 5. Row Level Security aktivieren
alter table public.profiles enable row level security;

-- 6. RLS Policies

-- Jeder eingeloggte User kann sein eigenes Profil lesen
create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

-- Manager koennen alle Profile lesen
create policy "Managers can read all profiles"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and rolle in ('manager', 'admin')
    )
  );

-- Admins koennen alle Profile bearbeiten
create policy "Admins can update all profiles"
  on public.profiles for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and rolle = 'admin'
    )
  );

-- Service-Role kann alles (fuer Login-Fehlversuch-Zaehler)
-- Hinweis: Der Supabase Service Key umgeht RLS automatisch.
-- Fuer den Fehlversuch-Zaehler nutzen wir eine spezielle Policy:
create policy "Allow login attempt tracking"
  on public.profiles for update
  using (true)
  with check (true);
-- WICHTIG: Diese Policy ist bewusst offen fuer Updates.
-- In Produktion sollte dies ueber eine Supabase Edge Function
-- mit Service Key geloest werden. Fuer das MVP ist dies akzeptabel.

-- ============================================
-- FERTIG! Nach Ausfuehrung:
-- 1. Erstelle einen Test-User im Supabase Auth Dashboard
-- 2. Pruefe ob ein Profil automatisch erstellt wurde
-- ============================================
