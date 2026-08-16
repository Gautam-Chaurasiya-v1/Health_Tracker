# Work Division Matrix — GymTracker Phase 1 MVP

> **Rule:** Each developer owns their designated directories. Cross-domain PRs require the other developer's review. No developer may commit to the other's domain directories.

---

## Domain Ownership Map

```
Health_Tracker/
├── backend/                        ← DEV 1 EXCLUSIVE
│   ├── src/
│   │   ├── routes/                 ← Dev 1
│   │   ├── services/               ← Dev 1
│   │   ├── middleware/             ← Dev 1
│   │   ├── workers/                ← Dev 1
│   │   ├── validators/             ← Dev 1
│   │   └── utils/                  ← Dev 1
│   ├── db/
│   │   ├── migrations/             ← Dev 1
│   │   └── seeds/                  ← Dev 1
│   └── tests/                      ← Dev 1
│
├── mobile/                         ← DEV 2 EXCLUSIVE
│   ├── src/
│   │   ├── screens/                ← Dev 2
│   │   ├── components/             ← Dev 2
│   │   ├── hooks/                  ← Dev 2
│   │   ├── stores/                 ← Dev 2
│   │   ├── navigation/             ← Dev 2
│   │   ├── services/               ← Dev 2  (API client wrappers)
│   │   └── utils/                  ← Dev 2
│   ├── db/                         ← Dev 2  (WatermelonDB schema/migrations)
│   └── tests/                      ← Dev 2
│
├── docs/                           ← ARCHITECT (both may READ)
│   └── specs/                      ← Architect + both for feature specs
│
└── shared/                         ← SHARED (requires BOTH approvals to change)
    └── types/                      ← TypeScript interfaces shared by both
        ├── entities.ts             ← DB entity types
        ├── api.ts                  ← Request/response types
        └── enums.ts                ← Shared enums (RIR, SyncStatus, etc.)
```

---

## Developer 1 — Backend / API / Infrastructure

### Domain
Backend services, database, API routes, authentication, job workers, media pipeline.

### Designated Directories
- `/backend/src/routes/`
- `/backend/src/services/`
- `/backend/src/middleware/`
- `/backend/src/workers/`
- `/backend/src/validators/`
- `/backend/db/migrations/`
- `/backend/db/seeds/`
- `/backend/tests/`

### Feature Ownership

| Feature | Files Owned | Deliverable |
|---------|-------------|-------------|
| **Auth** | `routes/auth.ts`, `services/auth.service.ts`, `middleware/jwt.guard.ts` | JWT issue/refresh, OAuth token storage |
| **Workout API** | `routes/workouts.ts`, `services/workout.service.ts` | CRUD for sessions, exercises, sets |
| **Ghost Data** | `services/ghost-cache.service.ts` | Pre-aggregated last-session snapshot per `(userId, exerciseId)` |
| **Sync Engine** | `routes/sync.ts`, `services/sync.service.ts` | `/sync/push`, `/sync/pull` endpoints with conflict resolution |
| **Diet API** | `routes/diet.ts`, `services/diet.service.ts` | Macro logging, weight logging |
| **Media Pipeline** | `routes/media.ts`, `workers/media-upload.worker.ts` | Presigned URL generation, BullMQ job, R2 upload confirmation |
| **Calendar Sync** | `workers/calendar-sync.worker.ts`, `services/google-calendar.service.ts` | BullMQ job, Google Calendar API integration |
| **DB Schema** | `db/migrations/*.sql` | All PostgreSQL migrations |
| **Rate Limiting** | `middleware/rate-limit.middleware.ts` | Per-route limiter config |

### Test Requirements
- Unit test coverage: **≥ 80%** per service file
- Integration tests: All route handlers (`/backend/tests/integration/`)
- Test runner: **Vitest**
- DB tests: Use **testcontainers** (spins up real PostgreSQL in Docker for tests)

### Branch Convention
`feature/dev1-<feature-name>` (e.g., `feature/dev1-auth`, `feature/dev1-ghost-data`)

---

## Developer 2 — Mobile Frontend / State / Client DB

### Domain
React Native screens, UI components, Zustand stores, WatermelonDB client schema, React Query hooks, navigation, E2E tests.

