# PROJ-1: Benutzer-Authentifizierung

## Status: 🔵 Planned

## Beschreibung
Login-Screen mit E-Mail und Passwort, Logout-Funktion und Passwort-Reset via E-Mail. Nutzt Supabase Auth als Backend. Dieses Feature ist die Grundlage fuer alle weiteren Features.

## Abhaengigkeiten
- Keine (Fundament-Feature)

## User Stories

### US-1: Login
Als Mitarbeiter moechte ich mich mit E-Mail und Passwort einloggen, um auf das System zuzugreifen.

### US-2: Logout
Als eingeloggter Mitarbeiter moechte ich mich abmelden koennen, um meine Session sicher zu beenden.

### US-3: Passwort zuruecksetzen
Als Mitarbeiter moechte ich mein Passwort zuruecksetzen koennen, falls ich es vergessen habe.

### US-4: Session-Persistence
Als eingeloggter Mitarbeiter moechte ich nach einem Browser-Reload eingeloggt bleiben, um nicht staendig neu einloggen zu muessen.

### US-5: Route Protection
Als System moechte ich nicht-eingeloggte User automatisch zum Login weiterleiten, um unbefugten Zugriff zu verhindern.

## Acceptance Criteria

### Login
- [ ] Login-Seite wird unter `/login` angezeigt
- [ ] Login-Formular hat E-Mail-Feld und Passwort-Feld
- [ ] Validierung: E-Mail muss gueltiges Format haben
- [ ] Validierung: Passwort muss mindestens 8 Zeichen lang sein
- [ ] Bei falschen Zugangsdaten wird eine Fehlermeldung angezeigt ("E-Mail oder Passwort falsch")
- [ ] Bei erfolgreichem Login wird der User zum Dashboard (`/`) weitergeleitet
- [ ] Login-Button zeigt Loading-State waehrend der Anfrage

### Account-Sperre (5 Fehlversuche)
- [ ] Fehlgeschlagene Login-Versuche werden in der Datenbank gezaehlt (failed_login_attempts)
- [ ] Nach 5 Fehlversuchen wird das Konto gesperrt (is_locked = true)
- [ ] Gesperrter User sieht Meldung: "Ihr Konto wurde gesperrt. Bitte wenden Sie sich an den Administrator."
- [ ] Gesperrter User kann sich nicht einloggen, auch nicht mit korrektem Passwort
- [ ] Erfolgreicher Login setzt den Fehlversuch-Zaehler auf 0 zurueck
- [ ] Nur ein Admin kann ein gesperrtes Konto entsperren (PROJ-10)

### Logout
- [ ] Logout-Button ist sichtbar (wird spaeter im Dashboard platziert, PROJ-3)
- [ ] Nach Logout wird die Session beendet
- [ ] Nach Logout wird der User zum Login-Screen weitergeleitet

### Passwort-Reset
- [ ] "Passwort vergessen?"-Link ist auf der Login-Seite sichtbar
- [ ] Klick oeffnet ein Formular/Dialog fuer die E-Mail-Eingabe
- [ ] Nach Eingabe wird eine Reset-E-Mail ueber Supabase Auth gesendet
- [ ] Erfolgsmeldung: "Falls ein Konto mit dieser E-Mail existiert, wurde eine E-Mail gesendet"
- [ ] Reset-Link in der E-Mail fuehrt zu einer Passwort-Aendern-Seite
- [ ] Neues Passwort muss mindestens 8 Zeichen lang sein
- [ ] Nach erfolgreichem Reset wird der User zum Login weitergeleitet

### Session & Route Protection
- [ ] Session bleibt nach Browser-Reload erhalten (Supabase Session Persistence)
- [ ] Nicht-eingeloggte User werden automatisch von geschuetzten Seiten zu `/login` weitergeleitet
- [ ] Bereits eingeloggte User werden von `/login` automatisch zum Dashboard weitergeleitet

## Edge Cases

- **EC-1: Account-Sperre** — Nach 5 fehlgeschlagenen Login-Versuchen wird das Konto gesperrt. Nur ein Admin kann es entsperren (PROJ-10). Meldung: "Ihr Konto wurde gesperrt. Bitte wenden Sie sich an den Administrator."
- **EC-2: Netzwerkfehler** — Was passiert bei Netzwerkfehler waehrend des Logins? → Fehlermeldung "Verbindungsfehler. Bitte versuche es erneut."
- **EC-3: Reset-E-Mail kommt nicht an** — User soll die E-Mail erneut anfordern koennen
- **EC-4: Abgelaufene Session** — User wird automatisch zum Login weitergeleitet
- **EC-5: Gleichzeitiges Login in mehreren Tabs** — Beide Sessions sollen funktionieren (kein Conflict)
- **EC-6: Ungueltige Reset-Links** — Abgelaufene oder bereits verwendete Reset-Links zeigen eine Fehlermeldung

