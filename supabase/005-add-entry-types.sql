-- ============================================
-- Eintragstypen: arbeit, krank, urlaub
-- ============================================
-- Ermoeglicht mehrere Eintraege pro Tag (z.B. 4h Office + 4h Krank)

-- 1. Typ-Spalte hinzufuegen
ALTER TABLE public.time_entries
  ADD COLUMN IF NOT EXISTS typ text NOT NULL DEFAULT 'arbeit'
  CHECK (typ IN ('arbeit', 'krank', 'urlaub'));

-- 2. Unique-Constraint entfernen (mehrere Eintraege pro Tag erlaubt)
ALTER TABLE public.time_entries DROP CONSTRAINT IF EXISTS time_entries_user_id_datum_key;

-- 3. Arbeitsort nullable machen (nicht relevant fuer krank/urlaub)
ALTER TABLE public.time_entries ALTER COLUMN arbeitsort DROP NOT NULL;
ALTER TABLE public.time_entries ALTER COLUMN arbeitsort DROP DEFAULT;

-- 4. Index fuer schnelle Abfragen nach Typ
CREATE INDEX IF NOT EXISTS time_entries_typ_idx ON public.time_entries (typ);

-- ============================================
-- FERTIG! Nach Ausfuehrung im Browser testen.
-- ============================================
