-- ============================================
-- Komplettes Test-User Setup mit Auth + Profile
-- ============================================
-- Erstellt vollständige Test-Benutzer mit Login-Credentials
-- ACHTUNG: Nur für Entwicklung/Testing verwenden!

-- ============================================
-- TEIL 1: Auth-User mit Passwörtern erstellen
-- ============================================

-- Aktiviere pgcrypto Extension (falls nicht vorhanden)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Test-User 1: Mitarbeiter
DO $$
DECLARE
  user_id uuid;
BEGIN
  -- Prüfe ob User bereits existiert
  SELECT id INTO user_id FROM auth.users WHERE email = 'mitarbeiter@test.de';

  IF user_id IS NULL THEN
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data,
      aud,
      role
    )
    VALUES (
      gen_random_uuid(),
      '00000000-0000-0000-0000-000000000000',
      'mitarbeiter@test.de',
      crypt('Test1234!', gen_salt('bf')),
      now(),
      now(),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{}',
      'authenticated',
      'authenticated'
    );
    RAISE NOTICE 'User mitarbeiter@test.de erstellt';
  ELSE
    RAISE NOTICE 'User mitarbeiter@test.de existiert bereits';
  END IF;
END $$;

-- Test-User 2: Manager
DO $$
DECLARE
  user_id uuid;
BEGIN
  SELECT id INTO user_id FROM auth.users WHERE email = 'manager@test.de';

  IF user_id IS NULL THEN
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data,
      aud,
      role
    )
    VALUES (
      gen_random_uuid(),
      '00000000-0000-0000-0000-000000000000',
      'manager@test.de',
      crypt('Test1234!', gen_salt('bf')),
      now(),
      now(),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{}',
      'authenticated',
      'authenticated'
    );
    RAISE NOTICE 'User manager@test.de erstellt';
  ELSE
    RAISE NOTICE 'User manager@test.de existiert bereits';
  END IF;
END $$;

-- Test-User 3: Admin
DO $$
DECLARE
  user_id uuid;
BEGIN
  SELECT id INTO user_id FROM auth.users WHERE email = 'admin@test.de';

  IF user_id IS NULL THEN
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data,
      aud,
      role
    )
    VALUES (
      gen_random_uuid(),
      '00000000-0000-0000-0000-000000000000',
      'admin@test.de',
      crypt('Test1234!', gen_salt('bf')),
      now(),
      now(),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{}',
      'authenticated',
      'authenticated'
    );
    RAISE NOTICE 'User admin@test.de erstellt';
  ELSE
    RAISE NOTICE 'User admin@test.de existiert bereits';
  END IF;
END $$;


-- ============================================
-- TEIL 2: Profile für die Auth-User erstellen
-- ============================================

-- Profil für Mitarbeiter
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

-- Profil für Manager
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

-- Profil für Admin
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
-- TEIL 3: Überprüfung
-- ============================================

-- Zeige alle erstellten Test-User
SELECT
  u.id,
  u.email,
  u.created_at,
  p.vorname,
  p.nachname,
  p.job_titel,
  p.rolle
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE u.email LIKE '%@test.de'
ORDER BY u.created_at DESC;


-- ============================================
-- LOGIN-CREDENTIALS FÜR TESTS
-- ============================================
/*

🔑 Test-Benutzer zum Einloggen:

1. MITARBEITER
   E-Mail: mitarbeiter@test.de
   Passwort: Test1234!
   Rolle: mitarbeiter

2. MANAGER
   E-Mail: manager@test.de
   Passwort: Test1234!
   Rolle: manager

3. ADMIN
   E-Mail: admin@test.de
   Passwort: Test1234!
   Rolle: admin

*/


-- ============================================
-- OPTIONAL: Test-User löschen
-- ============================================
/*
-- Falls du die Test-User wieder löschen möchtest:

DELETE FROM auth.users WHERE email LIKE '%@test.de';
-- Profile werden automatisch durch CASCADE gelöscht

*/
