# PROJ-6: Urlaubsanzeige im Dashboard

## Status: 🔵 Planned

## Beschreibung
Widget im Dashboard, das die genommenen und verbleibenden Urlaubstage fuer das aktuelle Jahr anzeigt. Zeigt einen Fortschrittsbalken und separate Anzeige fuer beantragte (noch nicht genehmigte) Tage.

## Abhaengigkeiten
- Benoetigt: PROJ-2 (Rollen- und Benutzerverwaltung) — fuer Urlaubskontingent (`urlaubstage_gesamt`)
- Benoetigt: PROJ-3 (Dashboard-Layout) — fuer Widget-Platzierung im Dashboard

## User Stories

### US-1: Urlaubsuebersicht
Als Mitarbeiter moechte ich sehen, wie viele Urlaubstage ich dieses Jahr bereits genommen habe, um meine verbleibenden Tage zu kennen.

### US-2: Verbleibende Tage
Als Mitarbeiter moechte ich sehen, wie viele Urlaubstage mir noch zustehen, um meinen Urlaub planen zu koennen.

### US-3: Beantragte Tage
Als Mitarbeiter moechte ich sehen, wie viele Tage aktuell beantragt (aber noch nicht genehmigt) sind, um den vollen Status zu kennen.

## Acceptance Criteria

### Widget-Anzeige
- [ ] Widget ist im Dashboard sichtbar (neben dem Kalender)
- [ ] Anzeige: "X von Y Urlaubstagen genommen" (z.B. "12 von 30 Urlaubstagen genommen")
- [ ] Fortschrittsbalken visualisiert den Verbrauch (z.B. 40% gefuellt)
- [ ] Verbleibende Tage werden prominent angezeigt (z.B. "18 Tage verbleibend")
- [ ] Beantragte (noch nicht genehmigte) Tage werden separat angezeigt (z.B. "3 Tage beantragt")
- [ ] Farbe des Fortschrittsbalkens aendert sich:
  - Gruen: < 70% verbraucht
  - Orange: 70-90% verbraucht
  - Rot: > 90% verbraucht

### Datenberechnung
- [ ] Berechnung basiert nur auf genehmigten Urlaubsantraegen des aktuellen Jahres
- [ ] Urlaubskontingent kommt aus dem User-Profil (PROJ-2: `urlaubstage_gesamt`)
- [ ] Widget aktualisiert sich automatisch nach neuen Urlaubsantraegen

### Design
- [ ] Widget nutzt shadcn/ui Card-Komponente
- [ ] Fortschrittsbalken nutzt shadcn/ui Progress-Komponente
- [ ] Loading-State (Skeleton) waehrend Daten geladen werden
- [ ] Kompaktes Design, passt in die Dashboard-Sidebar oder einen Widget-Bereich

## Edge Cases

- **EC-1: Jahreswechsel** — Am 1. Januar wird der Zaehler auf 0 zurueckgesetzt (basierend auf dem aktuellen Jahr)
- **EC-2: Mehr beantragt als verfuegbar** — Widget zeigt Warnung: "Achtung: Mehr Urlaubstage beantragt als verfuegbar!"
- **EC-3: Halbe Urlaubstage** — Erstmal nur ganze Tage unterstuetzen (kein halber Urlaub)
- **EC-4: Keine Urlaubsdaten** — Wenn noch keine Urlaubsantraege existieren → "0 von 30 Urlaubstagen genommen"
- **EC-5: Individuelles Kontingent** — Teilzeit-Mitarbeiter haben weniger Tage (z.B. 20) → Wert kommt aus Profil

## Technische Hinweise
- shadcn/ui Card fuer Widget-Container
- shadcn/ui Progress fuer Fortschrittsbalken
- shadcn/ui Badge fuer Status-Anzeige
- Daten ueber API abrufen: genehmigte + beantragte Urlaubstage
- Berechnung: genommen = Summe genehmigter Urlaubstage im aktuellen Jahr
