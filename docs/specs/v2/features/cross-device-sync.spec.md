# Technical Spec: Cross-Device Sync

**Phase:** V2  
**Prerequisite:** V1 local app stable, backend API deployed, auth working  
**Protocol:** See `v2/sync-protocol.md` for full protocol details

---

## What V2 Adds

V1 is single-device. V2 adds the ability to sync data across multiple devices via a central server.

## How It Works

1. **WatermelonDB stays as local DB** — all reads/writes still happen locally first
2. **Sync engine** pushes pending local changes to server and pulls remote changes
3. **Conflict resolution** via `client_timestamp` — newer timestamp wins
4. **`client_uuid`** ensures idempotent pushes — safe to retry on network failure

## Sync Triggers

| Event | Action |
|-------|--------|
| App comes to foreground | Full pull + push cycle |
| Network connectivity restored | Full pull + push cycle |
| User manually pulls to refresh | Full pull + push cycle |
| Set logged / meal added | Write locally; queue push in background |

## V1 Schema Forward Compatibility

The V1 WatermelonDB schema already includes fields for V2 sync:
- `server_id` (optional) — populated after first sync with server's UUID
- `client_uuid` — client-generated unique ID, used as idempotency key
- `sync_status` — 'pending' | 'synced' | 'failed'
- `client_timestamp` — for conflict resolution
- `sync_queue` table — event log for pending sync operations

These fields are unused in V1 but ensure a seamless V2 migration.

## Migration: First Sync

When a V1 user upgrades to V2:
1. User creates an account (auth)
2. All local WatermelonDB records are pushed to server in a bulk initial sync
3. Server assigns `server_id` to each record
4. Client updates local records with `server_id` and `sync_status: 'synced'`
5. Subsequent syncs are delta-only (only changed records)

## Key Specs

- Full sync protocol: `v2/sync-protocol.md`
- Sync push/pull endpoints: `v2/api-contract.yaml` (paths: `/sync/push`, `/sync/pull`)
- Server DB schema: `v2/schema.sql`
