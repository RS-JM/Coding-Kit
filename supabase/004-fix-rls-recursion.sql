-- ============================================
-- FIX: Infinite Recursion in RLS Policies
-- ============================================
-- Problem: Policies auf profiles/time_entries referenzieren profiles
-- mit Subquery → profiles RLS wird erneut ausgewertet → Endlosschleife.
-- Lösung: SECURITY DEFINER Funktionen umgehen RLS beim Rollen-Check.

-- 1. Helper-Funktionen (SECURITY DEFINER = umgeht RLS)

CREATE OR REPLACE FUNCTION public.is_manager_or_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND rolle IN ('manager', 'admin')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND rolle = 'admin'
  );
$$;

-- 2. Profiles-Policies fixen

DROP POLICY IF EXISTS "Managers can read all profiles" ON public.profiles;
CREATE POLICY "Managers can read all profiles"
  ON public.profiles FOR SELECT
  USING (public.is_manager_or_admin());

DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  USING (public.is_admin());

-- 3. Time-Entries-Policy fixen

DROP POLICY IF EXISTS "Managers can read all time entries" ON public.time_entries;
CREATE POLICY "Managers can read all time entries"
  ON public.time_entries FOR SELECT
  USING (public.is_manager_or_admin());

-- ============================================
-- FERTIG! Nach Ausfuehrung:
-- 1. Teste GET /api/time-entries → sollte 200 zurueckgeben
-- 2. Teste POST /api/time-entries → sollte 201 zurueckgeben
-- ============================================
