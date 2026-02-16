-- ============================================
-- Script zum Einfügen von Test-Benutzern
-- ============================================
-- WICHTIG: Benutzer müssen zuerst in auth.users existieren!
-- Entweder über Supabase Auth UI registrieren oder unten die IDs anpassen.

-- ============================================
-- 1. BESTEHENDE AUTH-USER IDS FINDEN
-- ============================================
-- Führe diese Abfrage aus, um die UUIDs deiner existierenden Benutzer zu sehen:

-- SELECT id, email FROM auth.users;

-- Kopiere die UUID des gewünschten Benutzers und ersetze damit die Platzhalter unten.


-- ============================================
-- 2. PROFILE EINFÜGEN
-- ============================================

-- Beispiel 1: Mitarbeiter
INSERT INTO public.profiles (id, email, vorname, nachname, job_titel, rolle, urlaubstage_gesamt)
VALUES (
  'HIER-AUTH-USER-UUID-EINFÜGEN'::uuid,  -- z.B. '123e4567-e89b-12d3-a456-426614174000'
  'mitarbeiter@example.com',
  'Max',
  'Mustermann',
  'Junior Developer',
  'mitarbeiter',
  30
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  vorname = EXCLUDED.vorname,
  nachname = EXCLUDED.nachname,
  job_titel = EXCLUDED.job_titel,
  rolle = EXCLUDED.rolle,
  urlaubstage_gesamt = EXCLUDED.urlaubstage_gesamt;

-- Beispiel 2: Manager
INSERT INTO public.profiles (id, email, vorname, nachname, job_titel, rolle, urlaubstage_gesamt)
VALUES (
  'HIER-AUTH-USER-UUID-EINFÜGEN'::uuid,
  'manager@example.com',
  'Anna',
  'Schmidt',
  'Team Lead',
  'manager',
  30
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  vorname = EXCLUDED.vorname,
  nachname = EXCLUDED.nachname,
  job_titel = EXCLUDED.job_titel,
  rolle = EXCLUDED.rolle,
  urlaubstage_gesamt = EXCLUDED.urlaubstage_gesamt;

-- Beispiel 3: Admin
INSERT INTO public.profiles (id, email, vorname, nachname, job_titel, rolle, urlaubstage_gesamt)
VALUES (
  'HIER-AUTH-USER-UUID-EINFÜGEN'::uuid,
  'admin@example.com',
  'Thomas',
  'Weber',
  'CTO',
  'admin',
  30
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  vorname = EXCLUDED.vorname,
  nachname = EXCLUDED.nachname,
  job_titel = EXCLUDED.job_titel,
  rolle = EXCLUDED.rolle,
  urlaubstage_gesamt = EXCLUDED.urlaubstage_gesamt;


-- ============================================
-- 3. VORHANDENE PROFILE AKTUALISIEREN
-- ============================================
-- Falls du ein bestehendes Profil aktualisieren möchtest:

-- UPDATE public.profiles
-- SET
--   rolle = 'manager',
--   job_titel = 'Senior Developer',
--   urlaubstage_gesamt = 30
-- WHERE email = 'deine-email@example.com';


-- ============================================
-- 4. ALLE PROFILE ANZEIGEN
-- ============================================
-- Zur Überprüfung:

-- SELECT id, email, vorname, nachname, job_titel, rolle, urlaubstage_gesamt, ist_aktiv
-- FROM public.profiles
-- ORDER BY created_at DESC;


-- ============================================
-- ANLEITUNG
-- ============================================
-- 1. Registriere Benutzer über die Supabase Auth UI oder über die App
-- 2. Führe "SELECT id, email FROM auth.users;" aus, um die UUIDs zu sehen
-- 3. Ersetze 'HIER-AUTH-USER-UUID-EINFÜGEN' mit den echten UUIDs
-- 4. Passe E-Mail, Namen, Job-Titel und Rolle nach Bedarf an
-- 5. Führe die INSERT-Statements aus
