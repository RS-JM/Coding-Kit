# Test-User Setup für Supabase

## Problem
Direktes Einfügen in `auth.users` funktioniert nicht, weil Supabase Auth ein spezifisches Password-Hashing verwendet.

## ✅ Richtige Methode: Über Supabase Dashboard

### Schritt 1: User über Dashboard erstellen

1. Öffne dein Supabase Dashboard
2. Gehe zu **Authentication** → **Users**
3. Klicke auf **"Add user"** → **"Create new user"**
4. Erstelle folgende User:

#### Mitarbeiter
- **Email:** `mitarbeiter@test.de`
- **Password:** `Test1234!`
- ✅ **Auto Confirm User** aktivieren

#### Manager
- **Email:** `manager@test.de`
- **Password:** `Test1234!`
- ✅ **Auto Confirm User** aktivieren

#### Admin
- **Email:** `admin@test.de`
- **Password:** `Test1234!`
- ✅ **Auto Confirm User** aktivieren

### Schritt 2: Profile mit SQL erstellen

Nach dem Erstellen der Auth-User, führe dieses SQL aus:

```sql
-- Profile für Test-User erstellen/aktualisieren

-- Mitarbeiter
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

-- Manager
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

-- Admin
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
```

### Schritt 3: Verifizierung

```sql
-- Alle Test-User mit Profilen anzeigen
SELECT
  u.id,
  u.email,
  u.email_confirmed_at,
  p.vorname,
  p.nachname,
  p.job_titel,
  p.rolle,
  p.urlaubstage_gesamt
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE u.email LIKE '%@test.de'
ORDER BY p.rolle;
```

## 🔑 Login-Daten

Nach dem Setup kannst du dich einloggen mit:

| Rolle | E-Mail | Passwort | Name |
|-------|--------|----------|------|
| Mitarbeiter | mitarbeiter@test.de | Test1234! | Max Mustermann |
| Manager | manager@test.de | Test1234! | Anna Schmidt |
| Admin | admin@test.de | Test1234! | Thomas Weber |

## Alternative: Bestehende User aktualisieren

Falls du bereits User mit anderen E-Mails erstellt hast, kannst du deren Rolle einfach ändern:

```sql
-- Rolle eines bestehenden Users ändern
UPDATE public.profiles
SET
  rolle = 'manager',
  vorname = 'Anna',
  nachname = 'Schmidt',
  job_titel = 'Team Lead'
WHERE email = 'deine-echte-email@example.com';
```

## Cleanup

```sql
-- Test-User wieder löschen
DELETE FROM auth.users WHERE email LIKE '%@test.de';
-- Profile werden automatisch durch CASCADE gelöscht
```
