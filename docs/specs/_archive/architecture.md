# System Architecture & Data Flow — GymTracker MVP

## 1. High-Level Component Map

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT (React Native / Expo)                │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │  UI Layer    │  │ Zustand Store│  │  React Query (server     │  │
│  │ (Screens /   │◄─┤ (local state)│  │  state cache + sync)     │  │
│  │  Components) │  └──────┬───────┘  └──────────┬───────────────┘  │
│  └──────┬───────┘         │                      │                  │
│         │                 ▼                      ▼                  │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │              WatermelonDB (SQLite — offline-first local DB)  │   │
│  │  Tables: workout_sessions, exercise_entries, sets,           │   │
│  │          diet_logs, macro_entries, progress_media,           │   │
│  │          exercise_ghost_cache, sync_queue                    │   │
│  └──────────────────────────┬───────────────────────────────────┘   │
│                             │  (Sync when online)                   │
└─────────────────────────────┼───────────────────────────────────────┘
                              │ HTTPS / REST
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     BACKEND (Node.js / Fastify)                     │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │  Auth Routes │  │  API Routes  │  │  Sync Routes             │  │
│  │  /auth/*     │  │  /workouts   │  │  /sync/pull /sync/push   │  │
│  │  JWT + OAuth │  │  /diet       │  │                          │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────────┘  │
│         │                 │                      │                  │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                     Middleware Layer                         │   │
│  │   Rate Limiting │ Zod Validation │ JWT Guard │ Error Handler │   │
│  └──────────────────────────┬───────────────────────────────────┘   │
│                             │                                        │
│           ┌─────────────────┼──────────────────┐                    │
│           ▼                 ▼                  ▼                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │  PostgreSQL  │  │    Redis     │  │  BullMQ Job Queue        │  │
│  │  (Primary DB)│  │  (Cache +    │  │  - media-upload worker   │  │
│  │              │  │   Queue      │  │  - calendar-sync worker  │  │
│  └──────────────┘  │   Backing)   │  │  - gcal-token-refresh    │  │
│                    └──────────────┘  └──────────────────────────┘  │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │               Cloudflare R2 (Object Storage)                 │   │
│  │   Buckets: /workout-media/{userId}/  /progress-media/{userId}│   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                 ┌────────────────────────┐
                 │  Google Calendar API   │
                 │  (OAuth 2.0 events     │
                 │   scope)               │
                 └────────────────────────┘
```

---

## 2. Service Boundaries

| Service | Responsibility | Technology |
|---------|---------------|------------|
| **API Server** | Business logic, validation, auth | Node.js + Fastify |
| **Local DB** | Offline storage, reactive queries, sync queue | WatermelonDB (SQLite) |
| **Server DB** | Source of truth, Ghost Data queries, user data | PostgreSQL 15 |
| **Cache** | Rate limit counters, session invalidation lists | Redis 7 |
| **Job Queue** | Async media uploads, Google Calendar sync | BullMQ on Redis |
| **Object Storage** | User media files (photos/videos) | Cloudflare R2 |
| **External Auth** | Google Calendar OAuth 2.0 | Google OAuth 2.0 |

---

## 3. Data Flow — Critical Paths

### 3.1 Logging a Set (Online)
```
User Taps "+ Set"
  → Zustand: pre-fill weight/reps from previous set
  → User adjusts RIR (stepper 0–5)
  → Taps "✓ Confirm"
  → WatermelonDB: INSERT set record (sync_status: 'pending')
  → Zustand: update ghost_cache for exerciseId
  → Background SyncWorker: POST /sync/push → server upserts by client_uuid
  → WatermelonDB: update sync_status: 'synced'
```

### 3.2 Logging a Set (Offline)
```
User Taps "+ Set" → (no network)
  → WatermelonDB: INSERT set (sync_status: 'pending', client_uuid: uuid())
  → Ghost cache updated locally
  [... user finishes workout offline ...]
  → Network restored → SyncWorker wakes
  → Batch POST /sync/push with all pending events
  → Server applies, returns merged state
  → Client reconciles local records
```

### 3.3 Ghost Data Retrieval
```
User opens ExerciseLogger screen
  → React Query: queryKey ['ghost', userId, exerciseId]
  → WatermelonDB.collections.exercise_ghost_cache
      .query(Q.where('exercise_id', exerciseId))
      .fetch()
  → Render: "Last Session: 225 lbs × 8 @ 2 RIR"
  → Latency target: < 50ms (local only, no network call)
```

### 3.4 Media Upload (Workout Photo)
```
User taps "Add Photo" → camera/gallery picker
  → react-native-compressor: compress to ≤10MB
  → react-native-fs: save to {appDir}/media/{uuid}.jpg
  → WatermelonDB: INSERT media record { local_uri, sync_status: 'pending' }
  [Background, when online]
  → SyncWorker: GET /media/upload-url (presigned R2 URL)
  → HTTP PUT to R2 presigned URL (direct upload, bypasses backend)
  → PATCH /sync/media/{mediaId} { remote_url, sync_status: 'uploaded' }
  → WatermelonDB: update record
```

### 3.5 Google Calendar Sync
```
User enables calendar sync
  → OAuth 2.0 flow → access_token + refresh_token
  → react-native-keychain: store refresh_token securely
  → Server: store encrypted refresh_token (AES-256)
  → BullMQ: schedule CalendarSyncJob (recurring, on plan change)
  → Worker: exchange refresh_token → new access_token
  → Google Calendar API: create/update events
  → On failure: exponential backoff (1s, 2s, 4s, 8s, max 64s)
```

---

## 4. State Management Architecture

```
Zustand Stores (client-side):
├── useAuthStore         → { user, accessToken, isAuthenticated }
├── useWorkoutStore      → { activeSession, activeExercise, setBuffer }
├── useGhostStore        → { ghostCache: Map<exerciseId, GhostData> }
├── useDietStore         → { todayLog, weeklyProgress }
├── useSyncStore         → { syncStatus, pendingCount, lastSyncAt }
└── useMediaStore        → { uploadQueue, uploadProgress }

React Query (server state):
├── exercises query      → paginated exercise library
├── workout history      → paginated past sessions
├── macro history        → weekly/monthly aggregates
└── progress photos      → paginated timeline
```

---

## 5. Security Model

| Surface | Mechanism |
|---------|-----------|
| API authentication | JWT (HS256, 15-min expiry) + refresh token rotation |
| Refresh tokens (client) | iOS Keychain / Android Keystore via `react-native-keychain` |
| Refresh tokens (server) | AES-256 encrypted at rest in PostgreSQL |
| Google OAuth tokens (client) | `react-native-keychain` |
| Google OAuth tokens (server) | AES-256 encrypted at rest |
| Media URLs | Cloudflare R2 pre-signed URLs (15-min TTL) |
| Rate limiting | 100 req/min per user on write endpoints; 300 req/min on reads |
| Input validation | Zod schemas on all API routes |
| SQL injection | Parameterized queries via `pg` driver (no raw string interpolation) |

---

## 6. Environment Configuration

```
.env (never committed)
├── DATABASE_URL          PostgreSQL connection string
├── REDIS_URL             Redis connection string
├── JWT_SECRET            HS256 signing secret (≥256 bits)
├── JWT_REFRESH_SECRET    Separate secret for refresh tokens
├── ENCRYPTION_KEY        AES-256 key for stored OAuth tokens
├── R2_ACCOUNT_ID         Cloudflare R2 account
├── R2_ACCESS_KEY_ID      R2 access key
├── R2_SECRET_ACCESS_KEY  R2 secret key
├── R2_BUCKET_NAME        Bucket name
├── GOOGLE_CLIENT_ID      OAuth 2.0 client ID
├── GOOGLE_CLIENT_SECRET  OAuth 2.0 client secret
└── GOOGLE_REDIRECT_URI   OAuth callback URI
```