## Technische Hinweise
- Supabase Auth fuer Authentication (E-Mail + Passwort)
- `window.location.href` fuer Hard Redirect nach Login (nicht `router.push`)
- Session-Validierung vor Redirect (`data.session` pruefen)
- Loading-State immer zuruecksetzen (auch bei Fehlern)
- Zod fuer Client-Side Validation

---

## Tech-Design (Solution Architect)

### Component-Struktur

```
App
├── /login (oeffentliche Seite)
│   ├── Login-Formular
│   │   ├── E-Mail-Feld
│   │   ├── Passwort-Feld
│   │   ├── Login-Button (mit Loading-State)
│   │   ├── Fehlermeldung ("E-Mail oder Passwort falsch" / "Konto gesperrt")
│   │   └── Fehlversuch-Zaehler (intern, nicht sichtbar fuer User)
│   └── "Passwort vergessen?"-Link
│       └── Passwort-Reset-Formular (E-Mail-Eingabe + Erfolgsmeldung)
│
├── /reset-password (oeffentliche Seite, via E-Mail-Link erreichbar)
│   └── Neues-Passwort-Formular
│       ├── Neues-Passwort-Feld
│       ├── Passwort-Bestaetigung-Feld
│       └── Speichern-Button
│
├── / (geschuetzte Seite — Dashboard)
│   └── [wird in PROJ-3 gebaut]
│
└── Auth-Schutz (unsichtbar)
    ├── Session pruefen bei jedem Seitenaufruf
    ├── Gesperrter Account → Login verweigert + Meldung
    ├── Nicht eingeloggt → Weiterleitung zu /login
    └── Eingeloggt auf /login → Weiterleitung zu /
```

### Daten-Model

```
Supabase Auth (automatisch):
- User-ID (UUID)
- E-Mail-Adresse
- Verschluesseltes Passwort
- Session-Token
- Erstellungszeitpunkt

Profil-Tabelle (profiles) — PROJ-1 benoetigt bereits:
- user_id (Referenz zu Supabase Auth)
- failed_login_attempts (Zahl, Standard: 0)
- is_locked (Ja/Nein, Standard: Nein)
- locked_at (Zeitpunkt der Sperrung)

Logik:
- Fehlgeschlagener Login → failed_login_attempts + 1
- Bei 5 Fehlversuchen → is_locked = true, locked_at = jetzt
- Erfolgreicher Login → failed_login_attempts zurueck auf 0
- Admin entsperrt → is_locked = false, failed_login_attempts = 0
```

### Tech-Entscheidungen

```
Warum Supabase Auth statt eigener Login-Logik?
→ Sicher (bcrypt, JWT-Tokens), E-Mail-Versand eingebaut
→ Kein eigener Server fuer Auth noetig

Warum eigenes Account-Locking statt Supabase Rate Limiting?
→ Supabase Rate Limiting ist IP-basiert und temporaer
→ Wir brauchen account-basiertes Locking mit Admin-Freischaltung
→ Gibt dem Admin volle Kontrolle ueber gesperrte Konten

Warum Fehlversuche in der profiles-Tabelle?
→ Zentral gespeichert, Admin kann den Zaehler zuruecksetzen
→ Ueberlebt Browser-Wechsel (nicht nur Cookie/Session-basiert)

Warum Zod fuer Formular-Validierung?
→ Bereits im Projekt installiert, typsicher, integriert mit react-hook-form

Warum react-hook-form fuer Formulare?
→ Bereits im Projekt installiert, performant (kein Re-Render bei jeder Eingabe)

Warum window.location.href statt router.push nach Login?
→ Erzwingt einen vollen Page-Reload, dadurch wird die Session sauber initialisiert

Warum Middleware fuer Route Protection?
→ Next.js Middleware faengt Requests VOR dem Rendern ab — schneller als Client-Side Check
→ Schuetzt alle Routen zentral an einer Stelle
```

### Dependencies

```
Bereits installiert (keine neuen Packages noetig):
- @supabase/supabase-js (Supabase Client + Auth)
- zod (Formular-Validierung)
- react-hook-form + @hookform/resolvers (Formular-Handling)
- sonner (Toast-Benachrichtigungen)

Neues Package:
- @supabase/ssr (Server-Side Auth fuer Next.js App Router — Session-Handling in Middleware + Server Components)
```

### Seitenstruktur

```
src/
├── app/
│   ├── login/
│   │   └── page.tsx          ← Login-Seite (oeffentlich)
│   ├── reset-password/
│   │   └── page.tsx          ← Neues-Passwort-Seite (oeffentlich)
│   ├── auth/
│   │   └── callback/
│   │       └── route.ts      ← Supabase Auth Callback (fuer E-Mail-Links)
│   ├── layout.tsx            ← Root Layout (Session-Provider)
│   └── page.tsx              ← Dashboard (geschuetzt)
├── lib/
│   └── supabase.ts           ← Supabase Client (existiert bereits, wird erweitert)
└── middleware.ts              ← Route Protection (Redirect-Logik)
```
