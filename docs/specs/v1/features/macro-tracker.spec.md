# Technical Spec: Macro & Weight Tracker

**Phase:** V1 (Local-Only)  
**Storage:** WatermelonDB (`diet_logs`, `meal_entries`)  
**Files:** `screens/DietLog.tsx`, `components/MacroProgressBar.tsx`, `components/MealEntry.tsx`, `components/ConditionTagChips.tsx`

---

## User Stories

- As a user, I can log my daily body weight.
- As a user, I can log meals by entering macros (protein, carbs, fats, calories) manually.
- As a user, I can see daily progress bars showing my intake vs. my goals.
- As a user, I can tag meals with how I'm feeling (bloated, high energy, etc.).
- As a user, I can review past days' macro logs.

---

## Acceptance Criteria

### Body Weight Logging
- [ ] Weight input accepts decimal values (e.g., 84.5 kg).
- [ ] Valid range: 0–500 (in user's selected unit).
- [ ] One weight entry per day (upsert on save in WatermelonDB).
- [ ] Displayed on DietLog screen at the top.
- [ ] Unit (kg/lbs) inherited from user preferences (local `user_preferences` table).

### Macro Goal Setup
- [ ] During onboarding (or Settings), user enters:
  - Protein goal (g), Carbs goal (g), Fats goal (g), Calories goal (kcal).
- [ ] Defaults: protein = bodyweight (lbs) × 1g; calories = bodyweight × 15 kcal.
- [ ] Goals stored in local `user_preferences` table.

### Meal Logging
- [ ] User can log multiple meals per day (breakfast, lunch, dinner, snacks, pre/post-workout).
- [ ] Each meal: label (text), protein_g, carbs_g, fat_g, calories (all numeric).
- [ ] Calories field: auto-calculated from macros (`protein × 4 + carbs × 4 + fat × 9`) but user-editable.
- [ ] `client_uuid` assigned at creation for uniqueness.
- [ ] Meals stored with `logged_at` timestamp in WatermelonDB.
- [ ] Meals can be deleted (hard delete in V1).

### Progress Bars (UI)
- [ ] Four progress bars: Protein, Carbs, Fats, Calories.
- [ ] Bar = (total logged today / goal) × 100%.
- [ ] Color coding:
  - < 80% goal: neutral
  - 80–100%: success (green)
  - \> 100%: warning (amber/red)
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
| User logs more calories than goal | Progress bar goes amber/red past 100%, shows actual value |
| User opens diet log for a past date | Shows historical data (editing allowed) |
| No meals logged yet today | Empty state with prompt to add first meal |
| Calories auto-calc exceeds user input | User-entered value takes precedence |
| User changes weight unit mid-day | Old weight entries remain in original unit with stored unit field |
| Daily log doesn't exist for selected date | Auto-created on first action (body weight save or meal add) |

---

## Integration Points

- `media-logging.spec.md`: meal photos attached to meal entries via `meal_entry_id`.
- Macro totals: computed on client (`useDietStore` Zustand store) from WatermelonDB queries.

---

## Test Plan

### Component Tests
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