### Designated Directories
- `/mobile/src/screens/`
- `/mobile/src/components/`
- `/mobile/src/hooks/`
- `/mobile/src/stores/`
- `/mobile/src/navigation/`
- `/mobile/src/services/`  ← API client wrappers (calls Dev 1's endpoints)
- `/mobile/db/`
- `/mobile/tests/`

### Feature Ownership

| Feature | Files Owned | Deliverable |
|---------|-------------|-------------|
| **Workout Logger Screen** | `screens/WorkoutLogger.tsx`, `components/SetRow.tsx`, `components/SetInputForm.tsx` | 3-tap set logging UI with auto-fill |
| **Ghost Data Display** | `components/GhostBanner.tsx`, `hooks/useGhostData.ts` | Renders previous session data; reads from WatermelonDB ghost cache |
| **Exercise Library** | `screens/ExerciseLibrary.tsx`, `components/ExerciseCard.tsx` | Searchable exercise selector |
| **Diet Tracker Screen** | `screens/DietLog.tsx`, `components/MacroProgressBar.tsx`, `components/MealEntry.tsx` | Macro logging + progress bars |
| **Progress Media Screen** | `screens/ProgressTimeline.tsx`, `components/MediaPicker.tsx`, `components/ProgressPhotoCard.tsx` | Body photo timeline, media capture/select |
| **Workout Media** | `components/WorkoutMediaAttach.tsx` | Photo/video attach per workout/exercise |
| **Weekly Planner** | `screens/WeeklyPlanner.tsx`, `components/DayCard.tsx` | Drag-drop training split builder |
| **Calendar Sync UI** | `screens/Settings/CalendarSync.tsx` | OAuth flow trigger + sync status display |
| **WatermelonDB Schema** | `db/schema.js`, `db/migrations/` | Client-side DB schema mirroring server |
| **Sync Store** | `stores/useSyncStore.ts`, `services/syncService.ts` | Monitors connectivity, triggers sync, shows pending count |
| **Auth Screens** | `screens/Login.tsx`, `screens/Register.tsx` | Auth UI, token storage via `react-native-keychain` |

### Test Requirements
- Component tests: **React Native Testing Library** for all screen/component files
- Hook tests: Unit tests for all custom hooks in `/mobile/tests/unit/`
- E2E tests: **Detox** for critical paths (login → log set → view ghost data)
- Coverage target: **≥ 75%** for components and hooks

### Branch Convention
`feature/dev2-<feature-name>` (e.g., `feature/dev2-workout-logger`, `feature/dev2-ghost-ui`)

---

## Shared Interface Contract (`/shared/types/`)

> ⚠️ Changes to `/shared/types/` require **both developers to review and approve** the PR. This is the source of truth for API request/response shapes.

```typescript
// shared/types/enums.ts
export enum SyncStatus { PENDING = 'pending', SYNCED = 'synced', FAILED = 'failed' }
export enum MediaType { PHOTO = 'photo', VIDEO = 'video' }
export enum MealCondition { BLOATED = 'bloated', HIGH_ENERGY = 'high_energy', SLUGGISH = 'sluggish', BRAIN_FOG = 'brain_fog', NEUTRAL = 'neutral' }
export enum PoseType { FRONT = 'front', SIDE = 'side', BACK = 'back', SCAN = 'scan' }
export enum WorkoutCondition { HIGH_ENERGY = 'high_energy', FATIGUED = 'fatigued', JOINT_PAIN = 'joint_pain', POOR_SLEEP = 'poor_sleep', NORMAL = 'normal' }
```

---

## Sprint 1 — Parallel Work Plan (Week 1–2)

| Day | Dev 1 (Backend) | Dev 2 (Frontend) |
|-----|-----------------|------------------|
| 1–2 | DB migrations, PostgreSQL schema | WatermelonDB schema, navigation setup |
| 3–4 | Auth routes (register/login/refresh) | Auth screens (Login/Register) |
| 5–6 | Workout CRUD routes + Ghost Cache service | WorkoutLogger screen + SetInputForm component |
| 7–8 | Sync push/pull endpoints | Sync store + connectivity detection |
| 9–10 | Diet API routes | DietLog screen + MacroProgressBar |

## Sprint 2 — Parallel Work Plan (Week 3–4)

| Day | Dev 1 (Backend) | Dev 2 (Frontend) |
|-----|-----------------|------------------|
| 1–3 | Media presigned URL endpoint + BullMQ worker | MediaPicker component + offline media queue |
| 4–5 | Google Calendar OAuth + sync worker | CalendarSync settings screen + OAuth flow |
| 6–7 | Integration test suite | E2E Detox tests |
| 8–10 | Performance tuning, rate limiting audit | UI polish, animation, accessibility |

---

## Conflict Prevention Rules

1. **Never commit to the other's designated directories** without an approved cross-domain PR.
2. **Shared types changes:** Create a `chore/shared-types-<change>` branch, tag both for mandatory review.
3. **API contract changes:** Dev 1 updates `api-contract.yaml` first → Dev 2 reviews → both merge before implementation.
4. **Database schema changes:** Dev 1 creates migration → Dev 2 must update WatermelonDB schema within the same PR cycle (linked PRs).
5. **No direct commits to `main`.** All changes via PR with CI passing.
