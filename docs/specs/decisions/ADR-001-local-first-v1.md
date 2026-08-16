# ADR-001: V1 Runs 100% On-Device (No Backend)

**Status:** Accepted  
**Date:** 2026-08-17  
**Decision Makers:** Project Team

---

## Context

The original GymTracker architecture specified a full client-server stack: React Native + Fastify backend + PostgreSQL + Redis + Cloudflare R2 + Google Calendar API. While comprehensive, this introduced significant complexity for a first release with zero users.

We evaluated which features genuinely require a server and which can run entirely on-device.

## Decision

**V1 ships as a local-only mobile app.** All data is stored on the user's phone using WatermelonDB (SQLite). No backend server, no cloud storage, no authentication, no sync.

## Rationale

1. **~80% of app value is local.** Workout logging, ghost data, diet tracking, and media capture all work without a server.
2. **Zero infrastructure cost.** No servers to provision, monitor, or pay for.
3. **Faster time to market.** Eliminates backend development, API integration, auth flows, and sync debugging.
4. **Simpler debugging.** All state is local — no network-related bugs, no sync conflicts, no token expiry issues.
5. **Offline-first by default.** The app works everywhere — gym basements with no signal, airplanes, anywhere.

## What V1 Excludes

| Excluded Feature | Why | V2 Candidate? |
|-----------------|-----|---------------|
| User authentication | Single user on device — no login needed | Yes |
| Cross-device sync | Users typically use one phone | Yes |
| Cloud media storage (R2) | Store on device filesystem | Yes |
| Google Calendar sync | Requires OAuth + server-side token management | Yes |
| Multi-user support | Single-user app for V1 | Yes |

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| **Data loss on app uninstall** | V1 includes a JSON/CSV export feature (`data-export.spec.md`) so users can back up manually |
| **No data recovery** | Export can be re-imported to restore data |
| **Phone storage limits** | Media compression enforced (photos ≤10MB, videos ≤100MB); storage warnings at <500MB free |
| **Users want cloud backup** | Planned for V2 — sync engine and server schema already designed in `v2/` specs |

## Consequences

- The `/backend/` directory is not created in V1
- All V1 feature specs contain zero references to API endpoints, sync, or server logic
- WatermelonDB schema retains `sync_status` and `server_id` fields for forward compatibility with V2
- The `shared/types/` directory is created in V1 but only contains entity and enum types (no API request/response types)
