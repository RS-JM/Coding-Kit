# PROJ-9: Krankmeldung eintragen

## Status: 🔵 Planned

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
- [ ] Dialog oeffnet sich aus dem Kalender-Kontextmenue ("Krankmeldung eintragen")
- [ ] Startdatum wird vom angeklickten Kalendertag vorausgefuellt
- [ ] Option: Einzeltag oder Zeitraum (von-bis)
- [ ] Optionaler Kommentar
- [ ] "Speichern"-Button und "Abbrechen"-Button

### Validierung
- [ ] Krankmeldung kann nur fuer heute oder vergangene Tage eingetragen werden (nicht fuer die Zukunft)
- [ ] Enddatum muss >= Startdatum sein
- [ ] Maximal 3 Monate zurueck (konfigurierbar)

### Kalender-Integration
- [ ] Kranktage werden im Kalender rot markiert (PROJ-4)
- [ ] Tooltip bei Hover zeigt "Krankmeldung" + ggf. Kommentar

### Bearbeiten und Loeschen
- [ ] Bestehende Krankmeldung kann ueber den Kalender bearbeitet werden
- [ ] Krankmeldung kann geloescht werden (mit Bestaetigungsdialog)

### Feedback
- [ ] Toast nach Eintrag: "Krankmeldung gespeichert"
- [ ] Toast nach Loeschung: "Krankmeldung geloescht"
- [ ] Toast bei Fehler: "Fehler beim Speichern"

### Datenbank (Tabelle `sick_leaves`)
- [ ] Felder: id, user_id, start_datum, end_datum, kommentar, created_at, updated_at
- [ ] RLS: User kann eigene Krankmeldungen erstellen/lesen/bearbeiten/loeschen
- [ ] RLS: Manager kann Krankmeldungen seines Teams lesen
- [ ] RLS: Admin kann alle Krankmeldungen lesen

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
