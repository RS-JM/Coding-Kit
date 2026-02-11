# PROJ-10: Admin-Benutzerverwaltung

## Status: 🔵 Planned

## Beschreibung
Admin-Bereich zum Anlegen, Bearbeiten und Deaktivieren von Benutzerkonten. Admins koennen Rollen zuweisen und das Urlaubskontingent individuell konfigurieren (z.B. fuer Teilzeit oder Praktikanten).

## Abhaengigkeiten
- Benoetigt: PROJ-1 (Benutzer-Authentifizierung) — fuer User-Management via Supabase Auth
- Benoetigt: PROJ-2 (Rollen- und Benutzerverwaltung) — fuer Profil-Tabelle und Rollen

## User Stories

### US-1: Benutzer anlegen
Als Admin moechte ich neue Benutzer anlegen koennen, um neuen Mitarbeitern Zugang zu geben.

### US-2: Rollen verwalten
Als Admin moechte ich Benutzerrollen aendern koennen (Mitarbeiter, Manager, Admin), um Berechtigungen zu steuern.

### US-3: Urlaubskontingent anpassen
Als Admin moechte ich das Urlaubskontingent individuell anpassen koennen (z.B. 20 Tage fuer Teilzeit, 15 fuer Praktikanten).

### US-4: Benutzer deaktivieren
Als Admin moechte ich Benutzerkonten deaktivieren koennen (ohne sie zu loeschen), um ausgeschiedene Mitarbeiter zu sperren.

### US-5: Benutzerliste
Als Admin moechte ich eine Uebersicht aller Benutzer mit Suchfunktion sehen.

## Acceptance Criteria

### Admin-Bereich
- [ ] Eigene Seite/Tab im Dashboard (nur sichtbar fuer Admins)
- [ ] Nicht-Admins koennen den Bereich nicht sehen oder erreichen
- [ ] Benutzerliste mit Suchfunktion (Name, E-Mail)

### Benutzerliste
- [ ] Tabelle zeigt: Name, E-Mail, Job-Titel, Rolle, Urlaubstage, Status (aktiv/inaktiv)
- [ ] Sortierbar nach Name, Rolle, Status
- [ ] Suchfeld filtert nach Name oder E-Mail
- [ ] Pagination bei vielen Benutzern

### Benutzer anlegen
- [ ] "Neuer Benutzer"-Button oeffnet ein Formular
- [ ] Felder: E-Mail, Vorname, Nachname, Job-Titel, Rolle, Urlaubstage
- [ ] Validierung: E-Mail-Format, Pflichtfelder
- [ ] Neuer User erhaelt eine Einladungs-E-Mail (Supabase Auth Invite)
- [ ] Standard-Urlaubstage: 30 (aenderbar im Formular)

### Benutzer bearbeiten
- [ ] Klick auf einen Benutzer oeffnet Bearbeitungsdialog
- [ ] Alle Felder aenderbar: Name, Job-Titel, Rolle, Urlaubstage
- [ ] E-Mail ist nicht aenderbar (Supabase Auth Constraint)
- [ ] Rollenaenderung wird sofort wirksam

### Benutzer deaktivieren/aktivieren
- [ ] Toggle-Button fuer aktiv/inaktiv
- [ ] Bestaetigungsdialog bei Deaktivierung
- [ ] Deaktivierte User koennen sich nicht einloggen
- [ ] Deaktivierte User werden in der Liste als "inaktiv" markiert
- [ ] Daten bleiben erhalten (kein hartes Loeschen)

### Urlaubskontingent
- [ ] Urlaubstage pro Benutzer individuell einstellbar
- [ ] Standard: 30 Tage (Vollzeit)
- [ ] Beispiel: 20 Tage fuer Teilzeit, 15 fuer Praktikanten
- [ ] Aenderung wird sofort in der Urlaubsanzeige (PROJ-6) wirksam

### Sicherheit
- [ ] RLS-Policies: Nur Admins haben Zugriff auf den Admin-Bereich
- [ ] Audit-Log: Aenderungen werden geloggt (wer hat was wann geaendert)

## Edge Cases

- **EC-1: Letzter Admin** — Was passiert wenn der letzte Admin sich selbst die Admin-Rolle entzieht? → Blockieren mit Meldung: "Mindestens ein Admin muss existieren"
- **EC-2: Deaktivierter User loggt sich ein** — Login wird verweigert mit Meldung "Ihr Konto wurde deaktiviert"
- **EC-3: E-Mail bereits vergeben** — Fehlermeldung: "Ein Benutzer mit dieser E-Mail existiert bereits"
- **EC-4: Urlaubstage reduzieren** — Was passiert wenn Urlaubstage unter die bereits genommenen Tage reduziert werden? → Warnung anzeigen, aber erlauben (negative Resttage moeglich)

## Technische Hinweise
- shadcn/ui Table fuer Benutzerliste
- shadcn/ui Dialog fuer Anlegen/Bearbeiten
- shadcn/ui Input, Label, Select fuer Formular
- shadcn/ui Switch fuer aktiv/inaktiv Toggle
- shadcn/ui AlertDialog fuer Bestaetigungen
- shadcn/ui Badge fuer Rollen-Anzeige
- Supabase Auth Admin API fuer User-Invite und Deaktivierung
- Supabase RLS: Nur Admin-Rolle hat Zugriff
