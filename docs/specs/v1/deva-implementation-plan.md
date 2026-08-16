# Dev A — V1 Implementation Plan
## GymTracker: Workout Engine & Progressive Overload

> **Role:** Dev A (you are implementing this)  
> **Phase:** V1 — Local-only, No Backend  
> **Stack:** React Native (Expo) + WatermelonDB + Zustand  
> **Rules:** Read `agent.md` (repo root) before writing a single line of code.  
> **Spec files:** All under `docs/specs/v1/`

---

## Handover Guide for Implementing Agent

You are an **implementing agent**. Your job is to write code **exactly** as specified, feature by feature, one branch at a time.

After completing each feature:
1. Run tests → confirm they pass
2. Run `npx tsc --noEmit` → zero errors
3. Commit with exact commit message format from `agent.md`
4. Push the branch to remote
5. Move to the next feature

**Do not skip ahead. Do not combine features. Do not merge to `brainstorm` without passing tests.**

---

## Prerequisites (Read First)

- `docs/specs/v1/features/workout-logger.spec.md`
- `docs/specs/v1/features/ghost-data.spec.md`
- `docs/specs/v1/watermelondb-schema.js` — DB schema reference
- `docs/specs/v1/work-division-v1.md` — domain ownership
- `agent.md` (root) — git rules and forbidden actions

---

## Feature Execution Order

```
F0 → F1 → F2 → F3 → F4
│     │     │    │    └─ Workout History (SessionList + SessionDetail)
│     │     │    └────── Exercise Library (Search + Filter + Custom)
│     │     └─────────── Ghost Data Engine (< 50ms cache)
│     └───────────────── Workout Logger Core (3-tap set loop)
└─────────────────────── Project Scaffold + DB Schema
```

Each feature = separate git branch + separate PR.

---

# F0: Project Scaffold + DB Schema

**Branch:** `feature/deva-scaffold-db`  
**Goal:** Expo project running, WatermelonDB wired up, all Dev A tables created, exercise seed data loaded.

## Files to Create

```
mobile/
├── db/
│   └── schema.ts                        ← WatermelonDB schema (Dev A tables only)
├── src/
│   ├── db/
│   │   ├── index.ts                     ← DB singleton
│   │   └── models/
│   │       ├── Exercise.ts
│   │       ├── WorkoutSession.ts
│   │       ├── ExerciseEntry.ts
│   │       ├── Set.ts
│   │       └── ExerciseGhostCache.ts
│   ├── data/
│   │   └── exercises.json               ← 20+ seed exercises
│   └── db/
│       └── seedService.ts               ← Seeds exercises on first launch
shared/
└── types/
    ├── entities.ts
    └── enums.ts
mobile/tests/
└── unit/db/
    └── seed.test.ts
```

## Install Dependencies

```bash
cd mobile
npx expo install @nozbe/watermelondb
npx expo install @nozbe/with-observables
npm install zustand uuid date-fns
npm install @types/uuid --save-dev
```

## `mobile/db/schema.ts`

```typescript
import { appSchema, tableSchema } from '@nozbe/watermelondb';

export const schema = appSchema({
  version: 1,
  tables: [
    tableSchema({
      name: 'exercises',
      columns: [
        { name: 'name',         type: 'string' },
        { name: 'muscle_group', type: 'string' },
        { name: 'equipment',    type: 'string', isOptional: true },
        { name: 'is_custom',    type: 'boolean' },
        { name: 'created_at',   type: 'number' },
      ],
    }),
    tableSchema({
      name: 'exercise_ghost_cache',
      columns: [
        { name: 'exercise_id',   type: 'string' },
        { name: 'session_date',  type: 'string' },
        { name: 'sets_snapshot', type: 'string' },
        { name: 'total_volume',  type: 'number' },
        { name: 'updated_at',    type: 'number' },
      ],
    }),
    tableSchema({
      name: 'workout_sessions',
      columns: [
        { name: 'client_uuid',      type: 'string' },
        { name: 'date',             type: 'string' },
        { name: 'started_at',       type: 'number' },
        { name: 'finished_at',      type: 'number', isOptional: true },
        { name: 'notes',            type: 'string', isOptional: true },
        { name: 'condition_tags',   type: 'string', isOptional: true },
        { name: 'client_timestamp', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'exercise_entries',
      columns: [
        { name: 'client_uuid',  type: 'string' },
        { name: 'session_id',   type: 'string' },
        { name: 'exercise_id',  type: 'string' },
        { name: 'order_index',  type: 'number' },
      ],
    }),
    tableSchema({
      name: 'sets',
      columns: [
        { name: 'client_uuid',      type: 'string' },
        { name: 'entry_id',         type: 'string' },
        { name: 'set_number',       type: 'number' },
        { name: 'weight',           type: 'number' },
        { name: 'reps',             type: 'number' },
        { name: 'rir',              type: 'number' },
        { name: 'notes',            type: 'string', isOptional: true },
        { name: 'client_timestamp', type: 'number' },
      ],
    }),
    // DEV B TABLES ADDED HERE DURING MERGE
  ],
});
```

