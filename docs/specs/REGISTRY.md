# GymTracker — Spec Registry

> **Read this first.** This is the single index for all specification documents. Find the phase and file you need, then load only that file.

## Phases

| Phase | Scope | Status |
|-------|-------|--------|
| **V1** | Local-only mobile app (no backend, no cloud) | 🔄 Active |
| **V2** | Backend, auth, sync, cloud media, calendar | 📋 Planned |

## V1 Specs (`v1/`)

| File | Purpose |
|------|---------|
| `v1/README.md` | V1 scope, architecture, tech stack |
| `v1/watermelondb-schema.js` | WatermelonDB (SQLite) client DB schema |
| `v1/work-division-v1.md` | Sprint plan and task breakdown |
| `v1/features/workout-logger.spec.md` | Set logging (weight/reps/RIR), session management |
| `v1/features/ghost-data.spec.md` | Previous session snapshot display |
| `v1/features/macro-tracker.spec.md` | Diet logging, macro goals, progress bars |
| `v1/features/media-logging.spec.md` | Photo/video capture and local storage |
| `v1/features/data-export.spec.md` | JSON/CSV backup export and import |

## V2 Specs (`v2/`)

| File | Purpose |
|------|---------|
| `v2/README.md` | V2 scope, prerequisites, what it adds |
| `v2/architecture.md` | Full-stack architecture (client + server) |
| `v2/api-contract.yaml` | OpenAPI 3.1 REST API specification |
| `v2/schema.sql` | PostgreSQL server database schema |
| `v2/sync-protocol.md` | Offline-first sync and conflict resolution |
| `v2/features/auth.spec.md` | JWT auth, registration, token rotation |
| `v2/features/calendar-sync.spec.md` | Google Calendar OAuth and event sync |
| `v2/features/cloud-media.spec.md` | Cloudflare R2 media upload pipeline |
| `v2/features/cross-device-sync.spec.md` | Multi-device data synchronization |

## Decisions (`decisions/`)

| File | Decision |
|------|----------|
| `decisions/ADR-001-local-first-v1.md` | V1 runs 100% on-device, no backend |

## Archive (`_archive/`)

Original pre-restructure specs preserved for reference. **Do not build from these.**
