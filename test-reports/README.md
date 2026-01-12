# Test Reports

Dieser Ordner enthält alle QA Test Reports vom **QA Engineer Agent**.

## Struktur

Jedes Feature bekommt einen eigenen Test Report:

```
test-reports/
├── PROJ-1-simple-todo-kanban.md
├── PROJ-2-user-auth.md
└── PROJ-3-payment-integration.md
```

## Naming Convention

**Format:** `PROJ-X-feature-name.md`

- `PROJ-X` = Feature-ID aus `/features/PROJ-X-feature-name.md`
- `feature-name` = Kurzer, beschreibender Name (lowercase, kebab-case)

**Beispiele:**
- `PROJ-1-simple-todo-kanban.md`
- `PROJ-2-user-authentication.md`
- `PROJ-5-file-upload.md`

## Was gehört in einen Test Report?

### 1. Header
```markdown
# Test Report: PROJ-X Feature-Name

## Tested: 2026-01-10
## Tester: QA Engineer Agent
## App URL: http://localhost:3000
```

### 2. Acceptance Criteria Status
Jedes Acceptance Criteria aus der Feature Spec testen:
```markdown
### Aufgaben erstellen
- [x] AC-1.1: Input-Feld vorhanden → ✅ PASS
- [ ] AC-1.2: Validierung fehlt → ❌ FAIL (BUG-1)
```

### 3. Edge Cases Status
Alle Edge Cases aus der Feature Spec testen:
```markdown
### EC-1: Leere Eingabe
- ✅ PASS - Validierung verhindert leere Aufgaben
```

### 4. Bugs Found
Alle gefundenen Bugs dokumentieren:
```markdown
### BUG-1: Validierung fehlt
- **Severity:** High
- **Steps to Reproduce:**
  1. Öffne App
  2. Klick auf "Hinzufügen" ohne Text
  3. Expected: Error "Bitte Text eingeben"
  4. Actual: Leere Aufgabe wird erstellt
- **Priority:** High
```

### 5. Summary & Production-Ready Decision
```markdown
## Summary
- ✅ 20/24 Acceptance Criteria passed
- ❌ 2 Bugs found (1 High, 1 Low)
- ⚠️ Feature ist NICHT production-ready

## Production-Ready Decision
❌ **NOT READY** - BUG-1 (High Priority) muss gefixt werden
```

## Test Report Workflow

1. **QA Engineer Agent** testet Feature
2. **Test Report** wird in `/test-reports/PROJ-X-feature-name.md` gespeichert
3. **User** reviewed Report und priorisiert Bugs
4. **Frontend/Backend Dev** fixt Bugs
5. **QA Engineer** testet erneut (Regression Test)
6. **Production-Ready** → Feature wird deployed

## Production-Ready Kriterien

- ✅ **READY:** Alle Acceptance Criteria passed + Keine Critical/High Bugs
- ❌ **NOT READY:** Critical oder High-Priority Bugs existieren

## Regression Tests

Wenn Bugs gefixt wurden oder neue Features deployed werden:
1. QA Engineer führt **Regression Test** durch
2. Alter Test Report bleibt erhalten (mit Datum im Namen):
   - `PROJ-1-simple-todo-kanban-2026-01-10.md` (alter)
   - `PROJ-1-simple-todo-kanban.md` (aktuellster)

## Tools

- **Manuelles Testing:** Browser (Chrome, Firefox, Safari)
- **Responsive Testing:** Browser DevTools (375px Mobile, 768px Tablet, 1440px Desktop)
- **Performance:** Chrome DevTools Performance Tab
- **Accessibility:** Chrome Lighthouse, axe DevTools

---

**Erstellt vom QA Engineer Agent**
