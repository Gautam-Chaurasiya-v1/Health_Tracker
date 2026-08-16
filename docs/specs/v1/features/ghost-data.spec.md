# Technical Spec: Ghost Data

**Phase:** V1 (Local-Only)  
**Storage:** WatermelonDB `exercise_ghost_cache` table  
**Files:** `components/GhostBanner.tsx`, `hooks/useGhostData.ts`

---

## User Stories

- As a user logging a set, I can instantly see how I performed this exercise last session, so I have a progressive overload target.
- As a user, ghost data appears without any loading state — it's always there.

---

## Acceptance Criteria

### Data Availability
- [ ] Ghost data is available **instantly** (< 50ms) when the WorkoutLogger screen opens for an exercise.
- [ ] Ghost data is always read from the **local WatermelonDB cache** — it's a single indexed query.
- [ ] Ghost data reflects the **most recent session** where this exercise was performed.
- [ ] Ghost data is updated **immediately** when the user logs a new set (Zustand store update, no re-query needed).

### Display Format
- [ ] Banner text: `"Last Session ({date}): {weight}{unit} × {reps} @ {rir} RIR"`
  - Example: `"Last Session (Aug 9): 225 lbs × 8 @ 2 RIR"`
  - If multiple sets: show all sets stacked vertically (Set 1, Set 2, Set 3...).
- [ ] Empty state: `"No previous data — this is your first time logging this exercise"`
- [ ] Date shown as relative ("Last Week", "2 Weeks Ago") if within 30 days; otherwise as "MMM D".

### Cache Update Logic (Local)
- [ ] After a set is logged, ghost cache is updated in memory (Zustand) and in WatermelonDB within the same DB write action.
- [ ] Ghost cache stores a snapshot of all sets from the most recent session for each exercise.
- [ ] Only overwrites if the new session date ≥ currently cached session date.

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

## `useGhostData` Hook

```typescript
function useGhostData(exerciseId: string): GhostSnapshot | null {
  // 1. Subscribe to WatermelonDB exercise_ghost_cache (reactive query)
  // 2. Query: WHERE exercise_id = exerciseId
  // 3. Parse sets_snapshot JSON
  // 4. Return typed GhostSnapshot or null
  // Target: < 50ms from mount to render
}
```

---

## Edge Cases

| Scenario | Expected Behavior |
|----------|------------------|
| User's first time doing an exercise | `null` returned. Empty state banner shown |
| Ghost data from 3 months ago | Still shown with "3 Months Ago" label |
| User logs same exercise twice in one session | Ghost updates after each set; shows current session's running data |
| Exercise deleted from library | Ghost cache entry orphaned but still readable. Exercise shown as "[Deleted Exercise]" |
| User switches between exercises rapidly | Reactive WatermelonDB query handles this; no stale data |

---

## Test Plan

### Hook Tests
```
useGhostData.test.ts:
  ✓ Returns null when no cache entry exists
  ✓ Returns parsed GhostSnapshot when cache populated
  ✓ Reactively updates when WatermelonDB record changes
  ✓ Returns data within 50ms (timing assertion with mock DB)
```

### Component Tests
```
GhostBanner.test.tsx:
  ✓ Renders all sets for a multi-set ghost snapshot
  ✓ Shows "Last Week" for session 7 days ago
  ✓ Shows "2 Weeks Ago" for session 14 days ago
  ✓ Shows "Aug 9" for session > 30 days ago
  ✓ Shows empty state for null snapshot
  ✓ Does not show a loading spinner (data is always synchronous/local)
```
