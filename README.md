# GymTracker — Local-First Fitness & Nutrition Tracker (V1)

GymTracker is a high-performance, **local-first mobile fitness tracker** built with **React Native / Expo** and **WatermelonDB (SQLite)**.

> [!NOTE]
> **V1 Architecture**: Zero cloud dependencies, zero external servers, and zero authentication required. All workouts, macro logs, and progress photos live 100% locally on the user's device.

---

## 📱 Features

- **🏋️ Workout Engine (Dev A)**:
  - Fast logging flow (3-tap set logging: Weight, Reps, RIR 0–5).
  - Seeded exercise library with custom exercise creation.
  - Ghost performance banner with reactive previous-session targets.
  - Workout history with full session details and volume totals.

- **🥗 Nutrition & Macro Tracker (Dev B)**:
  - First-launch onboarding wizard (Display name, `kg`/`lbs` preference, starter macro calculation).
  - Daily diet log with date navigation and body weigh-in tracking.
  - Reactive daily macro progress bars (Calories, Protein, Carbs, Fats) with threshold color-coding.
  - Post-meal condition tagging (`high_energy`, `neutral`, `bloated`, `sluggish`, `brain_fog`).
  - Meal editor with automatic calorie calculation (`P*4 + C*4 + F*9`) and custom override.

- **📸 Local Media Pipeline & Progress Photos (Dev B)**:
  - Camera capture and gallery photo selection with automatic compression (`react-native-compressor`).
  - Strict storage protection (<500MB warning, <100MB block).
  - Body progress timeline with pose filtering (`Front`, `Side`, `Back`).
  - Side-by-side split-screen comparison mode for visual transformation tracking.

- **💾 Data Backup, Export & Restore (Dev B)**:
  - Full local JSON database backup and sharing via device Share Sheet.
  - Merge-based restore engine with UUID deduplication and 100-record batch writes (`database.batch()`).
  - Spreadsheet-ready CSV export for workout history analysis.

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+ recommended)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [Expo CLI](https://docs.expo.dev/)
- [iOS Simulator](https://developer.apple.com/xcode/) (macOS only) or [Android Studio Emulator](https://developer.android.com/studio) or [Expo Go](https://expo.dev/go) on a physical device.

---

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Gautam-Chaurasiya-v1/Health_Tracker.git
   cd Health_Tracker
   ```

2. Navigate to the mobile app directory and install dependencies:
   ```bash
   cd mobile
   npm install
   ```

---

## 🏃 Running the Application

From inside the `mobile/` directory:

| Platform | Command | Description |
|---|---|---|
| **Expo Dev Server** | `npm start` or `npx expo start` | Launches Metro bundler with QR code |
| **iOS Simulator** | `npm run ios` or `npx expo start --ios` | Launches app in Xcode iOS Simulator |
| **Android Emulator** | `npm run android` or `npx expo start --android` | Launches app in Android Emulator |
| **Web Browser** | `npm run web` or `npx expo start --web` | Runs app in local browser (with LokiJS DB) |

---

## 🧪 Running Automated Tests

Run the complete Jest unit and component test suite (27 suites, 113 tests):

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
    │   ├── db/                # WatermelonDB schema, models, database singleton, and seed service
    │   ├── navigation/        # RootNavigator, TabNavigator, stack types
    │   ├── screens/
    │   │   ├── onboarding/    # Onboarding wizard (Name, Unit, Goals)
    │   │   ├── diet/          # DietLog, MealEditorModal
    │   │   ├── progress/      # ProgressTimeline, ProgressComparison
    │   │   ├── settings/      # SettingsScreen, DataExport
    │   │   └── workout/       # WorkoutLogger, ExerciseLibrary, WorkoutHistory, SessionDetail
    │   ├── stores/            # Zustand stores (usePreferencesStore, useDietStore, useMediaStore, useWorkoutStore, useGhostStore)
    │   ├── services/          # Media filesystem storage & compression service
    │   └── utils/             # Data backup export & merge restore service
    └── tests/                 # 27 Jest test suites covering 100% of core features
```

---

## 📄 License

Private repository. All rights reserved.
