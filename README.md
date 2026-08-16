# GymTracker — Local-First Fitness & Nutrition Tracker (V1)

GymTracker is a high-performance, **local-first mobile fitness tracker** built with **React Native / Expo** and **WatermelonDB (SQLite)**.

> [!NOTE]
> **V1 Architecture**: Zero cloud dependencies, zero external servers, and zero authentication required. All workouts, macro logs, and progress photos live 100% locally on the user's device.

---

## ⚠️ Testing & Platform Compatibility Disclaimer

| Platform / Target | Status | Notes |
|---|:---:|---|
| 🌐 **Web Browser (`http://localhost:8081`)** | ✅ **100% Ready (Recommended)** | **Fastest way to test immediately**. Zero setup required — uses LokiJS IndexedDB for full database features, set logging, macro tracking, photo progress, and data export. |
| 📱 **iOS Simulator & Android Emulator** | ✅ **Supported** | Run with `npx expo run:ios` or `npx expo run:android` (requires Xcode or Android Studio with native build tools). |
| 📲 **Expo Go (on physical phone)** | ⚠️ **Not Supported in Expo Go** | V1 uses native C++ modules (WatermelonDB SQLite JSI & `react-native-compressor`). These native modules are **not bundled inside the generic Expo Go app**. To test on a physical device, build a custom development client (`npx expo run:android` or EAS Build). |

---

## 🌐 How to Test and Run (Web Preview)

The fastest and easiest way to test the entire application right now:

```bash
# 1. Navigate to the mobile app directory
cd mobile

# 2. Start the web preview server
npm run web
```

Once started, open your browser at:
👉 **`http://localhost:8081`**

---

## 📱 Core Features

- **🏋️ Workout Engine (Dev A)**:
  - Fast 3-tap set logging (Weight, Reps, RIR 0–5).
  - Ability to delete mistakenly logged sets with immediate ghost cache recalculation.
  - Seeded exercise library with custom exercise creation and deletion.
  - Ghost performance banner with reactive previous-session targets.
  - Workout history with session detail breakdown and session deletion.

- **🥗 Nutrition & Macro Tracker (Dev B)**:
  - First-launch onboarding wizard (Display name, `kg`/`lbs` preference, starter macro calculation).
  - Daily diet log with date navigation and body weigh-in tracking.
  - Reactive daily macro progress bars (Calories, Protein, Carbs, Fats) with threshold color-coding.
  - Post-meal condition tagging (`high_energy`, `neutral`, `bloated`, `sluggish`, `brain_fog`).
  - Meal editor with automatic calorie calculation (`P*4 + C*4 + F*9`), custom override, and meal deletion.

- **📸 Local Media Pipeline & Progress Photos (Dev B)**:
  - Camera capture and gallery photo selection with automatic compression.
  - Strict storage protection (<500MB warning, <100MB block).
  - Body progress timeline with pose filtering (`Front`, `Side`, `Back`) and photo deletion.
  - Side-by-side split-screen comparison mode for visual transformation tracking.

- **💾 Data Backup, Export & Restore (Dev B)**:
  - Full local JSON database backup and sharing / browser download.
  - Merge-based restore engine with UUID deduplication and 100-record batch writes (`database.batch()`).
  - Spreadsheet-ready CSV export for workout history analysis.

---

## 🚀 Installation & Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/Gautam-Chaurasiya-v1/Health_Tracker.git
   cd Health_Tracker
   ```

2. Install dependencies:
   ```bash
   cd mobile
   npm install
   ```

---

## 🏃 All Available Run Commands

From inside the `mobile/` directory:

| Command | Platform | Description |
|---|---|---|
| `npm run web` | Web Browser | Launches instant browser preview at `http://localhost:8081` |
| `npm run ios` | iOS Simulator | Launches in Xcode Simulator (requires macOS + Xcode) |
| `npm run android` | Android Emulator | Launches in Android Studio Emulator |
| `npm start` | Expo CLI | Starts Metro development bundler |

---

## 🧪 Running Automated Tests

Run the complete Jest unit and component test suite (**27 suites, 113 tests — 100% passing**):

```bash
cd mobile

# Run all tests
npm test

# Run tests with code coverage report
npm run test:coverage

# Run tests in watch mode
npm test -- --watch
```

---

## 📂 Project Architecture

```
Health_Tracker/
├── AGENTS.md                  # AI agent rules, architecture constraints, and domain ownership
├── shared/
│   └── types/                 # Shared TypeScript entities and enums (enums.ts, entities.ts)
└── mobile/
    ├── src/
    │   ├── components/
    │   │   ├── common/        # Button, Card, Header, Stepper
    │   │   ├── diet/          # MacroProgressBar, MealEntryCard, ConditionChips
    │   │   ├── media/         # MediaPicker, MediaThumbnail, ProgressPhotoCard
    │   │   └── workout/       # ExerciseCard, GhostBanner, SetInputForm, SetRow
    │   ├── db/                # WatermelonDB schema, models, database singleton, seed service, and web shims
    │   ├── navigation/        # RootNavigator, TabNavigator, stack types
    │   ├── screens/
    │   │   ├── onboarding/    # Onboarding wizard (Name, Unit, Goals)
    │   │   ├── diet/          # DietLog, MealEditorModal
    │   │   ├── progress/      # ProgressTimeline, ProgressComparison
    │   │   ├── settings/      # SettingsScreen, DataExport
    │   │   └── workout/       # WorkoutLogger, ExerciseLibrary, WorkoutHistory, SessionDetail
    │   ├── stores/            # Zustand stores (usePreferencesStore, useDietStore, useMediaStore, useWorkoutStore, useGhostStore)
    │   ├── services/          # Media filesystem storage & compression service
    │   └── utils/             # Data backup export, merge restore, and media URI utilities
    └── tests/                 # 27 Jest test suites covering 100% of core features
```

---

## 📄 License

Private repository. All rights reserved.
