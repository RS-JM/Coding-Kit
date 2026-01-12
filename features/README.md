# Feature Specifications

Dieser Ordner enthält detaillierte Feature Specs vom Requirements Engineer.

## Naming Convention
`PROJ-X-feature-name.md`

Beispiele:
- `PROJ-1-user-authentication.md`
- `PROJ-2-kanban-board.md`
- `PROJ-3-file-attachments.md`

## Was gehört in eine Feature Spec?

### 1. User Stories
Beschreibe, was der User tun möchte:
```markdown
Als [User-Typ] möchte ich [Aktion] um [Ziel zu erreichen]
```

### 2. Acceptance Criteria
Konkrete, testbare Kriterien:
```markdown
- [ ] User kann Email + Passwort eingeben
- [ ] Passwort muss mindestens 8 Zeichen lang sein
- [ ] Nach Registration wird User automatisch eingeloggt
```

### 3. Edge Cases
Was passiert bei unerwarteten Situationen:
```markdown
- Was passiert bei doppelter Email?
- Was passiert bei Netzwerkfehler?
- Was passiert bei gleichzeitigen Edits?
```

### 4. Tech Design (vom Solution Architect)
```markdown
## Database Schema
CREATE TABLE tasks (...);

## Component Architecture
ProjectDashboard
├── ProjectList
│   └── ProjectCard
```

## Workflow

1. **Requirements Engineer** erstellt Feature Spec
2. **User** reviewed Spec und gibt Feedback
3. **Solution Architect** fügt Tech-Design hinzu
4. **User** approved finales Design
5. **Frontend/Backend Devs** implementieren
6. **QA Engineer** testet gegen Acceptance Criteria
7. **DevOps** deployed

## Status-Tracking

Feature-Status wird in `PROJECT_CONTEXT.md` getrackt:
- ⚪ Backlog
- 🔵 Planned (Requirements geschrieben)
- 🟡 In Review (User reviewt)
- 🟢 In Development (Wird gebaut)
- ✅ Done (Live + getestet)
