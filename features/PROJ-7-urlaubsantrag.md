# PROJ-7: Urlaubsantrag stellen (Mitarbeiter)

## Status: 🔵 Planned

## Beschreibung
Formular zum Beantragen von Urlaub ueber das Kalender-Kontextmenue. Mitarbeiter waehlt einen Zeitraum (von-bis), sieht die berechneten Arbeitstage und reicht den Antrag ein. Status-Tracking (beantragt/genehmigt/abgelehnt).

## Abhaengigkeiten
- Benoetigt: PROJ-1 (Benutzer-Authentifizierung) — fuer User-ID
- Benoetigt: PROJ-2 (Rollen- und Benutzerverwaltung) — fuer Urlaubskontingent
- Benoetigt: PROJ-4 (Interaktiver Kalender) — fuer Kontextmenue-Integration
- Benoetigt: PROJ-6 (Urlaubsanzeige) — aktualisiert die Urlaubsanzeige nach Antrag

## User Stories

### US-1: Urlaub beantragen
Als Mitarbeiter moechte ich Urlaub beantragen, um freie Tage zu planen.

### US-2: Zeitraum waehlen
Als Mitarbeiter moechte ich einen Zeitraum (von-bis) waehlen koennen, um mehrtaegigen Urlaub zu beantragen.

### US-3: Status einsehen
Als Mitarbeiter moechte ich den Status meiner Antraege sehen (beantragt, genehmigt, abgelehnt).

### US-4: Antrag stornieren
Als Mitarbeiter moechte ich einen Antrag stornieren koennen, solange er noch nicht genehmigt ist.

## Acceptance Criteria

### Antrags-Dialog
- [ ] Dialog oeffnet sich aus dem Kalender-Kontextmenue ("Urlaub beantragen")
- [ ] Startdatum wird vom angeklickten Kalendertag vorausgefuellt
- [ ] Enddatum kann gewaehlt werden (muss >= Startdatum sein)
- [ ] Berechnung der Arbeitstage im Zeitraum (Wochenenden werden ausgeschlossen)
- [ ] Anzeige: "X Arbeitstage Urlaub"
- [ ] Pruefung: Genug Resturlaub vorhanden? Wenn nein → Warnung
- [ ] Optionaler Kommentar zum Antrag
- [ ] "Beantragen"-Button und "Abbrechen"-Button

### Status-Tracking
- [ ] Status-Werte: `beantragt`, `genehmigt`, `abgelehnt`
- [ ] Neuer Antrag hat immer Status `beantragt`
- [ ] Im Kalender werden beantragte Tage gelb markiert (PROJ-4)
- [ ] Im Kalender werden genehmigte Tage blau markiert (PROJ-4)

### Stornierung
- [ ] Mitarbeiter kann einen Antrag mit Status `beantragt` stornieren
- [ ] Bestaetigungsdialog vor der Stornierung
- [ ] Nach Stornierung wird der Antrag geloescht
- [ ] Urlaubsanzeige (PROJ-6) aktualisiert sich

### Feedback
- [ ] Toast nach Antrag: "Urlaubsantrag eingereicht"
- [ ] Toast nach Stornierung: "Antrag storniert"
- [ ] Toast bei Fehler: "Fehler beim Beantragen"

### Datenbank (Tabelle `vacation_requests`)
- [ ] Felder: id, user_id, start_datum, end_datum, arbeitstage, kommentar, status, bearbeitet_von, bearbeitet_am, created_at
- [ ] RLS: User kann eigene Antraege erstellen/lesen/stornieren
- [ ] RLS: Manager kann Antraege seines Teams lesen und bearbeiten
- [ ] RLS: Admin kann alle Antraege lesen und bearbeiten

## Edge Cases

- **EC-1: Ueberlappende Antraege** — Was passiert bei ueberlappenden Urlaubsantraegen? → Fehlermeldung "Fuer diesen Zeitraum existiert bereits ein Antrag"
- **EC-2: Jahreswechsel** — Urlaub ueber den Jahreswechsel → Tage werden dem jeweiligen Jahr zugeordnet
- **EC-3: Rueckwirkend** — Kann Urlaub rueckwirkend beantragt werden? → Ja, mit Hinweis "Rueckwirkender Antrag"
- **EC-4: Feiertage** — Was passiert wenn im Zeitraum ein Feiertag liegt? → Feiertag wird nicht als Urlaubstag gezaehlt (spaetere Erweiterung)
- **EC-5: Kein Resturlaub** — Antrag trotzdem moeglich, aber mit deutlicher Warnung

## Technische Hinweise
- shadcn/ui Dialog, Button, Input, Label
- shadcn/ui Popover + Calendar fuer Datumsauswahl
- Sonner/Toast fuer Feedback
- Zod fuer Validierung
- Arbeitstage-Berechnung: Wochenenden ausschliessen
