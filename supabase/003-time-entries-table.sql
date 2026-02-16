-- ============================================
-- PROJ-5: Arbeitszeiterfassung — time_entries Tabelle
-- ============================================
-- Dieses SQL im Supabase Dashboard unter "SQL Editor" ausfuehren.
-- Es erstellt die time_entries-Tabelle mit RLS Policies.

-- 1. time_entries Tabelle erstellen
create table if not exists public.time_entries (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  datum date not null,
  stunden numeric(3,1) not null check (stunden >= 0 and stunden <= 24),
  arbeitsort text not null default 'office' check (arbeitsort in ('office', 'homeoffice', 'remote', 'kunde')),
  kommentar text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Nur ein Eintrag pro User pro Tag
  unique (user_id, datum)
);

-- 2. Indexes fuer schnelle Abfragen
create index if not exists time_entries_user_id_idx on public.time_entries (user_id);
create index if not exists time_entries_datum_idx on public.time_entries (datum);
create index if not exists time_entries_user_datum_idx on public.time_entries (user_id, datum);

-- 3. Auto-Update fuer updated_at (nutzt bestehende handle_updated_at Funktion)
create trigger on_time_entries_updated
  before update on public.time_entries
  for each row
  execute function public.handle_updated_at();

-- 4. Row Level Security aktivieren
alter table public.time_entries enable row level security;

-- 5. RLS Policies

-- Mitarbeiter kann eigene Eintraege lesen
create policy "Users can read own time entries"
  on public.time_entries for select
  using (auth.uid() = user_id);

-- Mitarbeiter kann eigene Eintraege erstellen
create policy "Users can create own time entries"
  on public.time_entries for insert
  with check (auth.uid() = user_id);

-- Mitarbeiter kann eigene Eintraege bearbeiten
create policy "Users can update own time entries"
  on public.time_entries for update
  using (auth.uid() = user_id);

-- Mitarbeiter kann eigene Eintraege loeschen
create policy "Users can delete own time entries"
  on public.time_entries for delete
  using (auth.uid() = user_id);

-- Manager koennen Eintraege ihres Teams lesen
create policy "Managers can read all time entries"
  on public.time_entries for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and rolle in ('manager', 'admin')
    )
  );

-- ============================================
-- FERTIG! Nach Ausfuehrung:
-- 1. Pruefe ob die Tabelle im Table Editor sichtbar ist
-- 2. Teste mit einem INSERT ueber die API
-- ============================================