## `shared/types/entities.ts`

```typescript
export interface GhostSnapshot {
  sessionDate: string;
  sets: Array<{ setNumber: number; weight: number; reps: number; rir: number }>;
  totalVolume: number;
}
```

## `shared/types/enums.ts`

```typescript
export enum WorkoutCondition {
  HIGH_ENERGY = 'high_energy',
  FATIGUED    = 'fatigued',
  JOINT_PAIN  = 'joint_pain',
  POOR_SLEEP  = 'poor_sleep',
  NORMAL      = 'normal',
}
export enum WeightUnit { KG = 'kg', LBS = 'lbs' }
// Dev B adds MealCondition, PoseType here — do NOT add them yourself
```

## `mobile/src/data/exercises.json`

```json
[
  { "name": "Barbell Back Squat",    "muscle_group": "quads",      "equipment": "barbell"    },
  { "name": "Romanian Deadlift",     "muscle_group": "hamstrings", "equipment": "barbell"    },
  { "name": "Barbell Bench Press",   "muscle_group": "chest",      "equipment": "barbell"    },
  { "name": "Incline Dumbbell Press","muscle_group": "chest",      "equipment": "dumbbell"   },
  { "name": "Barbell Row",           "muscle_group": "back",       "equipment": "barbell"    },
  { "name": "Lat Pulldown",          "muscle_group": "back",       "equipment": "cable"      },
  { "name": "Overhead Press",        "muscle_group": "shoulders",  "equipment": "barbell"    },
  { "name": "Lateral Raise",         "muscle_group": "shoulders",  "equipment": "dumbbell"   },
  { "name": "Barbell Curl",          "muscle_group": "biceps",     "equipment": "barbell"    },
  { "name": "Tricep Pushdown",       "muscle_group": "triceps",    "equipment": "cable"      },
  { "name": "Leg Press",             "muscle_group": "quads",      "equipment": "machine"    },
  { "name": "Leg Curl",              "muscle_group": "hamstrings", "equipment": "machine"    },
  { "name": "Calf Raise",            "muscle_group": "calves",     "equipment": "machine"    },
  { "name": "Pull Up",               "muscle_group": "back",       "equipment": "bodyweight" },
  { "name": "Dip",                   "muscle_group": "triceps",    "equipment": "bodyweight" },
  { "name": "Cable Fly",             "muscle_group": "chest",      "equipment": "cable"      },
  { "name": "Face Pull",             "muscle_group": "rear_delt",  "equipment": "cable"      },
  { "name": "Hack Squat",            "muscle_group": "quads",      "equipment": "machine"    },
  { "name": "Hip Thrust",            "muscle_group": "glutes",     "equipment": "barbell"    },
  { "name": "Seated Cable Row",      "muscle_group": "back",       "equipment": "cable"      }
]
```

## `seedService.ts`

```typescript
// Runs on first app launch. Checks if exercises table is empty.
// If empty: inserts all 20 exercises from exercises.json.
// If not empty: skips (idempotent).
export async function seedExercisesIfEmpty(db: Database): Promise<void> {
  const count = await db.collections.get<Exercise>('exercises').query().fetchCount();
  if (count > 0) return;
  await db.write(async () => {
    for (const ex of exerciseSeedData) {
      await db.collections.get('exercises').create(record => {
        record.name        = ex.name;
        record.muscleGroup = ex.muscle_group;
        record.equipment   = ex.equipment ?? '';
        record.isCustom    = false;
        record.createdAt   = Date.now();
      });
    }
  });
}
```

## Tests

**`seed.test.ts`:**
```
✓ seedExercisesIfEmpty() inserts 20 exercises on empty DB
✓ seedExercisesIfEmpty() is idempotent (second call: still 20, not 40)
✓ All seeded exercises have a non-empty muscle_group
```

## Commit Sequence

