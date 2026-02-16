# PROJ-5: Arbeitszeiterfassung

## Status: 🟢 In Development

## Beschreibung
Formular zum Erfassen der taeglichen Arbeitsstunden (Gesamtstunden pro Tag). Wird ueber das Kalender-Kontextmenue (PROJ-4) aufgerufen. Eintraege koennen erstellt, bearbeitet und geloescht werden.

## Abhaengigkeiten
- Benoetigt: PROJ-1 (Benutzer-Authentifizierung) — fuer User-ID
- Benoetigt: PROJ-2 (Rollen- und Benutzerverwaltung) — fuer RLS-Policies
- Benoetigt: PROJ-4 (Interaktiver Kalender) — fuer Kontextmenue-Integration und Kalender-Update

## User Stories

### US-1: Stunden erfassen
Als Mitarbeiter moechte ich meine Arbeitsstunden fuer einen Tag erfassen, um meine Arbeitszeit zu dokumentieren.

### US-2: Stunden bearbeiten
Als Mitarbeiter moechte ich bereits erfasste Stunden bearbeiten koennen, falls ich einen Fehler gemacht habe.

### US-3: Stunden loeschen
Als Mitarbeiter moechte ich erfasste Stunden loeschen koennen, falls ein Eintrag falsch war.

## Acceptance Criteria

### Erfassungs-Dialog
- [ ] Dialog/Modal oeffnet sich aus dem Kalender-Kontextmenue ("Arbeitszeit erfassen")
- [ ] Dialog zeigt das ausgewaehlte Datum an (nicht editierbar)
- [ ] Eingabefeld fuer Gesamtstunden (z.B. 8, 4.5, 7.5)
- [ ] Optionales Kommentarfeld (z.B. "Home Office", "Aussendienst")
- [ ] "Speichern"-Button und "Abbrechen"-Button
- [ ] Loading-State auf dem Speichern-Button waehrend der Anfrage

### Validierung
- [ ] Stunden muessen zwischen 0 und 24 liegen
- [ ] Maximal 1 Dezimalstelle erlaubt (z.B. 8.5 ja, 8.25 nein)
- [ ] Stunden-Feld ist Pflichtfeld
- [ ] Fehlermeldung bei ungueltiger Eingabe

### Bearbeiten
- [ ] Wenn fuer den Tag bereits ein Eintrag existiert, wird der Dialog im Bearbeitungsmodus geoeffnet
- [ ] Vorhandene Stunden und Kommentar werden vorausgefuellt
- [ ] Aenderungen koennen gespeichert werden

### Loeschen
- [ ] Im Bearbeitungsmodus gibt es einen "Loeschen"-Button
- [ ] Bestaetigungsdialog vor dem Loeschen ("Eintrag wirklich loeschen?")
- [ ] Nach dem Loeschen wird der Kalender aktualisiert (gruene Markierung verschwindet)

### Feedback und Kalender-Update
- [ ] Erfolgsmeldung (Toast) nach Speichern: "Arbeitszeit gespeichert"
- [ ] Erfolgsmeldung (Toast) nach Loeschen: "Eintrag geloescht"
- [ ] Fehlermeldung (Toast) bei Netzwerkfehler: "Fehler beim Speichern"
- [ ] Kalender aktualisiert sich nach dem Speichern (Tag wird gruen markiert)

### Datenbank (Tabelle `time_entries`)
- [ ] Felder: id, user_id, datum, stunden, kommentar, created_at, updated_at
- [ ] RLS: User kann nur eigene Eintraege erstellen/lesen/bearbeiten/loeschen
- [ ] RLS: Manager kann Eintraege seines Teams lesen
- [ ] Unique Constraint: Nur ein Eintrag pro User pro Tag

## Edge Cases

- **EC-1: Doppelter Eintrag** — Was passiert bei doppeltem Eintrag fuer denselben Tag? → Unique Constraint verhindert dies, Dialog oeffnet sich im Bearbeitungsmodus
- **EC-2: Netzwerkfehler** — Was passiert wenn Netzwerkfehler beim Speichern auftritt? → Fehlermeldung, Daten bleiben im Formular, User kann erneut versuchen
- **EC-3: Zukunft** — Darf ein Mitarbeiter Stunden fuer die Zukunft eintragen? → Nein, nur fuer heute und vergangene Tage
- **EC-4: Weit zurueckliegende Tage** — Koennen Stunden fuer weit zurueckliegende Tage eingetragen werden? → Ja, aber maximal 3 Monate zurueck (konfigurierbar)
- **EC-5: Wochenende** — Koennen Stunden am Wochenende eingetragen werden? → Ja, fuer Ueberstunden/Bereitschaft
- **EC-6: Konflikte** — Was passiert wenn fuer denselben Tag eine Krankmeldung existiert? → Warnung anzeigen, aber nicht blockieren

## Technische Hinweise
- shadcn/ui Dialog fuer das Modal
- shadcn/ui Input + Label fuer Formularfelder
- shadcn/ui AlertDialog fuer Loeschbestaetigung
- shadcn/ui Button fuer Aktionen
- Sonner/Toast fuer Feedback
- Zod fuer Input-Validierung
- Supabase Tabelle `time_entries` mit RLS

## Tech-Design (Solution Architect)

### Component-Struktur
```
Dashboard (page.tsx)
└── MonthCalendar (Client Component)
    ├── Kalender-Zellen zeigen grüne Markierung bei vorhandenen Einträgen
    │   ├── Wochenansicht: "8h Office" Badge in der Zelle
    │   └── Monatsansicht: grüner Punkt unter dem Datum
    ├── Klick auf Tag → WorkTimeDialog
    │   ├── Neuer Eintrag: leeres Formular (Stunden, Arbeitsort, Kommentar)
    │   └── Bestehender Eintrag: vorausgefüllt + Löschen-Button
    └── Drag-Selektion → SelectionBar → WorkTimeDialog (Mehrfach-Eintrag)
```

### Daten-Model
```
Tabelle: time_entries
- id (uuid, PK)
- user_id (uuid, FK → auth.users)
- datum (date, unique pro user)
- stunden (numeric 0–24, Schritte 0.5)
- arbeitsort (office | homeoffice | remote | kunde)
- kommentar (text, optional)
- created_at, updated_at (timestamptz)

RLS: User CRUD eigene Einträge, Manager/Admin lesen alle
```

### API-Endpunkte
```
GET    /api/time-entries?von=YYYY-MM-DD&bis=YYYY-MM-DD
POST   /api/time-entries
PATCH  /api/time-entries/[id]
DELETE /api/time-entries/[id]
```

### Tech-Entscheidungen
- Supabase-Tabelle mit RLS (wie profiles-Pattern)
- API Routes mit Zod-Validierung (wie /api/profiles Pattern)
- WorkTimeDialog erweitert: Bearbeitungsmodus + AlertDialog für Löschen
- Kalender lädt Einträge per useEffect beim Monat-/Wochenwechsel
- fetchEntries wird als onSave-Callback an WorkTimeDialog übergeben

### Dependencies
Keine neuen Packages
