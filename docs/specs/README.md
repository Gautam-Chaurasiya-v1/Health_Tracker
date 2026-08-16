# /docs/specs — Pre-Development Artifacts Index

> **Status Gate:** No implementation code may be written until all artifacts in this directory are reviewed and marked ✅ RATIFIED.

---

## Artifact Registry

| File | Description | Owner | Status |
|------|-------------|-------|--------|
| `README.md` | This index file | Architect | ✅ |
| `architecture.md` | System architecture, component interaction, data flow | Architect | ✅ |
| `work-division.md` | Module ownership matrix, developer domains | Architect | ✅ |
| `api-contract.yaml` | Full OpenAPI 3.1 specification for all REST endpoints | Dev 1 | ✅ |
| `schema.sql` | PostgreSQL schema, indexes, constraints, and migrations | Dev 1 | ✅ |
| `watermelondb-schema.js` | WatermelonDB client-side schema mirroring the server DB | Dev 2 | ✅ |
| `sync-protocol.md` | Offline-first sync protocol, conflict resolution rules | Architect | ✅ |
| `media-pipeline.md` | Media upload, compression, and job queue spec | Dev 1 | ✅ |
| `features/` | Per-feature Technical Spec (.spec.md) files | Both | 🔄 In Progress |

---

## Feature Spec Files (`features/`)

| Spec File | Feature | Owner | Status |
|-----------|---------|-------|--------|
| `features/auth.spec.md` | Authentication & JWT flow | Dev 1 | ✅ |
| `features/workout-logger.spec.md` | Core workout logging (sets/reps/RIR) | Dev 1 (API) / Dev 2 (UI) | ✅ |
| `features/ghost-data.spec.md` | Ghost Data (previous session display) | Dev 1 (API) / Dev 2 (UI) | ✅ |
| `features/macro-tracker.spec.md` | Macro & weight logging | Dev 1 (API) / Dev 2 (UI) | ✅ |
| `features/media-logging.spec.md` | Photo/video attach (workout + diet) | Dev 1 (API) / Dev 2 (UI) | ✅ |
| `features/calendar-sync.spec.md` | Google Calendar OAuth & sync | Dev 1 (API) / Dev 2 (UI) | ✅ |

---

## Branching Convention

```
main
├── feature/dev1-<feature-name>     ← Dev 1 branches
├── feature/dev2-<feature-name>     ← Dev 2 branches
└── chore/architect-<task-name>     ← Architect/infra branches
```

All PRs require: linked spec, passing tests, zero lint errors, peer review.