```bash
git commit -m "feat(db): initialize WatermelonDB schema with Dev A tables"
git commit -m "feat(db): add WatermelonDB model classes for all Dev A entities"
git commit -m "feat(db): add exercise seed data (20 exercises)"
git commit -m "feat(db): add seedService with idempotent first-launch seeding"
git commit -m "feat(shared): add GhostSnapshot type and WorkoutCondition enum"
git commit -m "test(db): add seed idempotency and validation tests"
git push origin feature/deva-scaffold-db
```

---

# F1: Workout Logger Core

**Branch:** `feature/deva-workout-logger`  
**Spec:** `docs/specs/v1/features/workout-logger.spec.md`  
**Goal:** Working 3-tap set logging loop with auto-fill, RIR stepper.

> Start from `brainstorm` after F0 is merged: `git checkout brainstorm && git pull && git checkout -b feature/deva-workout-logger`

## Files to Create

```
mobile/src/
├── stores/useWorkoutStore.ts
├── components/common/Stepper.tsx          ← Shared (+/-) stepper component
├── components/workout/SetInputForm.tsx
├── components/workout/SetRow.tsx
└── screens/workout/WorkoutLogger.tsx
mobile/tests/
├── unit/workout/useWorkoutStore.test.ts
└── components/workout/
    ├── SetInputForm.test.tsx
    └── SetRow.test.tsx
```

## `useWorkoutStore.ts` — Zustand Store

```typescript
interface WorkoutStore {
  activeSessionId: string | null;
  activeExerciseEntryId: string | null;
  startSession:      (date: string) => Promise<string>;
  finishSession:     (sessionId: string) => Promise<void>;
  addExerciseEntry:  (sessionId: string, exerciseId: string) => Promise<string>;
  logSet:            (entryId: string, exerciseId: string, data: SetData) => Promise<void>;
  updateNotes:       (sessionId: string, notes: string) => Promise<void>;
  setConditionTags:  (sessionId: string, tags: WorkoutCondition[]) => Promise<void>;
}

interface SetData { weight: number; reps: number; rir: number; }
```

**Validation in `logSet`:**
```typescript
if (rir < 0 || rir > 5) throw new Error('RIR must be between 0 and 5');
if (reps < 1 || reps > 100) throw new Error('Reps must be 1-100');
if (weight < 0) throw new Error('Weight cannot be negative');
```

All DB writes: `await database.write(async () => { ... })`

`logSet` also calls `useGhostStore.updateGhostCache()` — import from `useGhostStore` (implement stub for F1, replace in F2).

## `Stepper.tsx` — Common Component

```typescript
// Props: { value: number, min: number, max: number, onChange: (v: number) => void, step?: number }
// UI: Pressable [-] + Text[value] + Pressable [+]
// Never goes below min or above max
// No keyboard input — tap only
```

## `SetInputForm.tsx`

```typescript
// Props:
interface SetInputFormProps {
  previousSet: { weight: number; reps: number; rir: number } | null;
  weightUnit: 'kg' | 'lbs';
  onConfirm: (data: { weight: number; reps: number; rir: number }) => void;
}

// Initial state:
const [weight, setWeight] = useState(previousSet?.weight ?? 0);
const [reps,   setReps]   = useState(previousSet?.reps ?? 5);
const [rir,    setRir]     = useState(previousSet?.rir ?? 2);

// Debounce: use useRef to track last confirm timestamp
// If tapped within 300ms of last confirm: ignore
```

**UI layout (top to bottom):**
1. Weight: `TextInput (numeric keyboard)` + `[−2.5]` `[+2.5]` buttons
2. Reps: `<Stepper min={1} max={100} />`
3. RIR: `<Stepper min={0} max={5} />` — label "Reps in Reserve"
4. `[✓ Log Set]` button — disabled when `weight === 0`

## `SetRow.tsx`

```typescript
// Props: { set: { setNumber, weight, reps, rir }, weightUnit: 'kg' | 'lbs' }
// Display: "Set 1 — 100 kg × 8 reps @ 2 RIR"
```

## `WorkoutLogger.tsx`

```typescript
// Header: exercise name + date
// <GhostBanner exerciseId={...} /> — STUB: just render null for F1, replace in F2
// <FlatList data={loggedSets} renderItem={<SetRow />} />
// <SetInputForm previousSet={lastSet} onConfirm={handleLogSet} />
// [+ Add Exercise] → navigate('ExerciseLibrary') — STUB nav
// [Finish Workout] → workoutStore.finishSession(sessionId)
```

