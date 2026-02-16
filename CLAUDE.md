# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install          # Install dependencies
npm run dev          # Dev server on localhost:3000
npm run build        # Production build (includes TypeScript check)
npm run lint         # ESLint
```

## Architecture

### Zeiterfassungs-App (Time Tracking)

Employee time tracking app with 3 roles: **Mitarbeiter** (employee), **Manager**, **Admin**. All UI text and documentation is in **German**.

### Tech Stack

- **Next.js 16** (App Router) + TypeScript + React 19
- **Supabase** (PostgreSQL + Auth + RLS) via `@supabase/ssr`
- **Tailwind CSS** + **shadcn/ui** (30+ components pre-installed in `src/components/ui/`)
- **React Hook Form** + **Zod** for form handling/validation
- **Sonner** for toast notifications

### Key Patterns

- **Server Components first** — use `'use client'` only when needed (interactivity, hooks, browser APIs)
- **Path alias:** `@/*` maps to `./src/*`
- **Supabase clients:** `createClient()` (browser, `src/lib/supabase.ts`) and `createServerSupabaseClient()` (server/cookies, `src/lib/supabase-server.ts`)
- **Route protection:** Middleware in `src/middleware.ts` checks auth, redirects unauthenticated users to `/login`. Public routes: `/login`, `/reset-password`, `/auth/callback`
- **Role-based access:** APIs check user role from `profiles` table. Roles: `mitarbeiter`, `manager`, `admin`
- **API validation:** Zod schemas validate all request bodies
- **Database functions:** Security-critical operations (login attempt tracking) use PostgreSQL functions with `security definer` called via `supabase.rpc()`

### Auth Flow

- Login with email/password via Supabase Auth
- Account locking after 5 failed attempts (admin-only unlock) — uses RPC functions (`check_account_locked`, `record_failed_login`, `reset_failed_login`)
- Password reset via email link → `/reset-password` page with `onAuthStateChange` PASSWORD_RECOVERY detection
- Profiles auto-created on signup via PostgreSQL trigger

### Database

- SQL migrations in `supabase/` — run manually in Supabase SQL Editor
- `profiles` table: id (FK to auth.users), email, vorname, nachname, job_titel, rolle, urlaubstage_gesamt, ist_aktiv, failed_login_attempts, is_locked
- `time_entries` table: id, user_id, datum (unique per user), stunden (0–24), arbeitsort (office/homeoffice/remote/kunde), kommentar
- RLS policies enforce row-level security per role
- `handle_updated_at()` trigger function reused across tables

### API Endpoints

- `GET /api/profile` — current user profile
- `GET /api/profiles` — all profiles (manager/admin only), `PATCH /api/profiles/[id]` — update profile (admin only)
- `GET /api/time-entries?von=&bis=` — user's entries for date range, `POST /api/time-entries` — create entry
- `PATCH /api/time-entries/[id]` — update entry, `DELETE /api/time-entries/[id]` — delete entry

## AI Agent Workflow

6 agents in `.claude/agents/` define a sequential development workflow:

**Requirements Engineer → Solution Architect → Frontend Dev → Backend Dev → QA Engineer → DevOps**

- Feature specs live in `features/PROJ-X-feature-name.md` with user stories, acceptance criteria, edge cases, tech design
- Agents are prompt templates (not registered Skills) — read the agent file, then follow its instructions
- `PROJECT_CONTEXT.md` tracks the feature roadmap and project status

### Dashboard Architecture

- **Header:** Logo + title, date/role badge, user name + avatar with dropdown menu (Profil, Einstellungen, Abmelden)
- **Left sidebar:** Navigation links (Übersicht, Timesheet, Kalender, Akten, Historie) + role-based entries (Team for manager, Team+Verwaltung for admin) — fixed width, hidden on mobile
- **Main content:** Grid layout with calendar (~80%) and Urlaub widget (~20%)
- **Components:** `UserMenu` (client, avatar dropdown), dashboard page is a Server Component
- Greeting changes by time of day (Guten Morgen/Tag/Abend)

### Calendar Architecture

- `MonthCalendar` (client component): weekly view (default) + monthly view with toggle, navigation (prev/next/today)
- **Single click** on a day → DropdownMenu (Arbeitszeit/Krankmeldung/Urlaub)
- **Drag-to-select** multiple days → SelectionBar with action buttons for bulk entry
- Controlled DropdownMenu with invisible trigger (`pointer-events-none`) to avoid conflict with drag events
- `useRef` for drag state (isDragging, dragStartDate, didDrag) to avoid re-renders during drag
- Document-level `mouseup` listener for when mouse leaves calendar during drag
- Entries fetched per visible date range via `GET /api/time-entries`, displayed as green badges (week view) or green dots (month view)
- `calendar-dialogs.tsx`: WorkTimeDialog (API-connected, edit/delete mode), SickLeaveDialog, VacationDialog (both still toast-only)
- `vacation-widget.tsx`: Server Component showing remaining vacation days with color-coded progress bar

### Current Status

Implemented: PROJ-1 (Auth), PROJ-2 (Roles), PROJ-3 (Dashboard), PROJ-4 (Kalender), PROJ-5 (Arbeitszeiterfassung), PROJ-6 (Urlaubsanzeige)

Next: PROJ-7 (Urlaubsantrag) → PROJ-8 (Urlaubsgenehmigung) → PROJ-9 (Krankmeldung) → PROJ-10 (Admin-Benutzerverwaltung)

Future: Outlook Sync (noted, not spec'd yet)

## Conventions

- Always check `src/components/ui/` for existing shadcn/ui components before creating custom ones. Add new ones with `npx shadcn@latest add [component]`
- Environment variables in `.env.local` (see `.env.local.example`)
- Use Umlaute (ä, ö, ü) in German text, not ae/oe/ue
