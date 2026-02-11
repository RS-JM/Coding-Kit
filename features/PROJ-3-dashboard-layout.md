# PROJ-3: Dashboard-Layout und Benutzerinfo

## Status: 🟢 In Development

## Beschreibung
Haupt-Dashboard-Screen nach dem Login. Zeigt den eingeloggten Benutzer (Name, Job-Titel), einen Logout-Button und das Grundlayout mit Platzhaltern fuer Kalender und Widgets.

## Abhaengigkeiten
- Benoetigt: PROJ-1 (Benutzer-Authentifizierung) — fuer Login-Status und Route Protection
- Benoetigt: PROJ-2 (Rollen- und Benutzerverwaltung) — fuer Profildaten (Name, Job-Titel)

## User Stories

### US-1: Dashboard-Zugang
Als eingeloggter Mitarbeiter moechte ich nach dem Login ein Dashboard sehen, um einen Ueberblick ueber meine Daten zu haben.

### US-2: Benutzerinfo
Als eingeloggter Mitarbeiter moechte ich meinen Namen und Job-Titel auf dem Dashboard sehen, um zu wissen, dass ich korrekt eingeloggt bin.

### US-3: Logout
Als eingeloggter Mitarbeiter moechte ich mich ueber einen Logout-Button im Dashboard abmelden koennen.

### US-4: Layout-Struktur
Als Mitarbeiter moechte ich ein uebersichtliches Dashboard mit klarer Struktur, damit ich meine wichtigsten Informationen schnell finde.

## Acceptance Criteria

### Zugang und Schutz
- [ ] Dashboard ist unter `/` erreichbar (Hauptseite)
- [ ] Nur eingeloggte User koennen das Dashboard sehen
- [ ] Nicht-eingeloggte User werden zu `/login` weitergeleitet

### Benutzerinfo-Anzeige
- [ ] Vorname und Nachname werden im Header oder Sidebar angezeigt
- [ ] Job-Titel wird unter dem Namen angezeigt
- [ ] Avatar/Initialen-Badge mit den Initialen des Users
- [ ] Falls Profildaten noch laden: Skeleton-Loading-State

### Logout
- [ ] Logout-Button ist gut sichtbar platziert (Header oder Sidebar)
- [ ] Klick auf Logout beendet die Session und leitet zu `/login` weiter

### Layout
- [ ] Desktop-first Layout mit Header und Content-Bereich
- [ ] Header zeigt: Benutzerinfo (links/rechts) + Logout-Button
- [ ] Content-Bereich hat Platzhalter fuer:
  - Kalender (grosser Bereich, PROJ-4)
  - Urlaubsanzeige-Widget (kleinerer Bereich, PROJ-6)
- [ ] Layout nutzt shadcn/ui Komponenten (Card, Avatar, Badge, Button, Sidebar)
- [ ] Responsive: Auf kleineren Bildschirmen stapeln sich die Bereiche vertikal

### Fehlerbehandlung
- [ ] Loading-State waehrend Profildaten geladen werden (Skeleton)
- [ ] Error-State wenn Profildaten nicht geladen werden koennen
- [ ] Fallback wenn Job-Titel nicht gesetzt ist (z.B. "Mitarbeiter")

## Edge Cases

- **EC-1: Fehlende Profildaten** — Was passiert wenn das Profil nicht geladen werden kann? → Error-State mit "Profil konnte nicht geladen werden" + Retry-Button
- **EC-2: Kein Job-Titel** — Was passiert bei einem User ohne Job-Titel? → Fallback-Text "Mitarbeiter" anzeigen
- **EC-3: Kleiner Bildschirm** — Wie verhaelt sich das Layout auf Mobile? → Sidebar wird zu Hamburger-Menu, Widgets stapeln sich vertikal
- **EC-4: Langsame Verbindung** — Skeleton-Loading-State fuer alle dynamischen Inhalte

## Technische Hinweise
- shadcn/ui Komponenten: Card, Avatar, Badge, Button, Sidebar, Skeleton
- Profildaten ueber API abrufen (PROJ-2)
- Desktop-first, responsive breakpoints beachten
- Layout dient als Shell fuer alle weiteren Dashboard-Features

## Tech-Design (Solution Architect)

### Component-Struktur
```
Dashboard-Layout (/)
├── Header (oben, volle Breite)
│   ├── Logo/Titel "Zeiterfassung" (links)
│   └── Benutzer-Bereich (rechts)
│       ├── Avatar mit Initialen (z.B. "MK")
│       ├── Name + Job-Titel + Rollen-Badge
│       └── Logout-Button
│
└── Content-Bereich (darunter)
    ├── Begrüßung ("Guten Morgen, Max")
    ├── Kalender-Platzhalter (~2/3 Breite)
    │   └── Card mit Hinweis auf PROJ-4
    └── Sidebar-Widgets (~1/3 Breite)
        ├── Urlaubsanzeige-Platzhalter (PROJ-6)
        └── Schnell-Info (heutiges Datum)
```

### Daten-Model
Keine neuen Daten — nutzt bestehende `profiles`-Tabelle (Vorname, Nachname, Job-Titel, Rolle).

### Tech-Entscheidungen
- Server Component beibehalten (Profildaten serverseitig laden)
- Avatar mit Initialen statt Profilbild (kein Upload nötig)
- CSS Grid für 2-Spalten-Layout (responsive: stapelt sich auf Mobile)
- Tageszeit-Begrüßung ("Guten Morgen/Tag/Abend")

### Dependencies
Keine neuen Packages — alle shadcn/ui-Komponenten bereits installiert.