## All Tests for F1

**`SetInputForm.test.tsx`:**
```
✓ Renders with previousSet values pre-filled
✓ Renders defaults (weight=0, reps=5, rir=2) when previousSet is null
✓ RIR stepper cannot go below 0
✓ RIR stepper cannot go above 5
✓ Reps stepper cannot go below 1
✓ Reps stepper cannot go above 100
✓ Confirm button disabled when weight = 0
✓ Confirm button enabled when weight > 0
✓ onConfirm called with correct { weight, reps, rir }
✓ Second confirm tap within 300ms does NOT fire onConfirm again
```

**`useWorkoutStore.test.ts`:**
```
✓ startSession() creates a WorkoutSession in DB with correct date
✓ logSet() writes Set to DB with correct entry_id
✓ logSet() throws when rir = 6
✓ logSet() throws when rir = -1
✓ logSet() does NOT throw when rir = 0 or rir = 5
✓ finishSession() sets finished_at to current timestamp
✓ setConditionTags() accepts up to 10 tags
✓ setConditionTags() truncates/rejects more than 10 tags
```

## Commit Sequence

```bash
git commit -m "feat(workout): add useWorkoutStore with session lifecycle actions"
git commit -m "feat(workout): add Stepper common component with min/max bounds"
git commit -m "feat(workout): add SetInputForm with 3-tap logic and RIR stepper"
git commit -m "feat(workout): add SetRow display component"
git commit -m "feat(workout): add WorkoutLogger screen with stub GhostBanner"
git commit -m "test(workout): add SetInputForm component tests (10 cases)"
git commit -m "test(workout): add useWorkoutStore unit tests (8 cases)"
git push origin feature/deva-workout-logger
```

---

# F2: Ghost Data Engine

**Branch:** `feature/deva-ghost-data`  
**Spec:** `docs/specs/v1/features/ghost-data.spec.md`  
**Goal:** Instant (< 50ms) previous-session display per exercise. Replaces F1 stub.

> Start from `brainstorm` after F1 is merged.

## Files to Create

```
mobile/src/
├── stores/useGhostStore.ts
├── hooks/useGhostData.ts
└── components/workout/GhostBanner.tsx
mobile/tests/
├── unit/workout/useGhostData.test.ts
└── components/workout/GhostBanner.test.tsx
```

## `useGhostStore.ts`

```typescript
interface GhostStore {
  cache: Record<string, GhostSnapshot>;  // key = exerciseId
  updateCache: (exerciseId: string, snap: GhostSnapshot) => void;
  getSnapshot: (exerciseId: string) => GhostSnapshot | null;
}
```

## Ghost Cache Update (in `useWorkoutStore.logSet`)

After writing the set to DB, call:
```typescript
// 1. Fetch all sets for this entry from DB
// 2. Build GhostSnapshot:
//    sessionDate = today ISO
//    sets = mapped array sorted by set_number
//    totalVolume = sum(weight * reps)
// 3. Check existing cache: only update if new sessionDate >= cached date
// 4. Upsert exercise_ghost_cache in WatermelonDB
// 5. Update in-memory Zustand useGhostStore.updateCache(exerciseId, snapshot)
```

## `useGhostData.ts` Hook

```typescript
function useGhostData(exerciseId: string): GhostSnapshot | null {
  // Step 1: Check Zustand in-memory cache first (< 1ms)
  const memCached = useGhostStore.getState().getSnapshot(exerciseId);
  if (memCached) return memCached; // fast path

  // Step 2: Reactive WatermelonDB query (< 50ms)
  // Use withObservables to subscribe to exercise_ghost_cache WHERE exercise_id = exerciseId
  // Parse sets_snapshot JSON → GhostSnapshot
  // Hydrate Zustand cache with result
  // Return snapshot or null
}
```

## `GhostBanner.tsx`

```typescript
// Props: { exerciseId: string, weightUnit: 'kg' | 'lbs' }
// Uses useGhostData(exerciseId)
//
// if snapshot === null:
//   render Text: "No previous data — first time logging this exercise"
//
// if snapshot exists:
//   render "Last Session ({formatDate(snapshot.sessionDate)})"
//   For each set: "Set N: {weight}{unit} × {reps} @ {rir} RIR"
//   render "Total Volume: {totalVolume}{unit}"
//
// NO loading spinner — data is always synchronous/local
```

