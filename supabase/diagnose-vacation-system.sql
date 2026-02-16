-- ============================================
-- DIAGNOSE: Urlaubssystem überprüfen
-- ============================================
-- Prüft ob alle Tabellen und Felder korrekt eingerichtet sind

-- ============================================
-- 1. Prüfe ob vacation_requests Tabelle existiert
-- ============================================
SELECT
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name = 'vacation_requests';

-- Ergebnis: Sollte 1 Zeile zeigen, sonst fehlt Migration 006

-- ============================================
-- 2. Prüfe Spalten der vacation_requests Tabelle
-- ============================================
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'vacation_requests'
ORDER BY ordinal_position;

-- Wichtig: 'ablehnungsgrund' sollte vorhanden sein (Migration 007)

-- ============================================
-- 3. Prüfe RLS Policies
-- ============================================
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'vacation_requests';

-- Sollte Policies für SELECT zeigen

-- ============================================
-- 4. Teste SELECT als aktueller User
-- ============================================
SELECT
  id,
  user_id,
  start_datum,
  end_datum,
  arbeitstage,
  status,
  ablehnungsgrund,
  created_at
FROM vacation_requests
ORDER BY created_at DESC
LIMIT 5;

-- Falls Fehler: RLS blockiert oder Tabelle fehlt

-- ============================================
-- 5. Anzahl Urlaubsanträge pro Status
-- ============================================
SELECT
  status,
  COUNT(*) as anzahl
FROM vacation_requests
GROUP BY status
ORDER BY status;

-- ============================================
-- ZUSAMMENFASSUNG
-- ============================================
/*
Wenn alles korrekt ist, solltest du sehen:
1. Tabelle 'vacation_requests' existiert
2. Spalte 'ablehnungsgrund' ist vorhanden
3. RLS Policies sind aktiv
4. SELECT funktioniert ohne Fehler
5. Anträge werden gruppiert nach Status angezeigt

Falls etwas fehlt:
- Migration 006 ausführen (vacation_requests Tabelle)
- Migration 007 ausführen (ablehnungsgrund Spalte)
- RLS Policies prüfen (sollten automatisch mit Migration 006 erstellt werden)
*/
