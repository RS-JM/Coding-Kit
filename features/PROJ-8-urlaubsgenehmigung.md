# PROJ-8: Urlaubsgenehmigung (Manager)

## Status: ✅ Implemented

**Implementiert am:** 2026-02-15
**Änderungen:**
- Migration `007-vacation-rejection-reason.sql` hinzugefügt (Feld für Ablehnungsgrund)
- API-Endpunkt `/api/vacation-requests/[id]/approve` für Genehmigung/Ablehnung
- Manager-Seite `/manager/urlaub` mit Tabelle und Filterung
- Komponente `VacationRequestsTable` mit Approve/Reject-Funktionalität
- Navigation zur Manager-Seite im Sidebar (nur für Manager/Admin sichtbar)

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
- [x] Eigener Bereich/Tab im Dashboard (nur sichtbar fuer Manager und Admin)
- [x] Liste aller offenen Urlaubsantraege
- [x] Jeder Antrag zeigt: Mitarbeitername, Zeitraum, Anzahl Arbeitstage, Kommentar, Antragsdatum

### Genehmigung
- [x] "Genehmigen"-Button pro Antrag
- [x] Nach Genehmigung: Status wird auf `genehmigt` gesetzt
- [x] Kalender des Mitarbeiters zeigt genehmigte Tage blau (PROJ-4)
- [x] Urlaubsanzeige des Mitarbeiters wird aktualisiert (PROJ-6)

### Ablehnung
- [x] "Ablehnen"-Button pro Antrag
- [x] Dialog fuer Ablehnungsgrund (Pflichtfeld)
- [x] Nach Ablehnung: Status wird auf `abgelehnt` gesetzt
- [x] Mitarbeiter sieht den Ablehnungsgrund

### Filter und Sortierung
- [x] Filter nach Status: Alle / Offen / Genehmigt / Abgelehnt
- [x] Sortierung nach Antragsdatum (neueste zuerst)
- [x] Badge mit Anzahl offener Antraege

### Sicherheit
- [x] Nur User mit Rolle `manager` oder `admin` haben Zugriff
- [x] RLS-Policies stellen sicher, dass Manager nur Antraege sehen koennen
- [x] Admin sieht alle Antraege

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

## Testing

### Voraussetzungen
1. Migration `007-vacation-rejection-reason.sql` in Supabase ausfuehren
2. Mindestens 2 Benutzer: 1x Manager/Admin, 1x Mitarbeiter
3. Mitarbeiter hat Urlaubsantrag gestellt (Status: `beantragt`)

### Test-Szenarien

#### TS-1: Manager-Zugriff
- Als Manager einloggen
- Im Sidebar sollte "Urlaubsanträge" sichtbar sein
- Auf "Urlaubsanträge" klicken → Manager-Seite öffnet sich
- **Erwartung:** Seite zeigt alle Urlaubsanträge mit Stats (Offen/Genehmigt/Abgelehnt)

#### TS-2: Urlaubsantrag genehmigen
- Auf Manager-Seite einen offenen Antrag suchen
- "Genehmigen"-Button klicken
- **Erwartung:** Toast-Nachricht "Urlaubsantrag genehmigt", Status wechselt auf "Genehmigt" (grün)
- Kalender des Mitarbeiters prüfen → Tage sollten blau markiert sein
- Urlaubswidget des Mitarbeiters prüfen → "Genommen" sollte aktualisiert sein

#### TS-3: Urlaubsantrag ablehnen
- Auf Manager-Seite einen offenen Antrag suchen
- "Ablehnen"-Button klicken → Dialog öffnet sich
- Ablehnungsgrund eingeben (z.B. "Zu viele Kollegen im Urlaub")
- "Ablehnen" klicken
- **Erwartung:** Toast-Nachricht "Urlaubsantrag abgelehnt", Status wechselt auf "Abgelehnt" (rot)
- In der Tabelle sollte der Ablehnungsgrund in der Kommentar-Spalte angezeigt werden

#### TS-4: Filter testen
- Tabs "Alle", "Offen", "Genehmigt", "Abgelehnt" durchklicken
- **Erwartung:** Tabelle zeigt nur Anträge mit dem entsprechenden Status

#### TS-5: Mitarbeiter-Zugriff testen
- Als Mitarbeiter einloggen
- Im Sidebar sollte "Urlaubsanträge" NICHT sichtbar sein
- Direkt zu `/manager/urlaub` navigieren
- **Erwartung:** Redirect zu `/` (Dashboard)
