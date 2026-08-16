# AGENTS.md — AI Agent Rules & Repository Guide

> This file is loaded automatically by AI coding assistants (Antigravity, Cursor, Copilot, Claude, etc.).
> Read this **before** writing any code or suggesting any changes.

---

## 1. Project Overview

**App:** GymTracker — A local-first mobile fitness tracker (React Native / Expo).  
**Current Phase:** V1 (Local-Only — no backend, no cloud, no auth).  
**Platform:** iOS + Android via Expo.  

---

## 2. Critical Architecture Rule (Read Before Writing Any Code)

> [!CAUTION]
> **V1 has NO backend server, NO cloud services, NO authentication, NO REST API.**
> All data lives on the user's phone in WatermelonDB (SQLite).

If asked to implement anything for V1, do **NOT** create:
- Server routes, Fastify handlers, Express middleware
- PostgreSQL queries, Redis commands, BullMQ jobs
- JWT tokens, authentication flows, refresh tokens
- Cloudflare R2 uploads, presigned URLs
- REST API calls from the mobile app to any server
- Google Calendar or any OAuth flows

These belong to **V2** and are already fully specced in `docs/specs/v2/`. Do not implement them during V1.

Why this decision was made: [`docs/specs/decisions/ADR-001-local-first-v1.md`](docs/specs/decisions/ADR-001-local-first-v1.md)

---

## 3. Spec Navigation — Always Start Here

**Before writing any feature code, read the relevant spec first.**

1. **Start at:** [`docs/specs/REGISTRY.md`](docs/specs/REGISTRY.md) — the index of all specs.
2. **For V1 architecture:** [`docs/specs/v1/README.md`](docs/specs/v1/README.md)
3. **For any V1 feature:** `docs/specs/v1/features/<feature-name>.spec.md`
4. **For work division:** [`docs/specs/v1/work-division-v1.md`](docs/specs/v1/work-division-v1.md)
5. **For decisions:** `docs/specs/decisions/ADR-*.md`

> [!WARNING]
> `docs/specs/_archive/` contains **superseded, pre-restructure specs**. Do NOT read these for implementation guidance. They describe the old mixed V1/V2 architecture.

---

## 4. V1 Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Framework | React Native (Expo) | Managed workflow + `expo-dev-client` (for native modules) |
| Local DB | WatermelonDB (SQLite) | ALL data stored here |
| State | Zustand | UI and local state |
| Navigation | React Navigation | Bottom tabs |
| Media | react-native-compressor + react-native-fs | Local device filesystem only |
| Testing | Jest + React Native Testing Library + Detox | |

Schema reference: [`docs/specs/v1/watermelondb-schema.js`](docs/specs/v1/watermelondb-schema.js)

---

## 5. Directory Ownership (V1)

> [!IMPORTANT]
> Two developers own separate, non-overlapping directories. Do not write code in the wrong person's domain.

**Developer A — Workout Engine Lead**
```
mobile/src/screens/workout/          ← WorkoutLogger, ExerciseLibrary, WorkoutHistory
mobile/src/components/workout/       ← SetInputForm, SetRow, GhostBanner, ExerciseCard
mobile/src/stores/useWorkoutStore.ts
mobile/src/stores/useGhostStore.ts
mobile/src/hooks/useGhostData.ts
mobile/db/                           ← WatermelonDB schema + migrations
mobile/src/data/                     ← Bundled exercise seed JSON
```

**Developer B — Diet, Media & Data Lead**
```
mobile/src/screens/onboarding/       ← First-launch, profile, goals setup
mobile/src/screens/diet/             ← DietLog, MealEditor
mobile/src/screens/progress/         ← ProgressTimeline, PoseComparison
mobile/src/screens/settings/         ← Preferences, DataExport
mobile/src/components/diet/          ← MacroProgressBar, MealEntryCard, ConditionChips
mobile/src/components/media/         ← MediaPicker, ProgressPhotoCard
mobile/src/stores/useDietStore.ts
mobile/src/stores/usePreferencesStore.ts
mobile/src/stores/useMediaStore.ts
mobile/src/utils/exportService.ts
mobile/src/utils/importService.ts
```

**Shared (requires coordination):**
```
mobile/src/navigation/               ← RootNavigator config
mobile/src/components/common/        ← Button, Card, Header, Stepper
shared/types/                        ← Entity types + enums (entities.ts, enums.ts)
```

---

## 6. WatermelonDB Rules

- All writes go through WatermelonDB `database.write()` transactions.
- Never use AsyncStorage for persistent data — WatermelonDB only.
- Always assign a `client_uuid` (uuid v4) to new records at creation time.
- The `sync_status` field defaults to `'pending'` on all new records (used in V2 — ignore the value in V1 but do not remove the field).
- The `server_id` field is always `null` in V1 (used in V2 migration — do not populate it).
- Ghost cache (`exercise_ghost_cache`) must be updated within the same `database.write()` action as the set insert.

---

## 7. Code Style & Quality Rules

