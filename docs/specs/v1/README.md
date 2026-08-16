# V1 — Local-Only Mobile App

> **Decision Reference:** See `decisions/ADR-001-local-first-v1.md` for why V1 is local-only.

## Scope

V1 is a single-user, offline-only React Native fitness tracker. All data lives on the phone. No backend, no cloud, no login.

## Architecture

```
┌───────────────────────────────────────────────────┐
│            PHONE (React Native / Expo)             │
│                                                     │
│  ┌────────────┐  ┌─────────────────────────────┐  │
│  │  UI Layer  │  │  Zustand Stores              │  │
│  │  (Screens) │◄─┤  useWorkoutStore             │  │
│  │            │  │  useGhostStore               │  │
│  └─────┬──────┘  │  useDietStore                │  │
│        │         │  useMediaStore                │  │
│        │         └──────────┬──────────────────┘  │
│        │                    │                      │
│  ┌──────────────────────────────────────────────┐ │
│  │   WatermelonDB (SQLite) — ALL DATA HERE      │ │
│  │   exercises, workout_sessions, sets,          │ │
│  │   exercise_entries, exercise_ghost_cache,      │ │
│  │   diet_logs, meal_entries, media_records       │ │
│  └──────────────────────────────────────────────┘ │
│                                                     │
│  ┌──────────────────────────────────────────────┐ │
│  │  Local File Storage                           │ │
│  │  {AppDocumentsDir}/media/{uuid}.{ext}         │ │
│  └──────────────────────────────────────────────┘ │
│                                                     │
│  ┌──────────────────────────────────────────────┐ │
│  │  Export: JSON backup → Share Sheet / Files    │ │
│  └──────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────┘
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React Native (Expo) |
| Local DB | WatermelonDB (SQLite) |
| State Management | Zustand |
| Media Compression | react-native-compressor |
| File Storage | react-native-fs |
| Navigation | React Navigation |
| Testing | React Native Testing Library + Detox (E2E) |

## Features In Scope

| Feature | Spec File |
|---------|-----------|
| Workout Logger (sets/reps/weight/RIR) | `v1/features/workout-logger.spec.md` |
| Ghost Data (previous session display) | `v1/features/ghost-data.spec.md` |
| Macro & Diet Tracker | `v1/features/macro-tracker.spec.md` |
| Media Capture (local storage) | `v1/features/media-logging.spec.md` |
| Data Export & Import | `v1/features/data-export.spec.md` |
| Exercise Library (bundled seed data) | Included in workout-logger spec |

## Explicitly Out of Scope (V2)

- User authentication / login
- Backend server (Fastify, PostgreSQL, Redis)
- Cloud media storage (Cloudflare R2)
- Cross-device sync
- Google Calendar integration
- Multi-user support

## Directory Structure

```
Health_Tracker/
├── mobile/
│   ├── src/
│   │   ├── screens/          ← All app screens
│   │   ├── components/       ← Reusable UI components
│   │   ├── hooks/            ← Custom React hooks
│   │   ├── stores/           ← Zustand state stores
│   │   ├── navigation/       ← React Navigation config
│   │   ├── utils/            ← Helper functions
│   │   └── data/             ← Bundled exercise seed data (JSON)
│   ├── db/                   ← WatermelonDB schema + migrations
│   └── tests/                ← Unit, component, and E2E tests
│
├── shared/
│   └── types/
│       ├── entities.ts       ← DB entity types
│       └── enums.ts          ← Shared enums (MealCondition, PoseType, etc.)
│
└── docs/specs/               ← This specification directory
```

## Onboarding (No Auth)

Instead of login/register, V1 has a simple first-launch setup:
1. User enters display name
2. User selects weight unit (kg / lbs)
3. User sets macro goals (protein, carbs, fats, calories) — with smart defaults
4. Data stored in a local `user_preferences` WatermelonDB table
