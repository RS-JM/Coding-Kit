# Zeiterfassungs-App

> Mitarbeiter-Zeiterfassung mit Login, Dashboard, Kalender und Abwesenheitsverwaltung

## Vision
Eine Zeiterfassungs-App fuer Mitarbeiter mit 3 Rollen (Mitarbeiter, Manager, Admin). Mitarbeiter erfassen Arbeitsstunden, beantragen Urlaub und melden Krankheitstage. Manager genehmigen Urlaubsantraege. Admins verwalten Benutzerkonten und Urlaubskontingente.

---

## Aktueller Status
Feature-Spezifikationen erstellt — Naechster Schritt: Solution Architect fuer PROJ-1

---

## Tech Stack

### Frontend
- **Framework:** Next.js 16 (App Router)
- **Sprache:** TypeScript
- **Styling:** Tailwind CSS
- **UI Library:** shadcn/ui (copy-paste components)

### Backend
- **Database:** Supabase (PostgreSQL with Auth)
- **State Management:** React useState / Context API
- **Data Fetching:** React Server Components / fetch

### Deployment
- **Hosting:** Vercel (oder Netlify)

---

## Features Roadmap

### Phase 1 — MVP

| ID | Feature | Status | Spec |
|----|---------|--------|------|
| PROJ-1 | Benutzer-Authentifizierung (Login/Logout/PW-Reset) | 🔵 Planned | [Spec](/features/PROJ-1-benutzer-authentifizierung.md) |
| PROJ-2 | Rollen- und Benutzerverwaltung (Datenmodell) | 🔵 Planned | [Spec](/features/PROJ-2-rollen-benutzerverwaltung.md) |
| PROJ-3 | Dashboard-Layout und Benutzerinfo | 🔵 Planned | [Spec](/features/PROJ-3-dashboard-layout.md) |
| PROJ-4 | Interaktiver Kalender | 🔵 Planned | [Spec](/features/PROJ-4-interaktiver-kalender.md) |
| PROJ-5 | Arbeitszeiterfassung | 🔵 Planned | [Spec](/features/PROJ-5-arbeitszeiterfassung.md) |
| PROJ-6 | Urlaubsanzeige im Dashboard | 🔵 Planned | [Spec](/features/PROJ-6-urlaubsanzeige-dashboard.md) |

### Phase 2 — Abwesenheitsverwaltung

| ID | Feature | Status | Spec |
|----|---------|--------|------|
| PROJ-7 | Urlaubsantrag stellen (Mitarbeiter) | 🔵 Planned | [Spec](/features/PROJ-7-urlaubsantrag.md) |
| PROJ-8 | Urlaubsgenehmigung (Manager) | 🔵 Planned | [Spec](/features/PROJ-8-urlaubsgenehmigung.md) |
| PROJ-9 | Krankmeldung eintragen | 🔵 Planned | [Spec](/features/PROJ-9-krankmeldung.md) |

### Phase 3 — Administration

| ID | Feature | Status | Spec |
|----|---------|--------|------|
| PROJ-10 | Admin-Benutzerverwaltung | 🔵 Planned | [Spec](/features/PROJ-10-admin-benutzerverwaltung.md) |

### Implementierungsreihenfolge

```
PROJ-1 (Auth) → PROJ-2 (Rollen) → PROJ-3 (Dashboard) → PROJ-4 + PROJ-6 (parallel) → PROJ-5 (Zeiterfassung)
Danach: PROJ-7 → PROJ-8 → PROJ-9
Zuletzt: PROJ-10
```

---

## Status-Legende
- ⚪ Backlog (noch nicht gestartet)
- 🔵 Planned (Requirements geschrieben)
- 🟡 In Review (User reviewt)
- 🟢 In Development (Wird gebaut)
- ✅ Done (Live + getestet)

---

## Development Workflow

1. **Requirements Engineer** erstellt Feature Spec → User reviewt
2. **Solution Architect** designed Schema/Architecture → User approved
3. **PROJECT_CONTEXT.md** Roadmap updaten (Status: 🔵 Planned → 🟢 In Development)
4. **Frontend + Backend Devs** implementieren → User testet
5. **QA Engineer** führt Tests aus → Bugs werden gemeldet
6. **DevOps** deployed → Status: ✅ Done

