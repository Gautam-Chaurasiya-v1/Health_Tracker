# Technical Spec: Ghost Data

**Feature:** Previous session snapshot display per exercise  
**PRD Reference:** Section 2.2  
**Dev 1 (Backend):** `services/ghost-cache.service.ts`, `GET /exercises/{exerciseId}/ghost`  
**Dev 2 (Frontend):** `components/GhostBanner.tsx`, `hooks/useGhostData.ts`, WatermelonDB ghost cache reads

---

## User Stories

- As a user logging a set, I can instantly see exactly how I performed this exercise last time I trained it, so I have a clear progressive overload target.
- As a user, ghost data appears without any loading state or network call — it's always there.

---

## Acceptance Criteria

### Data Availability
- [ ] Ghost data is available **instantly** (< 50ms) when the WorkoutLogger screen opens for an exercise.
- [ ] Ghost data is always read from the **local WatermelonDB cache** — never from a network call during a workout.
- [ ] Ghost data reflects the **most recent session** where this exercise was performed, not just the most recent calendar day.
- [ ] Ghost data is updated **immediately** when the user logs a new set for the exercise (Zustand store update, no re-query needed).

### Display Format
- [ ] Banner text: `"Last Session ({date}): {weight}{unit} × {reps} @ {rir} RIR"`
  - Example: `"Last Session (Aug 9): 225 lbs × 8 @ 2 RIR"`
  - If multiple sets: show all sets stacked vertically (Set 1, Set 2, Set 3...).
- [ ] Empty state: `"No previous data — this is your first time logging this exercise"`
- [ ] Date shown as relative ("Last Week", "2 Weeks Ago") if within 30 days; otherwise as "MMM D".

### Data Freshness
- [ ] On `/sync/pull` response, `ghostCache` field updates local WatermelonDB ghost cache records.
- [ ] After a set is logged, ghost cache is updated in memory (Zustand) and in WatermelonDB within the same DB transaction.

---

## Ghost Cache Data Structure

```typescript
interface GhostSnapshot {
  sessionDate: string;  // ISO date 'YYYY-MM-DD'
  sets: Array<{
    setNumber: number;
    weight: number;
    reps: number;
    rir: number;       // always 0-5
  }>;
  totalVolume: number; // sum of weight × reps
}
```

---

## Server-Side: Ghost Cache Update Mechanism

The ghost cache is updated via a **PostgreSQL trigger** (see `schema.sql`):

```
AFTER INSERT OR UPDATE ON sets
  → update_ghost_cache() function
  → Upsert exercise_ghost_cache (user_id, exercise_id)
  → Only overwrites if the new session_date >= current cached session_date
```

This means:
- Ghost data is always correct server-side without an extra API call.
- `/exercises/{exerciseId}/ghost` reads from the cache table (indexed on `user_id, exercise_id`) — single row lookup.

---

## Client-Side: `useGhostData` Hook

```typescript
// hooks/useGhostData.ts
function useGhostData(exerciseId: string): GhostSnapshot | null {
  // 1. Subscribe to WatermelonDB exercise_ghost_cache
  // 2. Query: WHERE exercise_id = exerciseId (reactive — auto-updates on write)
  // 3. Parse sets_snapshot JSON
  // 4. Return typed GhostSnapshot or null
  // Target: < 50ms from mount to render
}
```

---

## Edge Cases

| Scenario | Expected Behavior |
|----------|------------------|
| User's first time doing an exercise | `null` returned. Empty state banner shown. |
| Ghost data from 3 months ago | Still shown with relative date "3 Months Ago" |
| User logs same exercise twice in one session | Ghost updates after each set; shows current session's running data |
| Offline — ghost data never synced to server | Local WatermelonDB still has it. Works correctly. |
| Exercise deleted from library | Ghost cache entry orphaned but still readable. Exercise shown as "[Deleted Exercise]". |
| User switches between exercises rapidly | Reactive WatermelonDB query handles this; no stale data. |

---

## Integration Points

- Receives data from: `workout.service.ts` → `ghost-cache.service.ts` → DB trigger
- Provides data to: `GhostBanner.tsx` via `useGhostData()` hook
- Synced to client via: `/sync/pull` response `ghostCache` field

---

## TDD Test Plan

### Unit Tests (Dev 1 — Backend)
```
ghost-cache.service.test.ts:
  ✓ getGhostSnapshot() returns null for user's first time with exercise
  ✓ getGhostSnapshot() returns correct last session data
  ✓ getGhostSnapshot() ignores sessions from the current (open) session
  ✓ getGhostSnapshot() reads from cache table (test verifies single DB query)
  ✓ updateGhostCache() updates correctly after new set logged
  ✓ updateGhostCache() does NOT update if new session_date < cached session_date

DB Trigger Test:
  ✓ Inserting a set automatically updates exercise_ghost_cache
  ✓ Second insert same session: cache reflects all sets
  ✓ Insert for older session: cache unchanged
```

### Unit Tests (Dev 2 — Frontend)
```
useGhostData.test.ts:
  ✓ Returns null when no cache entry exists
  ✓ Returns parsed GhostSnapshot when cache populated
  ✓ Reactively updates when WatermelonDB record changes
  ✓ Returns data within 50ms (timing assertion with mock DB)

GhostBanner.test.tsx:
  ✓ Renders all sets for a multi-set ghost snapshot
  ✓ Shows "Last Week" for session 7 days ago
  ✓ Shows "2 Weeks Ago" for session 14 days ago
  ✓ Shows "Aug 9" for session > 30 days ago
  ✓ Shows empty state for null snapshot
  ✓ Does not show a loading spinner (data is always synchronous/local)
```
