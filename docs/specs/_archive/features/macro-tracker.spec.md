# Technical Spec: Macro & Weight Tracker

**Feature:** Daily macro logging, body weight logging, macro goal progress  
**PRD Reference:** Section 3.1, 3.3  
**Dev 1 (Backend):** `routes/diet.ts`, `services/diet.service.ts`  
**Dev 2 (Frontend):** `screens/DietLog.tsx`, `components/MacroProgressBar.tsx`, `components/MealEntry.tsx`, `components/ConditionTagChips.tsx`

---

## User Stories

- As a user, I can log my daily body weight.
- As a user, I can log meals by entering macros (protein, carbs, fats, calories) manually.
- As a user, I can see daily progress bars showing my intake vs. my hypertrophy goals.
- As a user, I can tag meals or days with how I'm feeling (bloated, high energy, etc.).
- As a user, I can review past days' macro logs.

---

## Acceptance Criteria

### Body Weight Logging
- [ ] Weight input accepts decimal values (e.g., 84.5 kg).
- [ ] Valid range: 0–500 (in user's selected unit).
- [ ] One weight entry per day (upsert on save).
- [ ] Displayed on DietLog screen at the top.
- [ ] Unit (kg/lbs) inherited from user's account setting.

### Macro Goal Setup
- [ ] During onboarding (or Settings), user enters:
  - Protein goal (g), Carbs goal (g), Fats goal (g), Calories goal (kcal).
- [ ] Defaults: protein = bodyweight (lbs) × 1g; calories = bodyweight × 15 kcal (maintenance estimate).
- [ ] Goals stored on user record (`users.goal_*` columns).

### Meal Logging
- [ ] User can log multiple meals per day (breakfast, lunch, dinner, snacks, pre/post-workout).
- [ ] Each meal: label (text), protein_g, carbs_g, fat_g, calories (all numeric).
- [ ] Calories field: auto-calculated from macros (`protein × 4 + carbs × 4 + fat × 9`) but user-editable (to account for alcohol, fiber adjustments).
- [ ] `clientUuid` assigned at creation for idempotency.
- [ ] Meals stored with `logged_at` timestamp.
- [ ] Meals can be deleted (soft-delete or hard-delete — Phase 1: hard delete).

### Progress Bars (UI)
- [ ] Four progress bars: Protein, Carbs, Fats, Calories.
- [ ] Bar = (total logged today / goal) × 100%.
- [ ] Color coding:
  - < 80% goal: neutral
  - 80–100%: success (green)
  - > 100%: warning (amber/red)
- [ ] Numeric display: `"142 / 180g"` alongside bar.

### Condition Tagging
- [ ] Per-meal tagging: tap a chip to select (`bloated`, `high_energy`, `sluggish`, `brain_fog`, `neutral`).
- [ ] Only one condition tag per meal entry.
- [ ] Chips are quick-tap, no typing required.

---

## Edge Cases

| Scenario | Expected Behavior |
|----------|------------------|
| User logs 0g protein | Allowed — some days are rest/cheat days |
| User logs more calories than goal | Progress bar goes red/amber past 100%, shows actual value |
| User opens diet log for a past date | Shows historical data (read-only editing allowed in Phase 1) |
| No meals logged yet today | Empty state with prompt to add first meal |
| Calories auto-calc exceeds user input | User-entered value takes precedence |
| User changes weight unit mid-day | Old weight entries remain in original unit with stored unit field |
| Daily log doesn't exist for selected date | Auto-created on first action (body weight save or meal add) |

---

## Integration Points

- `media-logging.spec.md`: meal photos attached to meal entries via `meal_entry_id`.
- `sync-protocol.md`: diet logs and meal entries enter sync queue on creation.
- Macro totals: computed on client (Zustand `useDietStore`) from local WatermelonDB queries.

---

## TDD Test Plan

### Unit Tests (Dev 1 — Backend)
```
diet.service.test.ts:
  ✓ upsertDietLog() creates new log for new date
  ✓ upsertDietLog() updates existing log for same date
  ✓ addMealEntry() creates meal with clientUuid (idempotent)
  ✓ addMealEntry() validates protein_g >= 0
  ✓ addMealEntry() validates calories >= 0
  ✓ getMacroTotals() correctly sums macros across meals for a date
  ✓ updateMacroGoals() stores goals on user record

Validation:
  ✓ Rejects bodyWeight > 500
  ✓ Rejects bodyWeight < 0
  ✓ Rejects invalid condition_tag value
```

### Component Tests (Dev 2 — Frontend)
```
MacroProgressBar.test.tsx:
  ✓ Shows 0% bar when no meals logged
  ✓ Shows 80% fill when 144g logged vs 180g goal
  ✓ Shows amber color when > 100% of goal
  ✓ Displays "144 / 180g" text correctly

MealEntry.test.tsx:
  ✓ Auto-calculates calories from macros on input
  ✓ User can override auto-calculated calories
  ✓ Condition chip selection updates state
  ✓ Only one condition chip active at a time

DietLog.test.tsx:
  ✓ Shows today's date by default
  ✓ Can navigate to past date (date picker)
  ✓ Empty state shown when no meals exist
  ✓ Adding a meal updates progress bars reactively

useDietStore.test.ts:
  ✓ dailyTotals() sums all meals correctly
  ✓ progressPercent() returns value for each macro
```
