-- ============================================
-- Profile für Test-User erstellen/aktualisieren
-- ============================================
-- VORAUSSETZUNG: User müssen bereits über Supabase Dashboard erstellt sein!
-- Dashboard → Authentication → Users → "Add user"

-- ============================================
-- Profile erstellen
-- ============================================

-- Mitarbeiter-Profil
INSERT INTO public.profiles (id, email, vorname, nachname, job_titel, rolle, urlaubstage_gesamt)
SELECT
  id,
  email,
  'Max',
  'Mustermann',
  'Junior Developer',
  'mitarbeiter',
  30
FROM auth.users
WHERE email = 'mitarbeiter@test.de'
ON CONFLICT (id) DO UPDATE SET
  vorname = EXCLUDED.vorname,
  nachname = EXCLUDED.nachname,
  job_titel = EXCLUDED.job_titel,
  rolle = EXCLUDED.rolle,
  urlaubstage_gesamt = EXCLUDED.urlaubstage_gesamt;

-- Manager-Profil
INSERT INTO public.profiles (id, email, vorname, nachname, job_titel, rolle, urlaubstage_gesamt)
SELECT
  id,
  email,
  'Anna',
  'Schmidt',
  'Team Lead',
  'manager',
  30
FROM auth.users
WHERE email = 'manager@test.de'
ON CONFLICT (id) DO UPDATE SET
  vorname = EXCLUDED.vorname,
  nachname = EXCLUDED.nachname,
  job_titel = EXCLUDED.job_titel,
  rolle = EXCLUDED.rolle,
  urlaubstage_gesamt = EXCLUDED.urlaubstage_gesamt;

-- Admin-Profil
INSERT INTO public.profiles (id, email, vorname, nachname, job_titel, rolle, urlaubstage_gesamt)
SELECT
  id,
  email,
  'Thomas',
  'Weber',
  'CTO',
  'admin',
  30
FROM auth.users
WHERE email = 'admin@test.de'
ON CONFLICT (id) DO UPDATE SET
  vorname = EXCLUDED.vorname,
  nachname = EXCLUDED.nachname,
  job_titel = EXCLUDED.job_titel,
  rolle = EXCLUDED.rolle,
  urlaubstage_gesamt = EXCLUDED.urlaubstage_gesamt;

-- ============================================
-- Verifizierung
-- ============================================

-- Zeige alle Test-User mit ihren Profilen
SELECT
  u.id,
  u.email,
  u.email_confirmed_at,
  p.vorname,
  p.nachname,
  p.job_titel,
  p.rolle,
  p.urlaubstage_gesamt,
  p.ist_aktiv
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE u.email LIKE '%@test.de'
ORDER BY p.rolle;
