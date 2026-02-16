-- ============================================
-- CLEANUP: Fehlerhafte Test-User entfernen
-- ============================================
-- Löscht alle Test-User, die über das fehlerhafte Script erstellt wurden

-- ============================================
-- SCHRITT 1: Test-User aus auth.users löschen
-- ============================================

-- Lösche alle User mit @test.de E-Mail
DELETE FROM auth.users
WHERE email LIKE '%@test.de';

-- Bestätigung anzeigen
DO $$
BEGIN
  RAISE NOTICE 'Test-User mit @test.de wurden gelöscht';
END $$;

-- ============================================
-- SCHRITT 2: Verwaiste Profile löschen (falls vorhanden)
-- ============================================

-- Lösche Profile, deren auth.users nicht mehr existieren
DELETE FROM public.profiles
WHERE id NOT IN (SELECT id FROM auth.users);

DO $$
BEGIN
  RAISE NOTICE 'Verwaiste Profile wurden gelöscht';
END $$;

-- ============================================
-- SCHRITT 3: Verifizierung
-- ============================================

-- Zeige alle verbleibenden User
SELECT
  u.id,
  u.email,
  u.created_at,
  p.vorname,
  p.nachname,
  p.rolle
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
ORDER BY u.created_at DESC;

-- ============================================
-- OPTIONAL: Alle User löschen (NUR FÜR RESET)
-- ============================================
/*
-- ACHTUNG: Löscht ALLE User in der Datenbank!
-- Nur ausführen wenn du komplett von vorne anfangen willst

-- DELETE FROM auth.users;
-- DELETE FROM public.profiles;

-- RAISE NOTICE 'ALLE User und Profile wurden gelöscht!';
*/

-- ============================================
-- INFO
-- ============================================
-- Nach diesem Cleanup kannst du neue User erstellen über:
-- 1. Supabase Dashboard → Authentication → Users → "Add user"
-- 2. Oder über die normale Sign-Up Funktion der App
