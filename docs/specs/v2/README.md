# V2 — Full-Stack (Backend + Cloud + Sync)

> **Prerequisite:** V1 must be stable and shipped before starting V2.  
> **Decision Reference:** See `decisions/ADR-001-local-first-v1.md` for why this was deferred.

## What V2 Adds

V2 upgrades GymTracker from a local-only app to a full client-server system with:

1. **User Authentication** — JWT + refresh token rotation, email/password registration
2. **Backend API** — Node.js + Fastify REST server with all CRUD endpoints
3. **Server Database** — PostgreSQL as source of truth
4. **Cross-Device Sync** — Offline-first delta sync protocol (push/pull)
5. **Cloud Media Storage** — Cloudflare R2 with presigned upload URLs
6. **Google Calendar Sync** — OAuth 2.0 integration for training plan events
7. **Multi-User Support** — Separate accounts with data isolation

## Architecture

See `v2/architecture.md` for the full client-server architecture diagram.

**Key additions over V1:**
```
V1 (Phone Only)          V2 (Adds)
─────────────           ──────────────────────
WatermelonDB    ←sync→  PostgreSQL 15
Local files     ←upload→ Cloudflare R2
No auth         ←adds→  JWT + OAuth 2.0
No server       ←adds→  Fastify + Redis + BullMQ
```

## Tech Stack (Server-Side)

| Component | Technology |
|-----------|-----------|
| API Server | Node.js + Fastify |
| Database | PostgreSQL 15 |
| Cache | Redis 7 |
| Job Queue | BullMQ (on Redis) |
| Object Storage | Cloudflare R2 |
| Validation | Zod |
| Auth | JWT (HS256) + bcrypt |
| External APIs | Google Calendar OAuth 2.0 |

## V2 Specs

| File | Purpose |
|------|---------|
| `v2/architecture.md` | Full-stack system architecture and data flows |
| `v2/api-contract.yaml` | OpenAPI 3.1 spec for all REST endpoints |
| `v2/schema.sql` | PostgreSQL schema, indexes, triggers, seed data |
| `v2/sync-protocol.md` | Offline-first sync protocol and conflict resolution |
| `v2/features/auth.spec.md` | Authentication, JWT, token rotation |
| `v2/features/calendar-sync.spec.md` | Google Calendar OAuth and event creation |
| `v2/features/cloud-media.spec.md` | R2 presigned upload pipeline |
| `v2/features/cross-device-sync.spec.md` | Multi-device synchronization |

## Free Tier Feasibility

For < 100 users, V2 can run on free tiers:

| Service | Provider | Free Tier |
|---------|----------|-----------|
| PostgreSQL | Neon / Supabase | 500MB–10GB |
| Redis | Upstash | 10K commands/day |
| Object Storage | Cloudflare R2 | 10GB + 10M reads/month |
| Hosting | Render / Railway | Free tier available |
| Google Calendar API | Google | Free (quota-based) |

## Migration Path (V1 → V2)

1. User creates account (new auth screens)
2. All local WatermelonDB data is pushed to server via initial sync
3. `sync_status` fields (already in V1 schema) are used to track what's synced
4. `server_id` fields (already in V1 schema) are populated after first sync
5. Local media files are uploaded to R2 in background
6. App continues to work offline as before — server is an enhancement, not a requirement
