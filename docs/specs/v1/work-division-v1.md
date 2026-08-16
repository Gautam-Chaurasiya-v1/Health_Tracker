# V1 Work Division & Sprint Plan — 2 Developers

> **Phase:** V1 (Local-Only, No Backend)  
> **Team:** 2 Developers (Dev A & Dev B) working in parallel.

---

## 1. Domain Ownership Matrix

To eliminate merge conflicts, all mobile features and components are divided into two clear domains:

```
Health_Tracker/mobile/src/
├── screens/
│   ├── onboarding/       ← Dev B (First-launch, Profile, Goals setup)
│   ├── workout/          ← Dev A (WorkoutLogger, ExerciseLibrary, WorkoutHistory)
│   ├── diet/             ← Dev B (DietLog, MealEditor)
│   ├── progress/         ← Dev B (ProgressTimeline, PoseComparison)
│   └── settings/         ← Dev B (Preferences, DataExport)
├── components/
│   ├── workout/          ← Dev A (SetInputForm, SetRow, GhostBanner, ExerciseCard)
│   ├── diet/             ← Dev B (MacroProgressBar, MealEntryCard, ConditionChips)
│   ├── media/            ← Dev B (MediaPicker, ProgressPhotoCard, MediaThumbnail)
│   └── common/           ← Shared (Button, Stepper, Header, Card)
├── stores/
│   ├── useWorkoutStore   ← Dev A
│   ├── useGhostStore     ← Dev A
│   ├── useDietStore      ← Dev B
│   ├── usePreferencesStore ← Dev B
│   └── useMediaStore     ← Dev B
├── hooks/
│   ├── useGhostData      ← Dev A
│   ├── useMacroSummary   ← Dev B
│   └── useMediaStorage   ← Dev B
└── utils/
    ├── exportService.ts  ← Dev B (JSON/CSV backup & restore)
    └── dateHelpers.ts    ← Shared
```

---

## 2. Developer Assignments & Deliverables

### Developer A — Workout Engine & Progressive Overload Lead
**Focus:** Core training loop, high-speed set logging, ghost data cache, exercise library.

| Feature / Module | Files Owned | Description & Deliverables |
|---|---|---|
| **Base DB & Seeds** | `db/schema.js`, `data/exercises.json` | Initialize WatermelonDB SQLite models and seed 20+ global exercises. |
| **Workout Logger** | `screens/workout/WorkoutLogger.tsx`, `components/workout/SetInputForm.tsx`, `components/workout/SetRow.tsx` | 3-tap set logging loop (weight, reps, RIR 0–5 stepper, auto-fill from previous set). |
| **Ghost Data Engine** | `components/workout/GhostBanner.tsx`, `hooks/useGhostData.ts`, `stores/useGhostStore.ts` | < 50ms reactive query of previous session stats for progressive overload. |
| **Exercise Library** | `screens/workout/ExerciseLibrary.tsx`, `components/workout/ExerciseCard.tsx` | Searchable & muscle-group filtered exercise selector + custom exercise creator. |
| **Workout History** | `screens/workout/WorkoutHistory.tsx`, `screens/workout/SessionDetail.tsx` | Reverse-chronological session list with volume, set summaries, and notes. |

---

### Developer B — Nutrition, Media & Data Management Lead
**Focus:** Onboarding & preferences, macro tracking, photo/video pipeline, backup export.

| Feature / Module | Files Owned | Description & Deliverables |
|---|---|---|
| **Onboarding & Settings** | `screens/onboarding/Onboarding.tsx`, `stores/usePreferencesStore.ts` | First-launch wizard: name, weight unit (kg/lbs), auto-calculated macro goals. |
| **Diet & Macro Tracker** | `screens/diet/DietLog.tsx`, `components/diet/MealEntryCard.tsx`, `components/diet/MacroProgressBar.tsx` | Daily calorie/protein/carb/fat tracking, meal condition tags (`bloated`, `high_energy`, etc.). |
| **Media Capture Pipeline** | `components/media/MediaPicker.tsx`, `services/mediaStorage.ts`, `stores/useMediaStore.ts` | Camera/gallery picker with `react-native-compressor` (photos ≤10MB, videos ≤100MB) stored locally. |
| **Progress Timeline** | `screens/progress/ProgressTimeline.tsx`, `components/media/ProgressPhotoCard.tsx` | Chronological body photo timeline with pose filtering (front/side/back) and side-by-side comparison. |
| **Data Export & Import** | `screens/settings/DataExport.tsx`, `utils/exportService.ts`, `utils/importService.ts` | Full JSON backup/restore via native Share Sheet + CSV workout history export. |

