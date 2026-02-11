# PROJ-2: Rollen- und Benutzerverwaltung (Datenmodell)

## Status: 🔵 Planned

## Beschreibung
Datenbank-Setup fuer Benutzerprofile mit Rollen (Mitarbeiter, Manager, Admin), Job-Titel und Urlaubskontingent. Kein eigenes UI — liefert die Datengrundlage fuer alle rollenbezogenen Features.

## Abhaengigkeiten
- Benoetigt: PROJ-1 (Benutzer-Authentifizierung) — fuer eingeloggte User-ID via Supabase Auth

## User Stories

### US-1: Benutzerprofile
Als System moechte ich fuer jeden registrierten Benutzer ein Profil mit Name, Job-Titel, Rolle und Urlaubskontingent speichern, um personalisierte Daten anzeigen zu koennen.

### US-2: Rollenzuweisung
Als Admin moechte ich, dass jedem Benutzer eine Rolle zugewiesen ist (Mitarbeiter, Manager, Admin), um Berechtigungen zu steuern.

### US-3: Urlaubskontingent
Als System moechte ich fuer jeden Benutzer ein Urlaubskontingent speichern, um Urlaubsantraege dagegen pruefen zu koennen.

### US-4: Automatische Profilerstellung
Als System moechte ich bei jeder neuen Registrierung automatisch ein Profil anlegen, damit keine manuellen Schritte noetig sind.

## Acceptance Criteria

### Datenbank-Tabelle `profiles`
- [ ] Tabelle `profiles` existiert in Supabase mit folgenden Feldern:
  - `id` (UUID, Primary Key, referenziert `auth.users.id`)
  - `vorname` (Text, NOT NULL)
  - `nachname` (Text, NOT NULL)
  - `job_titel` (Text, optional)
  - `rolle` (Text, CHECK: 'mitarbeiter' | 'manager' | 'admin', Default: 'mitarbeiter')
  - `urlaubstage_gesamt` (Integer, Default: 30)
  - `ist_aktiv` (Boolean, Default: true)
  - `created_at` (Timestamp)
  - `updated_at` (Timestamp)

### Row Level Security (RLS)
- [ ] RLS ist fuer die Tabelle `profiles` aktiviert
- [ ] Policy: Jeder eingeloggte User kann sein eigenes Profil lesen
- [ ] Policy: Manager koennen Profile ihrer Teammitglieder lesen
- [ ] Policy: Admins koennen alle Profile lesen und bearbeiten
- [ ] Policy: Nur Admins koennen Rollen aendern
- [ ] Policy: Nur Admins koennen Urlaubskontingent aendern

### Auto-Profil bei Registrierung
- [ ] Supabase Database Trigger erstellt automatisch ein Profil bei neuer Registrierung
- [ ] Standard-Rolle: `mitarbeiter`
- [ ] Standard-Urlaubstage: 30

### API-Endpunkte
- [ ] GET `/api/profile` — Eigenes Profil abrufen
- [ ] GET `/api/profiles` — Alle Profile abrufen (nur Manager/Admin)
- [ ] PATCH `/api/profile/[id]` — Profil bearbeiten (Rolle/Urlaubstage nur Admin)

## Edge Cases

- **EC-1: Trigger-Fehler** — Was passiert wenn der Profil-Trigger bei Registrierung fehlschlaegt? → Fehler loggen, User kann sich trotzdem einloggen, Profil wird beim ersten Dashboard-Besuch nacherstellt
- **EC-2: User ohne Rolle** — Was passiert wenn ein User keine Rolle hat? → Default `mitarbeiter` verwenden
- **EC-3: Teilzeit-Urlaubstage** — Wie werden Urlaubstage fuer Teilzeit/Praktikanten gesetzt? → Admin setzt individuell ueber Admin-Panel (PROJ-10)
- **EC-4: Letzter Admin** — Was passiert wenn der letzte Admin seine Rolle aendert? → Wird in PROJ-10 (Admin-Panel) abgesichert

## Technische Hinweise
- Drei Rollen: `mitarbeiter`, `manager`, `admin`
- Standard-Urlaubstage: 30 (Vollzeit Deutschland)
- Supabase Database Trigger fuer Auto-Profil
- RLS Policies muessen fuer jede CRUD-Operation definiert werden

---

## Tech-Design (Solution Architect)

### Component-Struktur

```
PROJ-2 hat kein eigenes UI — es liefert die Datengrundlage.
Andere Features nutzen diese Daten:

PROJ-3 (Dashboard) → zeigt Name, Job-Titel, Rolle
PROJ-6 (Urlaubsanzeige) → liest urlaubstage_gesamt
PROJ-10 (Admin-Panel) → bearbeitet Profile, entsperrt Konten

Unsichtbare Komponenten:
├── Supabase Database Trigger
│   └── Erstellt automatisch ein Profil bei neuer Registrierung
├── Row Level Security Policies
│   └── Steuern, wer welche Daten lesen/bearbeiten darf
└── API-Endpunkte
    ├── Eigenes Profil abrufen
    ├── Alle Profile abrufen (nur Manager/Admin)
    └── Profil bearbeiten (Rolle/Urlaubstage nur Admin)
```