**Date formatting (install `date-fns`):**
```typescript
function formatSessionDate(isoDate: string): string {
  const diff = differenceInCalendarDays(new Date(), parseISO(isoDate));
  if (diff <= 7)  return 'Last Week';
  if (diff <= 14) return '2 Weeks Ago';
  if (diff <= 30) return `${Math.ceil(diff / 7)} Weeks Ago`;
  return format(parseISO(isoDate), 'MMM d');
}
```

Also: in `WorkoutLogger.tsx` replace the stub with `<GhostBanner exerciseId={activeExerciseId} weightUnit={...} />`.

## All Tests for F2

**`useGhostData.test.ts`:**
```
✓ Returns null when no cache entry exists
✓ Returns GhostSnapshot when cache entry exists
✓ Correctly parses sets_snapshot JSON string
✓ Reactively updates when WatermelonDB cache record changes
✓ Returns data within 50ms (mock DB, Date.now() timing assertion)
✓ Does NOT update cache if new sessionDate < cached sessionDate
✓ DOES update cache if new sessionDate === cached sessionDate (same-day)
✓ DOES update cache if new sessionDate > cached sessionDate
```

**`GhostBanner.test.tsx`:**
```
✓ Renders empty state text when snapshot is null
✓ Does NOT render any loading/spinner element
✓ Renders correct text for all 3 sets of a snapshot
✓ Shows "Last Week" for a session 7 days ago
✓ Shows "2 Weeks Ago" for a session 14 days ago
✓ Shows "Aug 9" format for a session > 30 days ago
✓ Correctly calculates and renders total volume
```

## Commit Sequence

```bash
git commit -m "feat(ghost): add useGhostStore in-memory snapshot cache"
git commit -m "feat(ghost): add useGhostData hook with WatermelonDB reactive query"
git commit -m "feat(ghost): add ghost cache update logic inside useWorkoutStore.logSet"
git commit -m "feat(ghost): add GhostBanner component with date formatting"
git commit -m "feat(workout): replace WorkoutLogger stub GhostBanner with real component"
git commit -m "test(ghost): add useGhostData hook tests with 50ms timing assertion"
git commit -m "test(ghost): add GhostBanner component tests"
git push origin feature/deva-ghost-data
```

---

# F3: Exercise Library

**Branch:** `feature/deva-exercise-library`  
**Spec:** `docs/specs/v1/features/workout-logger.spec.md` (Exercise section)  
**Goal:** Searchable + filterable exercise picker + custom exercise creation.

> Start from `brainstorm` after F2 is merged.

## Files to Create

```
mobile/src/
├── screens/workout/ExerciseLibrary.tsx
└── components/workout/ExerciseCard.tsx
mobile/tests/components/workout/
├── ExerciseLibrary.test.tsx
└── ExerciseCard.test.tsx
```

## `ExerciseLibrary.tsx`

Features:
1. **Search bar** at top — debounced (200ms), filters by `name` (case-insensitive)
2. **Muscle group chips** — horizontal scrollable row:
   `all | quads | hamstrings | chest | back | shoulders | biceps | triceps | calves | glutes | rear_delt`
3. **FlatList** of `ExerciseCard` components (reactive WatermelonDB query)
4. **FAB button `+`** → bottom sheet / modal for custom exercise:
   - Required: name, muscle_group (dropdown)
   - Optional: equipment
   - On save: `database.write(() => exercises.create(...))`  with `is_custom: true`
5. On `ExerciseCard` press → call `workoutStore.addExerciseEntry(sessionId, exercise.id)` then navigate back

## `ExerciseCard.tsx`

```typescript
// Props: { exercise: { id, name, muscle_group, equipment, is_custom }, onPress: () => void }
// Display:
//   Name (bold, large)
//   "{muscle_group}  ·  {equipment}" (subtitle, smaller, gray)
//   If is_custom: "[Custom]" badge (right side)
```

## All Tests for F3

**`ExerciseLibrary.test.tsx`:**
```
✓ Renders all 20 seeded exercises on load with no filter
✓ Search "squat" shows only exercises with "squat" in name
✓ Search is case-insensitive ("SQUAT" matches "Barbell Back Squat")
✓ Muscle group chip "chest" shows only chest exercises
✓ Muscle group chip "all" resets filter
✓ Custom exercise modal has name, muscle_group, equipment fields
✓ Saving custom exercise creates DB record with is_custom = true
✓ Selecting an exercise calls addExerciseEntry and navigates back
```

