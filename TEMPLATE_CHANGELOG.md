# Template Changelog

> **Note:** This file tracks changes to the **AI Coding Starter Kit Template** itself (not your project features).
>
> For tracking features you build in your project, use `FEATURE_CHANGELOG.md` instead.

---

## v1.2.0 - Feature Changelog System (2026-01-10)

### ✅ Änderungen

#### 1. Neue `FEATURE_CHANGELOG.md` für Feature-Tracking

**Problem vorher:**
- Agents wussten nicht, welche Features bereits existieren
- Risiko von Duplikaten oder redundanter Infrastruktur
- Keine zentrale Übersicht über implementierte Features

**Jetzt:**
- `FEATURE_CHANGELOG.md` trackt chronologisch ALLE implementierten Features
- Enthält: Implementation Details, neue Files, Database Changes, API Endpoints, Abhängigkeiten
- Wird vom DevOps Agent nach jedem Deployment updated

**Format:**
```markdown
## [PROJ-X] Feature-Name (2026-XX-XX)

### Implementiert ✅
- **Status:** Done
- **Feature Spec:** `/features/PROJ-X-feature-name.md`
- **Implementiert von:** Frontend Dev + Backend Dev
- **Getestet von:** QA Engineer
- **Deployed:** 2026-XX-XX

### Was wurde gebaut?
[1-2 Sätze Beschreibung]

### Neue Files
- `src/components/NewComponent.tsx` - [Beschreibung]

### Database Changes
```sql
CREATE TABLE new_table (...);
```

### API Endpoints
- `GET /api/endpoint` - [Beschreibung]

### Abhängigkeiten
- Baut auf: [PROJ-1], [PROJ-2]
```

**Benefits:**
- ✅ Agents können bestehende Components/APIs/Tables wiederverwenden
- ✅ Verhindert Duplicate Features
- ✅ QA weiß, welche Features für Regression Tests relevant sind
- ✅ Zentrale Dokumentation aller Features

---

#### 2. Alle 6 Agents integrieren jetzt FEATURE_CHANGELOG.md

**Updated:**

1. **Requirements Engineer:**
   - Prüft vor Feature Spec, ob ähnliches Feature existiert
   - Checkt vergebene Feature-IDs

2. **Solution Architect:**
   - Prüft bestehende Components/APIs/Database Tables
   - Kann auf existierender Infrastruktur aufbauen

3. **Frontend Developer:**
   - Prüft wiederverwendbare Components, Hooks, Styling-Patterns
   - Verhindert Duplicate Code

4. **Backend Developer:**
   - Prüft bestehende Database Tables, Columns, API Endpoints, RLS Policies
   - Kann Schema erweitern statt neu erstellen

5. **QA Engineer:**
   - Prüft bestehende Features für Regression Tests
   - Sieht Feature-Abhängigkeiten

6. **DevOps Engineer:**
   - Updated FEATURE_CHANGELOG.md nach jedem Deployment
   - Dokumentiert Implementation Details für zukünftige Features

**Alle Agents haben:**
- Neue Verantwortlichkeit: "FEATURE_CHANGELOG.md lesen"
- ⚠️ Warnung-Sektion mit Erklärung
- Checklist-Item: "FEATURE_CHANGELOG.md gelesen"

---

### 📦 Neue Files

1. **`FEATURE_CHANGELOG.md`** – Feature-Tracking System (Template + Guidelines)

---

### 🔄 Updated Files

1. **`.claude/agents/requirements-engineer.md`**
   - FEATURE_CHANGELOG.md Integration
   - Prüft vergebene Feature-IDs

2. **`.claude/agents/solution-architect.md`**
   - FEATURE_CHANGELOG.md Integration
   - Prüft bestehende Infrastruktur

3. **`.claude/agents/frontend-dev.md`**
   - FEATURE_CHANGELOG.md Integration
   - Code-Reuse Fokus

4. **`.claude/agents/backend-dev.md`**
   - FEATURE_CHANGELOG.md Integration
   - Schema-Erweiterung statt Neuerstellung

