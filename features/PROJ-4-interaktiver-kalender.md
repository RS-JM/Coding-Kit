# PROJ-4: Interaktiver Kalender

## Status: 🔵 Planned

## Beschreibung
Monatskalender-Ansicht im Dashboard mit Navigation zwischen Monaten und Rechtsklick-Kontextmenue auf einzelnen Tagen. Zeigt vorhandene Eintraege (Arbeitsstunden, Urlaub, Krankheit) farblich markiert an.

## Abhaengigkeiten
- Benoetigt: PROJ-3 (Dashboard-Layout) — Kalender wird im Dashboard-Content-Bereich eingebettet

## User Stories

### US-1: Monatskalender
Als Mitarbeiter moechte ich einen Monatskalender sehen, um meine Arbeits- und Abwesenheitstage im Ueberblick zu haben.

### US-2: Navigation
Als Mitarbeiter moechte ich zwischen Monaten navigieren koennen, um vergangene und zukuenftige Eintraege zu sehen.

### US-3: Kontextmenue
Als Mitarbeiter moechte ich per Rechtsklick auf einen Tag ein Kontextmenue oeffnen, um Aktionen auszufuehren (Stunden eintragen, Krankmeldung, Urlaub beantragen).

### US-4: Farbliche Markierungen
Als Mitarbeiter moechte ich farbliche Markierungen im Kalender sehen, um auf einen Blick meinen Status pro Tag zu erkennen.

## Acceptance Criteria

### Kalender-Anzeige
- [ ] Monatskalender wird im Dashboard angezeigt
- [ ] Aktueller Monat und Jahr werden als Ueberschrift angezeigt
- [ ] Wochentage (Mo-So) werden als Spaltenheader angezeigt
- [ ] Aktueller Tag ist visuell hervorgehoben (z.B. blauer Rand)
- [ ] Wochenenden (Sa, So) sind visuell abgegrenzt (z.B. grauer Hintergrund)
- [ ] Tage des vorherigen/naechsten Monats sind ausgegraut

### Navigation
- [ ] Pfeil-Buttons fuer "Vorheriger Monat" und "Naechster Monat"
- [ ] "Heute"-Button springt zum aktuellen Monat zurueck
- [ ] Navigation ist fluessig (kein Seitenreload)

### Rechtsklick-Kontextmenue
- [ ] Rechtsklick auf einen Tag oeffnet ein Kontextmenue
- [ ] Kontextmenue zeigt folgende Optionen:
  - "Arbeitszeit erfassen" (fuehrt zu PROJ-5)
  - "Krankmeldung eintragen" (fuehrt zu PROJ-9)
  - "Urlaub beantragen" (fuehrt zu PROJ-7)
- [ ] Das Standard-Browser-Kontextmenue wird unterdrueckt
- [ ] Kontextmenue schliesst sich bei Klick ausserhalb
- [ ] Kontextmenue uebergibt das angeklickte Datum an die jeweilige Aktion

### Farbliche Markierungen
- [ ] Gruen = Arbeitstag mit erfassten Stunden
- [ ] Rot = Krankmeldung
- [ ] Blau = Urlaub (genehmigt)
- [ ] Gelb/Orange = Urlaub (beantragt, noch nicht genehmigt)
- [ ] Tage ohne Eintrag haben keine spezielle Markierung
- [ ] Bei Hover ueber einen markierten Tag wird ein Tooltip mit Details angezeigt (z.B. "8h Arbeitszeit" oder "Urlaub beantragt")

### Daten laden
- [ ] Beim Laden eines Monats werden alle Eintraege fuer diesen Monat abgerufen
- [ ] Loading-State waehrend die Daten geladen werden
- [ ] Daten werden bei Monatswechsel neu geladen

## Edge Cases

- **EC-1: Rechtsklick auf vergangene Tage** — Stunden koennen auch rueckwirkend eingetragen werden (kein Block)
- **EC-2: Tag mit bestehendem Eintrag** — Kontextmenue zeigt "Bearbeiten" statt "Erfassen" wenn bereits ein Eintrag existiert
- **EC-3: Touch-Geraete** — Kein Rechtsklick moeglich → Long-Press als Alternative, oder ein kleines "+"-Icon pro Tag
- **EC-4: Mehrere Eintragstypen an einem Tag** — Ein Tag kann z.B. halben Tag Arbeit + halben Tag Krank haben → Mehrfach-Markierung (Split-Farbe oder primaere Farbe)
- **EC-5: Viele Eintraege** — Performance bei vielen Kalendermonaten → Nur aktuellen Monat laden, bei Navigation nachladen
- **EC-6: Feiertage** — Platzhalter fuer spaetere Feiertags-Integration (z.B. via API oder manuelle Konfiguration)

## Technische Hinweise
- Eigene Kalender-Komponente (kein shadcn Calendar-Picker, da dieser fuer Datumswahl ist, nicht fuer Monatsansicht)
- shadcn/ui Dropdown-Menu fuer Kontextmenue
- shadcn/ui Tooltip fuer Hover-Details
- Daten ueber API laden (time_entries, vacation_requests, sick_leaves)
- Desktop-first Layout, Kalender nimmt den groessten Bereich ein