**`ExerciseCard.test.tsx`:**
```
✓ Renders exercise name
✓ Renders muscle_group and equipment subtitle
✓ Shows [Custom] badge when is_custom is true
✓ Does NOT show [Custom] badge when is_custom is false
✓ onPress fires when card tapped
```

## Commit Sequence

```bash
git commit -m "feat(exercise): add ExerciseCard component with custom badge"
git commit -m "feat(exercise): add ExerciseLibrary screen with search and muscle group chips"
git commit -m "feat(exercise): add custom exercise creation modal"
git commit -m "test(exercise): add ExerciseCard component tests"
git commit -m "test(exercise): add ExerciseLibrary screen tests"
git push origin feature/deva-exercise-library
```

---

# F4: Workout History

**Branch:** `feature/deva-workout-history`  
**Spec:** `docs/specs/v1/work-division-v1.md` (Dev A table: WorkoutHistory + SessionDetail)  
**Goal:** Reverse-chronological past session list + full session detail view.

> Start from `brainstorm` after F3 is merged.

## Files to Create

```
mobile/src/screens/workout/
├── WorkoutHistory.tsx
└── SessionDetail.tsx
mobile/tests/components/workout/
├── WorkoutHistory.test.tsx
└── SessionDetail.test.tsx
```

## `WorkoutHistory.tsx`

```typescript
// Reactive WatermelonDB query: workout_sessions ORDER BY date DESC
// Each list item shows:
//   - Date: "Aug 16, 2026" (date-fns format: 'MMM d, yyyy')
//   - Duration: "1h 15m" (if finishedAt exists) or "In Progress"
//   - Exercises: "Squat, Bench Press, Row" (comma-joined exercise names)
//   - Total Volume: sum of weight × reps across all sets
//   - Condition tags chips (read-only, non-tappable)
// Tap → navigate to SessionDetail with sessionId param
// Empty state: "No workouts yet. Start your first session!"
```

## `SessionDetail.tsx`

```typescript
// Receives: sessionId via navigation params
// Loads: session + exercise_entries + sets (all local WatermelonDB queries)
// Shows:
//   Header: date + duration
//   For each exercise entry:
//     Exercise name
//     Each set: "Set N:  {weight}{unit} × {reps}  @  {rir} RIR"
//   Session notes (if present)
//   Condition tags (read-only chips)
//   Total Volume per exercise + Grand Total
```

## All Tests for F4

**`WorkoutHistory.test.tsx`:**
```
✓ Shows empty state when no sessions exist
✓ Renders sessions ordered newest first
✓ Calculates and displays correct total volume
✓ Shows "In Progress" when session has no finishedAt
✓ Shows formatted date "Aug 16, 2026"
✓ Shows condition tags as chips
```

**`SessionDetail.test.tsx`:**
```
✓ Renders exercise name for each exercise entry
✓ Renders all sets for each exercise in correct format
✓ Shows session notes when present
✓ Does not show notes section when notes is null/empty
✓ Calculates correct total volume per exercise
✓ Calculates correct grand total volume
```

## Commit Sequence

```bash
git commit -m "feat(history): add WorkoutHistory screen with session list and volume"
git commit -m "feat(history): add SessionDetail screen with full set breakdown"
git commit -m "test(history): add WorkoutHistory screen tests"
git commit -m "test(history): add SessionDetail screen tests"
git push origin feature/deva-workout-history
```

---

## Final Gate Before Any PR Merge to `brainstorm`

Run all of these from `mobile/`:

```bash
# 1. TypeScript — must be zero errors
npx tsc --noEmit

# 2. Lint — must be zero errors
npx eslint src/ --ext .ts,.tsx

# 3. Tests — must all pass
npm test -- --testPathPattern="workout|ghost|exercise|history" --coverage

# 4. Coverage — must be ≥ 75% for Dev A files
npm test -- --coverage --coveragePathPattern="workout|ghost|exercise|history"
```

---

## PR Description Template

```markdown
## Feature: [F0 | F1 | F2 | F3 | F4] — [Feature Name]

## Spec Reference
docs/specs/v1/features/<spec-file>.spec.md

## Acceptance Criteria Completed
- [ ] [criterion from spec]

## Tests Added
- Unit: [list files]
- Component: [list files]

## Schema Changed?
[ ] No   [ ] Yes — migration added at version X

## TypeScript Clean?
[ ] npx tsc --noEmit — PASSED

## Forbidden Actions Confirmed?
[ ] No force pushes
[ ] No direct commits to brainstorm
[ ] No @ts-ignore
[ ] No .env committed
```
