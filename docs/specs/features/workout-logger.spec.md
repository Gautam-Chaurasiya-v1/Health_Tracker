# Technical Spec: Workout Logger

**Feature:** Core workout session and set logging  
**PRD Reference:** Section 2.1, 2.2, 2.3  
**Dev 1 (Backend):** `routes/workouts.ts`, `services/workout.service.ts`  
**Dev 2 (Frontend):** `screens/WorkoutLogger.tsx`, `components/SetRow.tsx`, `components/SetInputForm.tsx`

---

## User Stories

- As a user, I can start a workout session for a specific date.
- As a user, I can add exercises to my session from the exercise library.
- As a user, I can log a set (weight, reps, RIR) in ≤ 3 taps.
- As a user, my previous set's values are auto-filled when I tap "+ Set" so I don't have to re-enter them.
- As a user, I can complete a full workout entirely offline.
- As a user, I can add notes and condition tags to my workout session.

---

## Acceptance Criteria

### Session Management
- [ ] User can create a new session (`POST /workouts`) with `clientUuid`, `date`, `startedAt`.
- [ ] Session `date` defaults to today's date.
- [ ] User can finish a session (PATCH with `finishedAt`).
- [ ] User can view past sessions (GET /workouts, paginated, date range filter).

### Exercise Entry
- [ ] User can add an exercise to a session. Exercise searched from the library.
- [ ] Exercise entries maintain `orderIndex` for display order.

### Set Logging — The Core Loop
- [ ] Logging a set requires ≤ 3 taps:
  1. Tap `+ Set`
  2. (Auto-fill from previous set; adjust values via stepper if needed)
  3. Tap `✓ Confirm`
- [ ] `weight`: numeric (positive), respects user's `weightUnit`.
- [ ] `reps`: integer, 1–100.
- [ ] `rir`: integer stepper **0–5** (not a free-text field). Default: 2.
- [ ] On confirm: record written to WatermelonDB instantly with `sync_status: 'pending'`.
- [ ] Ghost cache updated immediately in Zustand store (no DB query required for next set's auto-fill).
- [ ] Set is assigned a `clientUuid` (uuid v4) at creation time.

### Offline Behavior
- [ ] All set logging works without network.
- [ ] Pending sets are batched and pushed on next connectivity event.
- [ ] Pending count visible in UI header ("3 sets pending sync").

### Condition Tags
- [ ] Chip-selector UI: tap to select from predefined tags (`high_energy`, `fatigued`, `joint_pain`, `poor_sleep`, `normal`).
- [ ] Maximum 10 tags per session.
- [ ] Custom text tags not supported in Phase 1.

---

## Edge Cases & Error Handling

| Scenario | Expected Behavior |
|----------|------------------|
| User logs a set with RIR = 6 | UI stepper prevents it (max is 5). API returns 422 if bypassed. |
| User closes app mid-workout | WatermelonDB has all sets persisted. Reopen shows active session. |
| Network comes back during workout | Background sync runs silently. UI is not disrupted. |
| User tries to log set with weight = 0 | Allowed (bodyweight exercises). |
| Duplicate `clientUuid` pushed to server | Server returns 409 with existing set. Client marks synced — no duplication. |
| User logs 30 sets for one exercise | No limit. All stored and displayed. |
| Two rapid taps on "+ Set" | Client-side debounce (300ms) prevents double creation. |

---

## Interaction Design (Dev 2 Spec)

### SetInputForm Component
```
State: { weight: number, reps: number, rir: number }

Initial State:
  - weight: previousSet.weight ?? 0
  - reps:   previousSet.reps ?? 5
  - rir:    previousSet.rir ?? 2

Controls:
  - Weight: numeric keyboard input with +2.5 / -2.5 quick buttons
  - Reps:   stepper (+1 / -1)
  - RIR:    stepper (0–5 only, no keyboard)

Confirm Button: disabled if weight is empty
```

### GhostBanner Component
```
Position: Above SetInputForm, always visible
Content:  "Last Session: {weight}{unit} × {reps} @ {rir} RIR"
Source:   WatermelonDB exercise_ghost_cache (< 50ms query)
Empty state: "No previous data for this exercise"
```

---

## Integration Points

- Ghost Data feed: reads from `exercise_ghost_cache` (see ghost-data.spec.md)
- Media attach: per-exercise media (see media-logging.spec.md)
- Sync: all sets enter `sync_queue` (see sync-protocol.md)

---

## TDD Test Plan

### Unit Tests (Dev 1 — Backend)
```
workout.service.test.ts:
  ✓ createSession() creates session with pending sync_status
  ✓ logSet() validates rir in [0,5] range
  ✓ logSet() is idempotent by clientUuid (returns existing on duplicate)
  ✓ logSet() triggers ghost cache update after insert
  ✓ getSessionsByUser() returns paginated results ordered by date desc
  ✓ finishSession() validates finishedAt > startedAt

Validation (Zod):
  ✓ Rejects rir = 6
  ✓ Rejects reps = 0
  ✓ Rejects weight = -5
  ✓ Rejects missing clientUuid
```

### Component Tests (Dev 2 — Frontend)
```
SetInputForm.test.tsx:
  ✓ Renders with previous set values pre-filled
  ✓ RIR stepper does not go below 0
  ✓ RIR stepper does not go above 5
  ✓ Confirm button disabled when weight is empty
  ✓ Calls onConfirm with correct { weight, reps, rir } on tap
  ✓ Debounces rapid confirm taps

GhostBanner.test.tsx:
  ✓ Renders ghost data when cache has entry
  ✓ Renders empty state when no cache entry
  ✓ Ghost data renders in < 50ms (performance test with mock DB)

WorkoutLogger.test.tsx:
  ✓ Shows active exercises
  ✓ "+ Set" button adds a new SetInputForm
  ✓ Offline indicator shown when sync pending
```

### E2E Tests (Dev 2 — Detox)
```
✓ User starts session → adds exercise → logs 3 sets → finishes session
✓ Set auto-fills from previous set on second "+ Set" tap
✓ RIR stepper capped at 5 in UI
✓ Full workout logged offline; syncs when network restored
```