5. **`.claude/agents/qa-engineer.md`**
   - FEATURE_CHANGELOG.md Integration
   - Regression Testing Focus

6. **`.claude/agents/devops.md`**
   - FEATURE_CHANGELOG.md Update-Pflicht nach Deployment
   - Vollständige Update-Anleitung

---

## v1.1.0 - Agent System Improvements (2026-01-10)

### ✅ Änderungen

#### 1. `.claude/skills/` → `.claude/agents/` umbenannt

**Warum?**
- Agents sind KEINE registrierten Claude Code Skills
- Vermeidet Verwirrung (man kann sie nicht mit `/command` aufrufen)
- Klarere Benennung: Prompt-Templates / Role-Definitions

**Betroffen:**
- Ordner umbenen nt: `.claude/agents/`
- Alle Dokumentations-Files updated (README, PROJECT_CONTEXT, etc.)

---

#### 2. Requirements Engineer: Interaktive Fragen mit `AskUserQuestion`

**Vorher:**
```markdown
Fragen stellen:
- Wer sind die User?
- Was ist der Haupt-Use-Case?
```
→ Agent rattert Fragen als Text runter

**Jetzt:**
```typescript
AskUserQuestion({
  questions: [
    {
      question: "Wer sind die primären User dieses Features?",
      header: "Zielgruppe",
      options: [
        { label: "Solo-Gründer", description: "..." },
        { label: "Kleine Teams (2-10)", description: "..." },
        ...
      ],
      multiSelect: false
    }
  ]
})
```
→ Agent nutzt interaktive Single/Multiple-Choice Fragen!

**Benefits:**
- User kann per Mausklick antworten (statt tippen)
- Strukturierte Antworten (keine freien Texte)
- Bessere User Experience
- Systematischer Workflow

---

#### 3. Neue Dokumentation: `HOW_TO_USE_AGENTS.md`

**Inhalt:**
- ✅ Erklärt, dass Agents KEINE Skills sind
- ✅ Zeigt, wie man Agents richtig nutzt (Referenzierung)
- ✅ Best Practice Workflows mit Beispielen
- ✅ Voice-First Development Tipps
- ✅ Troubleshooting
- ✅ Quick Reference Table

**Use Case:**
User, die das Template clonen, wissen sofort wie sie die Agents nutzen.

---

### 📦 Neue Files

1. **`HOW_TO_USE_AGENTS.md`** – Vollständige Nutzungsanleitung
2. **`TEMPLATE_CHANGELOG.md`** – Dieses File (Template Version History)

---

### 🔄 Updated Files

1. **`.claude/agents/requirements-engineer.md`**
   - Workflow komplett überarbeitet
   - Nutzt jetzt `AskUserQuestion` Tool
   - 4 Phasen: Feature verstehen → Edge Cases → Spec schreiben → Review

2. **`README.md`**
   - Warnung hinzugefügt: Agents sind keine Skills
   - Link zu HOW_TO_USE_AGENTS.md

3. **`PROJECT_CONTEXT.md`**
   - Pfade updated (`.claude/agents/`)

4. **`TEMPLATE_OVERVIEW.md`**
   - Pfade updated

5. **`CHECKLIST.md`**
   - Pfade updated

---

### 🚀 Migration Guide (für bestehende Nutzer)

Falls du das Template bereits gecloned hast:

```bash
cd ai-coding-starter-kit
mv .claude/skills .claude/agents
```

Fertig! Keine weiteren Änderungen nötig.

---

## v1.0.0 - Initial Release (2026-01-10)

### Features

- ✅ Next.js 16 + TypeScript + Tailwind CSS
- ✅ 6 AI Agents mit Checklisten
- ✅ Supabase-Ready (optional)
- ✅ shadcn/ui-Ready
- ✅ Vercel Deployment-Ready
- ✅ PROJECT_CONTEXT.md Template
- ✅ Feature Specs System (`/features/PROJ-X.md`)
- ✅ Vollständige Dokumentation

---

**Letzte Aktualisierung:** 2026-01-10