### Daten-Model (Zusammenspiel PROJ-1 + PROJ-2)

```
Die profiles-Tabelle vereint PROJ-1 (Account-Sperre) und PROJ-2 (Benutzerdaten):

Jedes Profil hat:
- Eindeutige ID (gleich wie Supabase Auth User-ID)
- Vorname
- Nachname
- Job-Titel (optional)
- Rolle (mitarbeiter / manager / admin) — Standard: mitarbeiter
- Urlaubstage gesamt — Standard: 30
- Ist aktiv (ja/nein) — Standard: ja
- Fehlgeschlagene Login-Versuche — Standard: 0 (aus PROJ-1)
- Ist gesperrt (ja/nein) — Standard: nein (aus PROJ-1)
- Gesperrt seit (Zeitpunkt, optional) (aus PROJ-1)
- Erstellt am
- Aktualisiert am

Gespeichert in: Supabase PostgreSQL (Tabelle "profiles")
Verknuepft mit: Supabase Auth Users (gleiche ID)
```

### Berechtigungen (Wer darf was?)

```
Mitarbeiter:
→ Kann eigenes Profil lesen (Name, Rolle, Urlaubstage)
→ Kann NICHT andere Profile sehen

Manager:
→ Kann eigenes Profil lesen
→ Kann Profile aller Mitarbeiter lesen (fuer Team-Uebersicht)
→ Kann NICHT Rollen oder Urlaubstage aendern

Admin:
→ Kann alle Profile lesen und bearbeiten
→ Kann Rollen zuweisen (mitarbeiter ↔ manager ↔ admin)
→ Kann Urlaubskontingent individuell anpassen
→ Kann Konten sperren/entsperren (aus PROJ-1)
→ Kann Benutzer deaktivieren (ist_aktiv = nein)
```

### Auto-Profil bei Registrierung

```
Was passiert wenn ein neuer User sich registriert?

1. Supabase Auth erstellt den Account (E-Mail + Passwort)
2. Ein Datenbank-Trigger erkennt den neuen User automatisch
3. Trigger erstellt ein Profil mit:
   - Vorname/Nachname: leer (wird spaeter vom Admin gesetzt)
   - Rolle: mitarbeiter
   - Urlaubstage: 30
   - Ist aktiv: ja
   - Fehlversuche: 0, Nicht gesperrt

Falls der Trigger fehlschlaegt:
→ User kann sich trotzdem einloggen
→ Profil wird beim ersten Dashboard-Besuch nacherstellt
```

### Tech-Entscheidungen

```
Warum eine einzige profiles-Tabelle fuer PROJ-1 + PROJ-2?
→ Account-Sperre (PROJ-1) und Benutzerdaten (PROJ-2) gehoeren zum selben User
→ Vermeidet unnoetige Joins zwischen zwei Tabellen
→ Einfacher fuer RLS Policies

Warum Database Trigger statt API-Call fuer Auto-Profil?
→ Trigger laeuft direkt in der Datenbank — kann nicht vergessen werden
→ Kein zusaetzlicher API-Call nach Registrierung noetig

Warum Rollen als Text-Feld mit CHECK statt separate Tabelle?
→ Nur 3 feste Rollen — eine separate Tabelle waere Over-Engineering
→ Einfacher zu lesen und zu warten

Warum API-Endpunkte statt direkter Supabase-Calls vom Frontend?
→ Server-Side Validierung (z.B. "letzter Admin darf Rolle nicht aendern")
→ Komplexe Logik gehoert nicht ins Frontend
```

### Dependencies

```
Keine neuen Packages noetig — alles bereits vorhanden:
- @supabase/supabase-js (Datenbank-Zugriff)
- @supabase/ssr (Server-Side Supabase Client, aus PROJ-1)
- zod (Validierung der API-Endpunkte)
```

### Seitenstruktur (Erweiterung zu PROJ-1)

```
src/
├── app/
│   ├── api/
│   │   ├── profile/
│   │   │   └── route.ts          ← Eigenes Profil abrufen (GET)
│   │   └── profiles/
│   │       ├── route.ts          ← Alle Profile abrufen (GET, nur Manager/Admin)
│   │       └── [id]/
│   │           └── route.ts      ← Profil bearbeiten (PATCH, Rolle nur Admin)
│   ├── login/
│   │   └── page.tsx              ← (aus PROJ-1)
│   ├── reset-password/
│   │   └── page.tsx              ← (aus PROJ-1)
│   └── auth/
│       └── callback/
│           └── route.ts          ← (aus PROJ-1)
├── lib/
│   └── supabase.ts               ← Supabase Client (erweitert)
└── middleware.ts                  ← Route Protection (aus PROJ-1)

Supabase (nicht im Code, sondern in der Datenbank):
├── Tabelle: profiles              ← Wird via Supabase Dashboard oder Migration erstellt
├── Trigger: on_auth_user_created  ← Auto-Profil bei Registrierung
└── RLS Policies                   ← Berechtigungen pro Rolle
```
