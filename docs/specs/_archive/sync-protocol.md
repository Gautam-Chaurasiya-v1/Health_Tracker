# Offline-First Sync Protocol — GymTracker MVP

## 1. Design Principles

1. **Local-First:** All reads and writes happen against WatermelonDB (SQLite) first. The network is an optimization, not a requirement.
2. **Append-Only Events:** Every logged set, meal, or media record is an immutable event identified by a client-generated `clientUuid`. Records are never deleted locally — they are soft-deleted.
3. **Idempotent Pushes:** The server accepts the same `clientUuid` multiple times without error — it returns the existing record on the second call (HTTP 409 with body = existing record).
4. **Timestamp-Based Conflict Resolution:** When two versions of the same record exist, the one with the newer `client_timestamp` wins. The server never silently drops data.
5. **Pull Before Push (on app open):** On connectivity restoration, always pull server changes first, then push local changes. This reduces conflicts.

---

## 2. Sync Architecture

```
Client (WatermelonDB)                    Server (PostgreSQL)
─────────────────────                    ──────────────────
sync_queue table                         /sync/pull?since=T
  [pending events]   ──── pull ────►    returns all records
                                         updated since T
                     ◄─── merge ────    client reconciles
                                         (server wins on conflict)

                     ──── push ────►    /sync/push
                      [batch of all      accepts pending
                       pending records]  events by clientUuid

                     ◄─── result ────   { accepted[], conflicts[] }
                                         client marks synced
```

---

## 3. Client Sync State Machine

```
States:
  IDLE          → Normal operation, no pending sync
  DETECTING     → Checking connectivity (NetInfo)
  PULLING       → Fetching server changes (GET /sync/pull)
  MERGING       → Applying server records to local WatermelonDB
  PUSHING       → Uploading local pending records (POST /sync/push)
  RECONCILING   → Applying server response (accepted/conflicts)
  ERROR         → Sync failed, will retry with backoff
  UPLOADING     → Media files being uploaded to R2

Transitions:
  IDLE         → DETECTING    (on app foreground / connectivity event)
  DETECTING    → PULLING      (connection confirmed)
  DETECTING    → IDLE         (no connection)
  PULLING      → MERGING      (data received)
  PULLING      → ERROR        (network fail)
  MERGING      → PUSHING      (local merge complete)
  PUSHING      → RECONCILING  (response received)
  PUSHING      → ERROR        (network fail)
  RECONCILING  → UPLOADING    (if media records pending)
  RECONCILING  → IDLE         (no media pending)
  UPLOADING    → IDLE         (all media uploaded)
  ERROR        → IDLE         (after backoff delay)
```

---

## 4. Conflict Resolution Rules

| Scenario | Resolution |
|----------|------------|
| Client pushes a `clientUuid` that already exists on server (exact match) | Server returns 409 with existing record. Client marks as `synced`. No data loss. |
| Client pushes a record with same `clientUuid` but different data | Compare `client_timestamp`. **Newer `client_timestamp` wins.** Server updates record. |
| Server has a record the client doesn't have (pull returns unknown ID) | Client inserts it as a new local record with `sync_status: 'synced'`. |
| Client has a `set` record but its parent `exercise_entry` is missing from server | Client includes the full chain (session → entry → sets) in the push payload. Server processes in dependency order. |
| Two devices log the same exercise concurrently (same `session_id` different `clientUuid`) | Both are accepted as separate exercise entries. No merge — both appear in history. |

---

## 5. Push Payload Structure

```typescript
// POST /sync/push
{
  lastSyncAt: "2026-08-16T10:00:00Z",  // null on first sync
  workoutSessions: [
    {
      clientUuid: "...",
      client_timestamp: "...",
      // ... full session with nested exercises and sets
      exercises: [
        {
          clientUuid: "...",
          sets: [ { clientUuid: "...", weight: 225, reps: 8, rir: 2, ... } ]
        }
      ]
    }
  ],
  dietLogs: [ /* ... */ ],
  mediaRecords: [
    {
      clientUuid: "...",
      sync_status: "pending",
      local_uri: null,       // Never send local_uri to server
      remote_url: null,      // Populated after R2 upload
      // ... rest of fields
    }
  ]
}
```

---

## 6. Pull Response Merge Logic (Client-Side)

```typescript
async function applyPullResponse(response: SyncPullResponse) {
  await database.write(async () => {
    for (const session of response.workoutSessions) {
      const existing = await db.collections.get('workout_sessions')
        .query(Q.where('client_uuid', session.clientUuid))
        .fetch();

      if (existing.length === 0) {
        // Insert new record from server
        await db.collections.get('workout_sessions').create(record => {
          record._raw.server_id = session.id;
          record._raw.sync_status = 'synced';
          // ... map all fields
        });
      } else {
        // Only overwrite if server version is newer
        if (new Date(session.updatedAt) > new Date(existing[0].updatedAt)) {
          await existing[0].update(record => {
            // ... update fields
            record._raw.sync_status = 'synced';
          });
        }
      }
    }

    // Update ghost cache from server
    for (const ghost of response.ghostCache) {
      await upsertGhostCache(ghost.exerciseId, ghost.snapshot);
    }
  });
}
```

---

## 7. Media Sync Flow (Separate from Data Sync)

Media files are synced independently from data records to avoid blocking the data sync on slow uploads.

```
Step 1: Data sync completes (session/set records synced)
Step 2: SyncWorker queries: SELECT * FROM media_records WHERE sync_status = 'pending'
Step 3: For each pending media record:
  a. POST /media/upload-url { clientUuid, mediaType, context, fileSizeBytes, mimeType }
  b. Server returns { mediaId, uploadUrl (presigned R2), expiresAt }
  c. Client: HTTP PUT to uploadUrl with the file binary
  d. On PUT success: PATCH /media/{mediaId}/confirm
  e. Server: marks media_records.sync_status = 'uploaded'
  f. Client: updates local WatermelonDB record sync_status = 'uploaded'

On PUT failure:
  - Retry up to 3 times with exponential backoff (2s, 4s, 8s)
  - After 3 failures: sync_status = 'failed', increment retry_count
  - Retry next app session

On presigned URL expiry (15 min TTL):
  - Detect expiry (HTTP 403 from R2)
  - Re-request a new presigned URL from /media/upload-url
  - Retry PUT with new URL
```

---

## 8. Sync Triggers

| Event | Sync Action |
|-------|-------------|
| App comes to foreground | Full pull + push cycle |
| Network connectivity restored | Full pull + push cycle |
| User manually pulls to refresh | Full pull + push cycle |
| Set logged / meal added | Write to local DB immediately; queue push in background (non-blocking) |
| Weekly plan updated | Immediate push + enqueue CalendarSyncJob |
| Media attached | Write local record; queue media upload job |

---

## 9. Retry & Backoff Policy

| Failure Type | Retry Strategy |
|--------------|----------------|
| Network timeout | Exponential backoff: 1s, 2s, 4s, 8s, 16s, then pause until next trigger |
| Server 5xx | Same exponential backoff |
| Server 4xx (validation) | **No retry.** Mark as `failed`. Surface error to user. |
| JWT expired during sync | Refresh token → new access token → retry once |
| Refresh token expired | Force logout. Persist local data. Re-sync after re-login. |

---

## 10. Data Security During Sync

- All sync calls use HTTPS (TLS 1.3 minimum).
- JWT must be valid; if expired during sync, refresh before retrying.
- Media uploaded directly to R2 via presigned URL (server never proxies binary data).
- Presigned URLs have 15-minute TTL and are scoped to a single object key.
- Server validates that `userId` in JWT matches the `userId` of all records in push payload.
