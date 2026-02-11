# PROJ-8: Urlaubsgenehmigung (Manager)

## Status: 🔵 Planned

## Beschreibung
Manager-Ansicht zum Genehmigen oder Ablehnen von Urlaubsantraegen der Teammitglieder. Zeigt offene Antraege mit Details und ermoeglicht Genehmigung oder Ablehnung mit optionaler Begruendung.

## Abhaengigkeiten
- Benoetigt: PROJ-2 (Rollen- und Benutzerverwaltung) — fuer Manager-Rolle und Teamzuordnung
- Benoetigt: PROJ-7 (Urlaubsantrag stellen) — es muessen Antraege existieren

## User Stories

### US-1: Offene Antraege sehen
Als Manager moechte ich offene Urlaubsantraege meiner Teammitglieder sehen, um darueber zu entscheiden.

### US-2: Antrag genehmigen
Als Manager moechte ich einen Urlaubsantrag genehmigen koennen, damit der Mitarbeiter seinen Urlaub nehmen kann.

### US-3: Antrag ablehnen
Als Manager moechte ich einen Urlaubsantrag ablehnen koennen, mit einer Begruendung fuer den Mitarbeiter.

### US-4: Uebersicht aller Antraege
Als Manager moechte ich eine Uebersicht aller Antraege sehen (offen, genehmigt, abgelehnt), um den Ueberblick zu behalten.

## Acceptance Criteria

### Manager-Bereich
- [ ] Eigener Bereich/Tab im Dashboard (nur sichtbar fuer Manager und Admin)
- [ ] Liste aller offenen Urlaubsantraege
- [ ] Jeder Antrag zeigt: Mitarbeitername, Zeitraum, Anzahl Arbeitstage, Kommentar, Antragsdatum

### Genehmigung
- [ ] "Genehmigen"-Button pro Antrag
- [ ] Nach Genehmigung: Status wird auf `genehmigt` gesetzt
- [ ] Kalender des Mitarbeiters zeigt genehmigte Tage blau (PROJ-4)
- [ ] Urlaubsanzeige des Mitarbeiters wird aktualisiert (PROJ-6)

### Ablehnung
- [ ] "Ablehnen"-Button pro Antrag
- [ ] Dialog fuer Ablehnungsgrund (Pflichtfeld)
- [ ] Nach Ablehnung: Status wird auf `abgelehnt` gesetzt
- [ ] Mitarbeiter sieht den Ablehnungsgrund

### Filter und Sortierung
- [ ] Filter nach Status: Alle / Offen / Genehmigt / Abgelehnt
- [ ] Sortierung nach Antragsdatum (neueste zuerst)
- [ ] Badge mit Anzahl offener Antraege

### Sicherheit
- [ ] Nur User mit Rolle `manager` oder `admin` haben Zugriff
- [ ] RLS-Policies stellen sicher, dass Manager nur Antraege sehen koennen
- [ ] Admin sieht alle Antraege

## Edge Cases

- **EC-1: Manager beantragt selbst Urlaub** — Wird von einem anderen Manager oder Admin genehmigt
- **EC-2: Nachtraegliche Stornierung** — Was passiert wenn ein bereits genehmigter Urlaub storniert werden muss? → Manager kann genehmigten Urlaub zuruecksetzen auf `beantragt` oder direkt loeschen
- **EC-3: Gleichzeitige Bearbeitung** — Was passiert wenn zwei Manager denselben Antrag gleichzeitig bearbeiten? → Optimistic Locking oder "bereits bearbeitet"-Meldung
- **EC-4: Keine offenen Antraege** — Empty State: "Keine offenen Urlaubsantraege"

## Technische Hinweise
- shadcn/ui Table fuer die Antragsliste
- shadcn/ui Badge fuer Status-Anzeige
- shadcn/ui Dialog fuer Ablehnungsgrund
- shadcn/ui Tabs fuer Filter
- shadcn/ui Button fuer Aktionen
- RLS-Policies muessen Manager-Rolle pruefen