- **Language:** TypeScript everywhere. No plain `.js` files in `mobile/src/`.
- **No inline styles** in React Native — use StyleSheet.create().
- **No hardcoded strings** visible to users — use constants or i18n-ready keys.
- **Validation** runs on the client only (V1 has no server). Use Zod or manual validation before writing to WatermelonDB.
- **RIR is always 0–5.** Never allow RIR > 5 to reach storage. Enforce at the UI stepper level.
- **Debounce** all rapid-tap entry points (e.g., "+ Set" confirm button: 300ms debounce).
- **Component tests** target ≥ 75% coverage (React Native Testing Library).
- **Never commit** directly to `main`. Always use a feature branch.
- **Never import gallery videos** in V1 media flows. Only camera-recorded videos are permitted.
- **Always check available storage** before any media capture: warn at <500MB free, block capture at <100MB free.
- **Compress all media** before writing to filesystem — never store raw camera output. Use `react-native-compressor` for both photos and videos.
- **Batch WatermelonDB imports** in groups of 100 records using `database.batch()` to prevent UI jank on large restores.

---

## 8. Git Conventions

| Who | Branch Prefix | Example |
|-----|--------------|---------|
| Developer A | `feature/deva-<name>` | `feature/deva-workout-logger` |
| Developer B | `feature/devb-<name>` | `feature/devb-macro-tracker` |
| Shared/Infra | `chore/<name>` | `chore/navigation-setup` |
| Bug fixes | `fix/<name>` | `fix/rir-stepper-overflow` |

**PR Rules:**
- All PRs require the other developer's approval.
- CI (lint + unit tests) must pass before merge.
- Link the relevant spec file in the PR description.
- No direct commits to `main`.

---

## 9. Forbidden Actions

| ❌ Never Do This | ✅ Do This Instead |
|-----------------|------------------|
| Read `docs/specs/_archive/` for implementation guidance | Read `docs/specs/v1/` specs |
| Create any file in a `/backend/` directory | V1 has no backend — everything is in `/mobile/` |
| Make HTTP fetch/axios calls to an API from V1 code | Read from WatermelonDB locally |
| Store photos/videos in a cloud bucket | Save to `{AppDocumentsDir}/media/{uuid}.ext` via `react-native-fs` |
| Create JWT tokens, password hashing, or auth middleware | Auth is V2 — not needed in V1 |
| Modify `docs/specs/v2/` specs during V1 development | V2 specs are frozen during V1 phase |
| Write to `shared/types/` without both developers agreeing | Coordinate before changing shared types |
| Import videos from device gallery | Only camera-recorded videos allowed in V1 |
| Store raw (uncompressed) camera output | Always compress via `react-native-compressor` first |
| `npm install` Expo native packages | Use `npx expo install` to get version-compatible packages |

---

## 10. Commit Message Conventions (Agentic Coding)

Use this format for all commits to maintain a traceable, rollback-friendly history:

| Prefix | When to Use | Example |
|--------|------------|---------|
| `feat(devb):` | New feature implementation | `feat(devb): add MacroProgressBar component` |
| `test(devb):` | Adding or updating tests | `test(devb): add useDietStore unit tests` |
| `fix(devb):` | Bug fixes in Dev B domain | `fix(devb): correct calorie auto-calc formula` |
| `feat(deva):` | New feature (Dev A domain) | `feat(deva): implement set logging flow` |
| `chore:` | Setup, config, scaffolding | `chore: init Expo project and navigation` |
| `docs:` | Documentation updates | `docs: update AGENTS.md with media rules` |
| `refactor(devb):` | Refactoring without behavior change | `refactor(devb): extract macro calc to util` |

**Rules:**
- **One logical change per commit.** Never bundle a feature implementation and its tests in the same commit.
- **Reference the spec** in the commit body when implementing a spec requirement:
  ```
  feat(devb): add MealEntryCard with condition chip selection

  Refs: docs/specs/v1/features/macro-tracker.spec.md
  ```
- **Tag after every PR merge:** `git tag devb-feature-<name>-complete` — this is the rollback point.
- **Always branch from fresh main:** `git checkout main && git pull` before creating any new feature branch.
- **Broken branch recovery:** If a feature branch is broken beyond repair, `git checkout main` and open a new branch with a `-v2` suffix (e.g., `feature/devb-media-pipeline-v2`).
- **Use `npx expo install`** (not `npm install`) for all Expo/React Native packages to ensure version compatibility.

---

## 11. Agent Bug Fix & Verification Logging Rule

> [!IMPORTANT]
> **Mandatory Bug Resolution Documentation Rule**
> Every time an AI agent solves a bug and verifies that it is fixed (or when the user confirms the fix / moves to an unrelated task):
> 1. **Document the Action**: Log the exact root cause, action taken, and files modified in the project documentation ([walkthrough.md](walkthrough.md) and relevant docs under `docs/`).
> 2. **Run Full Test Suite**: Ensure all unit and integration tests are 100% passing (`npm test`).
> 3. **Commit and Sync**: Commit with conventional prefix (`fix(devb): ...` / `fix(deva): ...` / `docs: ...`) and sync to the main development branch.