---

## 3. Parallel 2-Week Sprint Schedule

### Sprint 1 (Week 1): Foundation & Core Feature Loops

| Day | Dev A (Workout & History) | Dev B (Diet, Onboarding & Media) |
|---|---|---|
| **Day 1** | **Joint Scaffolding:** Expo setup, Navigation tabs (`/workout`, `/diet`, `/progress`, `/settings`), Shared UI theme. |
| **Day 2** | WatermelonDB tables (`workout_sessions`, `exercises`, `sets`, `exercise_ghost_cache`) + exercise seed data. | WatermelonDB tables (`user_preferences`, `diet_logs`, `meal_entries`, `media_records`). |
| **Day 3** | `useWorkoutStore` + basic session start/finish flow. | `usePreferencesStore` + Onboarding setup screen (unit & goals). |
| **Day 4** | `SetInputForm` component (stepper, RIR 0–5, quick weight buttons). | `DietLog` screen layout + date navigation picker. |
| **Day 5** | `SetRow` component + auto-fill previous set logic. | `MealEntryCard` + auto-calorie calculation from macros. |
| **Day 6** | `GhostBanner` component + `useGhostData` hook (<50ms local reads). | `MacroProgressBar` component with color thresholds (<80%, 80-100%, >100%). |
| **Day 7** | **Integration Check 1:** End-to-end workout logging test + state persistence check. | **Integration Check 1:** End-to-end meal logging test + goal recalculation check. |

---

### Sprint 2 (Week 2): Media, History, Backup & Polish

| Day | Dev A (Workout & History) | Dev B (Diet, Onboarding & Media) |
|---|---|---|
| **Day 8** | `ExerciseLibrary` screen (search bar, muscle group chips, custom exercise creation). | `MediaPicker` component + compression pipeline (`react-native-compressor`). |
| **Day 9** | `WorkoutHistory` screen (past sessions list, volume calculations). | Local filesystem storage (`react-native-fs`) + `media_records` linking. |
| **Day 10** | `SessionDetail` screen (sets breakdown, condition tags review). | `ProgressTimeline` screen (pose filtering: front/side/back). |
| **Day 11** | Workout session condition tags selector (chips: `high_energy`, `fatigued`, etc.). | Side-by-side progress photo comparison screen. |
| **Day 12** | Workout unit/component tests (Jest + React Native Testing Library). | `exportService.ts` & `importService.ts` (JSON backup/restore + CSV export). |
| **Day 13** | Detox E2E tests: Start session → Log 3 sets → Check ghost data. | Detox E2E tests: Log meal → Check progress bars → Export JSON backup. |
| **Day 14** | **Joint Final Polish:** Theme styling, micro-animations, empty states, release bundle test. |

---

## 4. Conflict Prevention & Git Workflow

1. **Branching Convention**:
   - Dev A: `feature/deva-<feature-name>` (e.g., `feature/deva-workout-logger`)
   - Dev B: `feature/devb-<feature-name>` (e.g., `feature/devb-macro-tracker`)
2. **Shared Files Rule**:
   - Navigation (`navigation/RootNavigator.tsx`) and Theme tokens (`theme/`): changes must be coordinated via quick peer review before merging.
   - All feature screens and components reside in their dedicated subdirectories (`components/workout/` vs `components/diet/`).
3. **Database Migrations**:
   - Any modifications to `db/schema.js` require mutual agreement and a linked version bump.
4. **Pull Requests**:
   - Every PR requires the other developer's approval and green automated unit tests.
