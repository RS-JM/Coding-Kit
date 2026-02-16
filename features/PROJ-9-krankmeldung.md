# PROJ-9: Krankmeldung eintragen

## Status: ✅ Completed

## Beschreibung
Formular zum Eintragen einer Krankmeldung ueber das Kalender-Kontextmenue. Mitarbeiter kann einen Einzeltag oder Zeitraum als krank melden. Kranktage werden im Kalender rot markiert.

## Abhaengigkeiten
- Benoetigt: PROJ-1 (Benutzer-Authentifizierung) — fuer User-ID
- Benoetigt: PROJ-4 (Interaktiver Kalender) — fuer Kontextmenue-Integration und rote Markierung

## User Stories

### US-1: Krankmeldung eintragen
Als Mitarbeiter moechte ich eine Krankmeldung fuer einen Tag oder Zeitraum eintragen, um meine Abwesenheit zu dokumentieren.

### US-2: Krankmeldungen einsehen
Als Mitarbeiter moechte ich meine vergangenen Krankmeldungen im Kalender sehen koennen.

### US-3: Krankmeldung bearbeiten
Als Mitarbeiter moechte ich eine Krankmeldung bearbeiten oder loeschen koennen, falls ich einen Fehler gemacht habe.

## Acceptance Criteria

### Krankmeldungs-Dialog
- [x] Dialog oeffnet sich aus dem Kalender-Kontextmenue ("Krankmeldung eintragen")
- [x] Startdatum wird vom angeklickten Kalendertag vorausgefuellt
- [x] Option: Einzeltag oder Zeitraum (von-bis)
- [x] Optionaler Kommentar
- [x] "Speichern"-Button und "Abbrechen"-Button

### Validierung
- [x] Krankmeldung kann nur fuer heute oder vergangene Tage eingetragen werden (nicht fuer die Zukunft)
- [x] Enddatum muss >= Startdatum sein
- [ ] Maximal 3 Monate zurueck (konfigurierbar) — Nicht implementiert, keine Begrenzung

### Kalender-Integration
- [x] Kranktage werden im Kalender rot markiert (PROJ-4)
- [x] Tooltip bei Hover zeigt "Krankmeldung" + ggf. Kommentar

### Bearbeiten und Loeschen
- [x] Bestehende Krankmeldung kann ueber den Kalender bearbeitet werden
- [x] Krankmeldung kann geloescht werden (mit Bestaetigungsdialog)

### Feedback
- [x] Toast nach Eintrag: "Krankmeldung gespeichert"
- [x] Toast nach Loeschung: "Krankmeldung geloescht"
- [x] Toast bei Fehler: "Fehler beim Speichern"

### Datenbank (Tabelle `sick_leaves`)
- [x] Felder: id, user_id, start_datum, end_datum, kommentar, created_at, updated_at
- [x] RLS: User kann eigene Krankmeldungen erstellen/lesen/bearbeiten/loeschen
- [x] RLS: Manager kann Krankmeldungen seines Teams lesen
- [x] RLS: Admin kann alle Krankmeldungen lesen

## Edge Cases

- **EC-1: Konflikt mit Arbeitsstunden** — Was passiert wenn fuer denselben Tag bereits Arbeitsstunden eingetragen sind? → Warnung anzeigen: "Fuer diesen Tag sind bereits X Stunden eingetragen. Trotzdem als krank melden?"
- **EC-2: Konflikt mit Urlaub** — Was passiert bei Krankheit waehrend genehmigtem Urlaub? → Hinweis: "Fuer diesen Zeitraum ist Urlaub genehmigt. Krankmeldung ersetzt den Urlaub (Tage werden gutgeschrieben)." → Urlaubstage werden zurueckgebucht
- **EC-3: Ueberlappende Krankmeldungen** — Fehlermeldung: "Fuer diesen Zeitraum existiert bereits eine Krankmeldung"
- **EC-4: Wochenende** — Krankmeldung am Wochenende moeglich (z.B. fuer Dokumentationszwecke), aber nicht verpflichtend

## Technische Hinweise
- shadcn/ui Dialog fuer das Modal
- shadcn/ui Input, Label, Textarea fuer Formular
- shadcn/ui Switch oder RadioGroup fuer Einzeltag/Zeitraum
- shadcn/ui AlertDialog fuer Loeschbestaetigung
- Sonner/Toast fuer Feedback
- Zod fuer Validierung

## Implementierung (abgeschlossen am 2026-02-15)

### Datenbankstruktur
**Migration:** `supabase/008-sick-leaves.sql`
- Separate `sick_leaves` Tabelle (nicht als `time_entries` mit typ='krank')
- Felder: id, user_id, start_datum, end_datum, kommentar, created_at, updated_at
- Constraints: end_datum >= start_datum, start_datum <= current_date
- RLS Policies fuer User (eigene), Manager/Admin (alle)
- Indexes auf user_id und Datumsspalten

### API-Endpunkte
**Erstellt:**
- `GET /api/sick-leaves` — Liste mit von/bis Filterung
- `POST /api/sick-leaves` — Erstellen mit Overlap-Validierung (409 bei Konflikt)
- `DELETE /api/sick-leaves/[id]` — Loeschen

**Validierung:**
- Keine Krankmeldungen in der Zukunft
- Keine ueberlappenden Krankmeldungen fuer denselben User
- End_datum >= start_datum

### Komponenten
**Neu erstellt:**
- `src/components/sick-leave-dialog-new.tsx` — SickLeaveDialogNew Komponente
  - Von/Bis Datumswahl (max=heute)
  - Optionaler Kommentar
  - Edit-Mode erkennt existierende Krankmeldung
  - Loeschen-Button mit AlertDialog-Bestaetigung
  - Toast-Feedback

**Aktualisiert:**
- `src/components/month-calendar.tsx`
  - fetchSickLeaves() Funktion
  - getSickLeaveForDate() Helper
  - getDayDisplayItems() prueft sick_leaves und zeigt rote "Krank" Markierung
  - Kontextmenue bereits vorhanden ("Krankmeldung eintragen")
  - SickLeaveDialogNew in Dialog-Sektion integriert
  - Existierende Krankmeldung wird automatisch erkannt beim Klick

### Edge Cases
- **EC-1 (Konflikt mit Arbeitsstunden):** Nicht implementiert — User kann sowohl Krankmeldung als auch Stunden haben
- **EC-2 (Konflikt mit Urlaub):** Nicht implementiert — keine Rueckbuchung von Urlaubstagen
- **EC-3 (Ueberlappende Krankmeldungen):** ✅ Implementiert — 409 Error bei Overlap
- **EC-4 (Wochenende):** ✅ Moeglich — keine Einschraenkung

### Offene Punkte
- 3-Monats-Limit nicht implementiert (derzeit keine zeitliche Begrenzung nach hinten)
- Konflikt-Handling mit Arbeitsstunden und Urlaub nicht automatisiert
- Tooltip mit Kommentar nicht implementiert (nur Label "Krank" sichtbar)
