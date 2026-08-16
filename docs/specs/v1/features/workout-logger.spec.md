# Technical Spec: Workout Logger

**Phase:** V1 (Local-Only)  
**Storage:** WatermelonDB (SQLite)  
**Files:** `screens/WorkoutLogger.tsx`, `components/SetRow.tsx`, `components/SetInputForm.tsx`

---

## User Stories

- As a user, I can start a workout session for a specific date.
- As a user, I can add exercises to my session from the exercise library.
- As a user, I can log a set (weight, reps, RIR) in ≤ 3 taps.
- As a user, my previous set's values are auto-filled when I tap "+ Set".
- As a user, I can complete a full workout entirely offline (always — V1 is local-only).
- As a user, I can add notes and condition tags to my workout session.

---

## Acceptance Criteria

### Date Navigation & History Browsing
- [x] Date header with previous (`◀`) and next (`▶`) buttons allowing users to view any day's workout log.
- [x] If a session exists for the selected date, loads and displays the session, logged exercises, and sets.
- [x] If no session exists for the selected date, displays an empty state with a "Start Workout" button to create and log a session on that specific date.

### Session Management
- [x] User can create a new session with `client_uuid`, `date`, `started_at`.
- [x] Session `date` defaults to today's date or the currently selected date in the date navigator.
- [x] Session written to WatermelonDB immediately on creation.
- [x] User can finish a session (sets `finished_at`).
- [x] User can delete a session (permanently removes session, cascade-deletes related exercise entries and sets).
- [x] User can view past sessions in Workout History (paginated local WatermelonDB query, ordered by date desc).

### Exercise Entry
- [ ] User can add an exercise to a session from the Exercise Library screen.
- [ ] Exercise entries maintain `order_index` for display order.

### Set Logging — The Core Loop
- [ ] Logging a set requires ≤ 3 taps:
  1. Tap `+ Set`
  2. (Auto-fill from previous set; adjust values via stepper if needed)
  3. Tap `✓ Confirm`
- [ ] `weight`: numeric (positive), respects user's `weightUnit` preference.
- [ ] `reps`: integer, 1–100.
- [ ] `rir`: integer stepper **0–5** (not a free-text field). Default: 2.
- [ ] On confirm: record written to WatermelonDB instantly.
- [ ] Ghost cache updated immediately in Zustand store.
- [ ] Set is assigned a `client_uuid` (uuid v4) at creation time.

### Condition Tags
- [ ] Chip-selector UI: tap to select from predefined tags (`high_energy`, `fatigued`, `joint_pain`, `poor_sleep`, `normal`).
- [ ] Maximum 10 tags per session.

---

## Interaction Design

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

## Edge Cases

| Scenario | Expected Behavior |
|----------|------------------|
| User logs a set with RIR = 6 | UI stepper prevents it (max is 5) |
| User closes app mid-workout | WatermelonDB has all sets persisted. Reopen shows active session |
| User tries to log set with weight = 0 | Allowed (bodyweight exercises) |
| User logs 30 sets for one exercise | No limit. All stored and displayed |
| Two rapid taps on "+ Set" | Client-side debounce (300ms) prevents double creation |

---

## Integration Points

- Ghost Data: reads from `exercise_ghost_cache` (see `ghost-data.spec.md`)
- Media attach: per-exercise media (see `media-logging.spec.md`)

---

## Test Plan

### Component Tests
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
  ✓ Condition tag chips are selectable
```

### E2E Tests (Detox)
```
✓ User starts session → adds exercise → logs 3 sets → finishes session
✓ Set auto-fills from previous set on second "+ Set" tap
✓ RIR stepper capped at 5 in UI
```