---

## Environment Variables

For projects using Supabase:
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

See `.env.local.example` for full list.

---

## Agent-Team Verantwortlichkeiten

- **Requirements Engineer** (`.claude/agents/requirements-engineer.md`)
  - Feature Specs in `/features` erstellen
  - User Stories + Acceptance Criteria + Edge Cases

- **Solution Architect** (`.claude/agents/solution-architect.md`)
  - Database Schema + Component Architecture designen
  - Tech-Entscheidungen treffen

- **Frontend Developer** (`.claude/agents/frontend-dev.md`)
  - UI Components bauen (React + Tailwind + shadcn/ui)
  - Responsive Design + Accessibility

- **Backend Developer** (`.claude/agents/backend-dev.md`)
  - Supabase Queries + Row Level Security Policies
  - API Routes + Server-Side Logic

- **QA Engineer** (`.claude/agents/qa-engineer.md`)
  - Features gegen Acceptance Criteria testen
  - Bugs dokumentieren + priorisieren

- **DevOps** (`.claude/agents/devops.md`)
  - Deployment zu Vercel
  - Environment Variables verwalten
  - Production-Ready Essentials (Error Tracking, Security Headers, Performance)

---

## Production-Ready Features

This template includes production-readiness guides integrated into the agents:

- **Error Tracking:** Sentry setup instructions (DevOps Agent)
- **Security Headers:** XSS/Clickjacking protection (DevOps Agent)
- **Performance:** Database indexing, query optimization (Backend Agent)
- **Input Validation:** Zod schemas for API safety (Backend Agent)
- **Caching:** Next.js caching strategies (Backend Agent)

All guides are practical and include code examples ready to copy-paste.

---

## Design Decisions

Document your architectural decisions here as your project evolves.

**Template:**
- **Why did we choose X over Y?**
  → Reason 1
  → Reason 2

---

## Folder Structure

```
ai-coding-starter-kit/
├── .claude/
│   └── agents/              ← 6 AI Agents (Requirements, Architect, Frontend, Backend, QA, DevOps)
├── features/                ← Feature Specs (Requirements Engineer creates these)
│   └── README.md            ← Documentation on how to write feature specs
├── src/
│   ├── app/                 ← Pages (Next.js App Router)
│   ├── components/          ← React Components
│   │   └── ui/              ← shadcn/ui components (add as needed)
│   └── lib/                 ← Utility functions
│       ├── supabase.ts      ← Supabase client (commented out by default)
│       └── utils.ts         ← Helper functions
├── public/                  ← Static files
├── PROJECT_CONTEXT.md       ← This file - update as project grows
└── package.json
```

---

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Setup Environment Variables (if using Supabase):**
   ```bash
   cp .env.local.example .env.local
   # Add your Supabase credentials
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **Start using the AI Agent workflow:**
   - Tell Claude to read `.claude/agents/requirements-engineer.md` and define your first feature
   - Follow the workflow: Requirements → Architecture → Development → QA → Deployment

---

## Next Steps

1. **Solution Architect fuer PROJ-1 starten**
   - Tell Claude: "Read `.claude/agents/solution-architect.md` and design the architecture for PROJ-1"
   - Database Schema, Component Architecture, Tech-Entscheidungen

2. **MVP implementieren (Phase 1: PROJ-1 bis PROJ-6)**
   - Reihenfolge: Auth → Rollen → Dashboard → Kalender + Urlaubsanzeige → Zeiterfassung
   - Jedes Feature durchlaeuft: Architecture → Development → QA → Deployment

3. **Phase 2 und 3 nach MVP-Abschluss**
   - Abwesenheitsverwaltung (PROJ-7 bis PROJ-9)
   - Administration (PROJ-10)

4. **Track progress via Git**
   - Feature specs in `/features/PROJ-X.md` zeigen Status (Planned → In Development → Done)
   - Git commits tracken alle Implementierungsdetails
   - Use `git log --grep="PROJ-X"` to see feature history

---

**Built with AI Agent Team System + Claude Code**
