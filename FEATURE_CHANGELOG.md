# Feature Changelog

Dieses File trackt alle implementierten Features chronologisch.

**Warum?** Agents können hier nachschauen, welche Features bereits existieren, um Duplikate zu vermeiden und auf bestehendem Code aufzubauen.

---

## Template Initialisiert (2026-01-10)

### Basis-Setup ✅
- **Status:** Done
- **Beschreibung:** Next.js 16 Projekt mit TypeScript, Tailwind CSS, und AI Agent System
- **Files:**
  - `src/app/layout.tsx` - Root Layout
  - `src/app/page.tsx` - Starter Page
  - `src/app/globals.css` - Global Styles
  - `src/lib/utils.ts` - Utility Functions
  - `src/lib/supabase.ts` - Supabase Client (kommentiert, nicht aktiv)

### Features Ready to Use
- ✅ Responsive Starter Page mit Dark Mode
- ✅ Tailwind CSS Konfiguration
- ✅ TypeScript strict mode
- ✅ ESLint
- ✅ shadcn/ui ready (components.json vorhanden)

---

## Format für neue Einträge

Wenn ein neues Feature implementiert wird, trage es hier ein:

```markdown
## [PROJ-X] Feature-Name (Datum)

### Implementiert ✅
- **Status:** Done
- **Feature Spec:** `/features/PROJ-X-feature-name.md`
- **Implementiert von:** Frontend Dev + Backend Dev
- **Getestet von:** QA Engineer
- **Deployed:** 2026-XX-XX

### Was wurde gebaut?
[1-2 Sätze Beschreibung]

### Neue Files
- `src/components/FeatureComponent.tsx` - [Beschreibung]
- `src/app/api/feature/route.ts` - [Beschreibung]

### Geänderte Files
- `src/app/page.tsx` - [Was geändert]
- `PROJECT_CONTEXT.md` - Feature Status updated

### Database Changes
```sql
-- Neue Tables / Columns
CREATE TABLE new_table (...);
```

### API Endpoints
- `GET /api/feature` - [Beschreibung]
- `POST /api/feature` - [Beschreibung]

### Abhängigkeiten
- Baut auf: [PROJ-1], [PROJ-2]
- Wird genutzt von: [PROJ-5]

### Bekannte Limitationen
- [Optional: Was funktioniert noch nicht / ist out of scope]

---
```

---

## Beispiel-Eintrag

## [PROJ-1] User-Authentifizierung (2026-01-15)

### Implementiert ✅
- **Status:** Done
- **Feature Spec:** `/features/PROJ-1-user-authentication.md`
- **Implementiert von:** Frontend Dev + Backend Dev
- **Getestet von:** QA Engineer
- **Deployed:** 2026-01-15

### Was wurde gebaut?
User können sich mit Email + Passwort oder Google OAuth registrieren und einloggen. Session bleibt nach Reload erhalten.

### Neue Files
- `src/components/auth/LoginForm.tsx` - Login Form Component
- `src/components/auth/SignupForm.tsx` - Signup Form Component
- `src/components/auth/PasswordResetForm.tsx` - Password Reset Component
- `src/app/auth/login/page.tsx` - Login Page
- `src/app/auth/signup/page.tsx` - Signup Page
- `src/app/api/auth/login/route.ts` - Login API
- `src/app/api/auth/signup/route.ts` - Signup API

### Geänderte Files
- `src/lib/supabase.ts` - Aktiviert (uncommented)
- `src/app/layout.tsx` - Auth Provider hinzugefügt
- `PROJECT_CONTEXT.md` - PROJ-1 Status: ✅ Done

### Database Changes
```sql
-- Managed by Supabase Auth
-- Keine Custom Tables (nutzt auth.users)
```

### API Endpoints
- `POST /api/auth/login` - Email + Password Login
- `POST /api/auth/signup` - Email + Password Signup
- `POST /api/auth/reset-password` - Password Reset Request
- `GET /api/auth/callback` - OAuth Callback (Google)

### Abhängigkeiten
- Supabase Auth aktiviert
- Environment Variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Bekannte Limitationen
- Email-Verifizierung noch nicht implementiert (kommt in PROJ-7)
- 2FA noch nicht implementiert (geplant für später)

---

## Wie Agents dieses File nutzen

### Requirements Engineer
**Vor Feature Spec Erstellung:**
```
Lies FEATURE_CHANGELOG.md um zu prüfen:
- Existiert ein ähnliches Feature bereits?
- Auf welchen bestehenden Features können wir aufbauen?
- Welche Feature-IDs sind bereits vergeben?
```

### Solution Architect
**Vor Tech-Design:**
```
Lies FEATURE_CHANGELOG.md um zu verstehen:
- Welche Database Tables existieren bereits?
- Welche API Endpoints sind schon implementiert?
- Welche Components können wiederverwendet werden?
```

### Frontend/Backend Devs
**Vor Implementation:**
```
Lies FEATURE_CHANGELOG.md um zu sehen:
- Welche Components/APIs existieren bereits?
- Welche Patterns wurden bisher genutzt?
- Wo finde ich ähnlichen Code (zum Referenzieren)?
```

### QA Engineer
**Vor Testing:**
```
Lies FEATURE_CHANGELOG.md um zu prüfen:
- Welche Features hängen zusammen? (Regression Testing)
- Welche bekannten Limitationen gibt es?
```

---

## Best Practices

### 1. Immer updaten nach Feature-Completion
DevOps Agent sollte FEATURE_CHANGELOG.md nach jedem Deployment updaten.

### 2. Chronologische Reihenfolge
Neueste Features oben (nach diesem Template-Eintrag).

### 3. Links zu Feature Specs
Immer Link zu `/features/PROJ-X.md` für Details.

### 4. Database Changes dokumentieren
Agents können so schnell sehen, welche Tables/Columns existieren ohne in Supabase nachzuschauen.

### 5. Abhängigkeiten tracken
Hilft beim Refactoring ("Wenn ich PROJ-2 ändere, welche Features sind betroffen?")

---

## Integration in Agent Workflows

### DevOps Agent Checklist Update

Nach erfolgreichem Deployment:

```markdown
## Checklist vor Abschluss

...

### Post-Deployment Checks
- [ ] User tested Production
- [ ] Monitoring setup
- [ ] Rollback-Plan ready
- [ ] Deployment dokumentiert
- [ ] PROJECT_CONTEXT.md updated (Status: ✅ Done)
- [ ] **FEATURE_CHANGELOG.md updated** ← NEU!
```

---

**Zuletzt aktualisiert:** 2026-01-10
