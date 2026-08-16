# Agent Rules — GymTracker V1 (Dev A Domain)

> **Mandatory reading before any code change.**  
> These rules exist to enable safe parallel development between two agents/developers and ensure clean git history for rollbacks.

---

## 1. Identity & Scope

- **Your role:** Dev A — Workout Engine Lead
- **Your directories (exclusive ownership):**
  - `mobile/src/screens/workout/`
  - `mobile/src/components/workout/`
  - `mobile/src/stores/useWorkoutStore.ts`
  - `mobile/src/stores/useGhostStore.ts`
  - `mobile/src/hooks/useGhostData.ts`
  - `mobile/db/` (schema.js + migrations) — **coordinate with Dev B before any change**
  - `mobile/src/data/exercises.json`
  - `mobile/tests/unit/workout/`
  - `mobile/tests/components/workout/`
- **You may READ but not WRITE without coordination:**
  - `mobile/src/navigation/` — notify Dev B before touching
  - `mobile/src/components/common/` — coordinate on shared components
  - `shared/types/` — both must approve changes

---

## 2. Git Workflow (Non-Negotiable)

### Branch per Feature
Every feature is its own branch. Never develop two features on the same branch.

```bash
# Pattern: feature/deva-<feature-name>
git checkout brainstorm
git pull origin brainstorm
git checkout -b feature/deva-<feature-name>
```

### Commit Atomically
One logical change = one commit. **Never batch multiple features into one commit.**

```bash
# Good
git commit -m "feat(workout): add SetInputForm with RIR stepper 0-5"
git commit -m "test(workout): add SetInputForm unit tests"
git commit -m "fix(workout): prevent double-tap on set confirm"

# Bad
git commit -m "added a bunch of workout stuff"
```

### Commit Message Format (Conventional Commits)
```
<type>(<scope>): <short description>

Types: feat | fix | test | refactor | chore | docs | style
Scope: workout | ghost | exercise | db | nav | shared
```

### Merging to `brainstorm`
1. All unit tests must pass (`npm test -- --testPathPattern=workout`)
2. Zero TypeScript errors (`npx tsc --noEmit`)
3. Zero ESLint errors (`npx eslint mobile/src/`)
4. Create PR on GitHub, assign Dev B as reviewer
5. Only merge after approval

### Push Frequency
- Push the feature branch to remote **after every meaningful commit** so Dev B can see progress and recover if your local machine fails:
  ```bash
  git push origin feature/deva-<feature-name>
  ```

---

## 3. Feature-by-Feature Rollback Safety

Each feature must be **independently shippable and independently rollbackable**. This means:

- Feature screens must be **registered in the navigator only after the feature is working and tested**
- If a feature breaks, a single `git revert` of its merge commit must cleanly remove it
- **No cross-feature dependencies within Dev A's domain** — each feature works standalone

---

## 4. Database Schema Rules

- The `mobile/db/schema.js` is the single source of truth for the local DB structure
- **Never change the schema without bumping `version` and adding a migration step**
- Any schema column added = new migration entry required (even in V1)
- Coordinate with Dev B before any schema change — they own `diet_logs`, `meal_entries`, `media_records` tables

---

## 5. Testing Rules

- Write tests **before or alongside** implementation (TDD preferred, TDD-adjacent minimum)
- Every new component gets a `*.test.tsx` file in `mobile/tests/components/workout/`
- Every new hook gets a `*.test.ts` file in `mobile/tests/unit/workout/`
- Performance assertions: ghost data queries must be tested for < 50ms response time
- Never skip a test with `.skip` without a code comment explaining why

---

## 6. TypeScript Rules

- All types live in `shared/types/entities.ts` and `shared/types/enums.ts`
- No `any` types allowed anywhere — use `unknown` and narrow if needed
- All WatermelonDB models must have a corresponding TypeScript interface in `shared/types/`

---

## 7. WatermelonDB Patterns

- Always use `database.write()` for all DB writes — never call `.update()` or `.create()` outside a write action
- For ghost cache: **read from Zustand store in-memory first**, fall back to WatermelonDB query
- Reactive queries (`.observe()`) over one-shot queries wherever the UI needs to update on data change
- Never store absolute file paths — use relative paths from `AppDocumentsDir`

---

## 8. What to Do When Blocked

- Dev B's components are missing → create a **stub/mock** in `mobile/src/components/common/` and note it as `// STUB: replace when Dev B delivers <ComponentName>`
- Shared type is wrong → open a PR against `shared/types/` with both devs as required reviewers
- Schema conflict with Dev B → stop, discuss, update schema together with a version bump

---

## 9. PR Template Checklist

Every PR must include in its description:
```
## Feature
[Name of feature]

## Spec Reference
[Link to spec file e.g. docs/specs/v1/features/workout-logger.spec.md]

## Acceptance Criteria Completed
- [ ] Criterion 1
- [ ] Criterion 2

## Tests Added
- Unit: [list test files]
- Component: [list test files]

## Schema Changes?
[ ] No  [ ] Yes — migration added at version X

## TypeScript Clean?
[ ] npx tsc --noEmit passed

## Breaking Changes?
[ ] None
```

---

## 10. Forbidden Actions

- ❌ Never `git push --force` to `brainstorm`
- ❌ Never commit to `brainstorm` directly — always via PR
- ❌ Never merge your own PR without Dev B's review
- ❌ Never use `// @ts-ignore` or `/* eslint-disable */`
- ❌ Never commit `.env` files, API keys, or device paths
- ❌ Never delete or rename columns in `db/schema.js` without a migration — this corrupts existing users' data

---

## 11. Agent Bug Fix & Verification Logging Rule

> [!IMPORTANT]
> **Mandatory Bug Resolution Documentation Rule**
> Every time an AI agent solves a bug and verifies that it is fixed (or when the user confirms the fix / moves to an unrelated task):
> 1. **Document the Action**: Log the exact root cause, action taken, and files modified in the project documentation ([walkthrough.md](walkthrough.md) and relevant docs under `docs/`).
> 2. **Run Full Test Suite**: Ensure all unit and integration tests are 100% passing (`npm test`).
> 3. **Commit and Sync**: Commit with conventional prefix (`fix(devb): ...` / `fix(deva): ...` / `docs: ...`) and sync to the main development branch.

