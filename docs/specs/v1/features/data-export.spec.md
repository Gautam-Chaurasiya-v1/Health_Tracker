# Technical Spec: Data Export & Import

**Phase:** V1 (Local-Only)  
**Storage:** WatermelonDB → JSON/CSV file → Share Sheet  
**Files:** `screens/Settings/DataExport.tsx`, `utils/exportService.ts`, `utils/importService.ts`

---

## User Stories

- As a user, I can export all my data as a JSON file so I have a backup if I lose my phone.
- As a user, I can import a previously exported backup to restore my data.
- As a user, I can export my workout history as CSV for analysis in a spreadsheet.

---

## Acceptance Criteria

### JSON Export (Full Backup)
- [ ] Exports all WatermelonDB data into a single JSON file.
- [ ] Includes: user_preferences, workout_sessions, exercise_entries, sets, exercise_ghost_cache, diet_logs, meal_entries, media_records (metadata only — not the actual files).
- [ ] File named: `gymtracker-backup-{YYYY-MM-DD}.json`.
- [ ] Opened via native Share Sheet (AirDrop, Files app, email, etc.).
- [ ] File size displayed before export ("Estimated: 2.4 MB").

### CSV Export (Workout History)
- [ ] Exports workout data as a flat CSV file.
- [ ] Columns: `date, exercise_name, set_number, weight, weight_unit, reps, rir, notes`.
- [ ] One row per set.
- [ ] File named: `gymtracker-workouts-{YYYY-MM-DD}.csv`.
- [ ] Opened via native Share Sheet.

### JSON Import (Restore)
- [ ] User selects a `.json` file via document picker.
- [ ] File is validated before import:
  - Must contain expected top-level keys.
  - Schema version must be compatible.
- [ ] Import is **merge-based** (not destructive):
  - Records with matching `client_uuid` → skip (existing data preserved).
  - Records with new `client_uuid` → insert.
- [ ] Confirmation dialog before import: "This will add X sessions, Y meals to your data. Existing data will not be overwritten."
- [ ] Progress indicator during import (for large backups).

### Media Note
- [ ] JSON export includes `media_records` metadata (file paths, pose types, dates).
- [ ] Actual media files (photos/videos) are **not included** in the JSON export (too large).
- [ ] Export screen shows a note: "Photos and videos must be backed up separately via your phone's file manager."

---

## Export Format

```json
{
  "version": "1.0.0",
  "exportedAt": "2026-08-17T01:00:00Z",
  "data": {
    "user_preferences": { ... },
    "exercises": [ ... ],
    "workout_sessions": [ ... ],
    "exercise_entries": [ ... ],
    "sets": [ ... ],
    "exercise_ghost_cache": [ ... ],
    "diet_logs": [ ... ],
    "meal_entries": [ ... ],
    "media_records": [ ... ]
  }
}
```

---

## Edge Cases

| Scenario | Expected Behavior |
|----------|------------------|
| Import file is not valid JSON | Error toast: "Invalid backup file." |
| Import file has unknown schema version | Warning dialog: "This backup was created with a newer version. Some data may not import correctly." |
| Import file has 10,000+ records | Progress bar shown. Import runs in batches of 100 records (WatermelonDB batch write) |
| User imports same backup twice | All records skipped (matching client_uuids). Toast: "No new data to import." |
| User exports with 0 workouts | Valid JSON exported with empty arrays. Toast: "Backup created (no workout data yet)." |

---

## Test Plan

### Unit Tests
```
exportService.test.ts:
  ✓ Exports all tables into correct JSON structure
  ✓ JSON includes version and exportedAt fields
  ✓ CSV has correct headers and one row per set
  ✓ Empty database produces valid export with empty arrays

importService.test.ts:
  ✓ Rejects non-JSON files
  ✓ Rejects JSON without required top-level keys
  ✓ Skips records with existing client_uuid
  ✓ Inserts records with new client_uuid
  ✓ Returns count of inserted vs. skipped records
  ✓ Handles large imports in batches
```

### E2E Tests (Detox)
```
✓ User exports data → file appears in Share Sheet
✓ User imports backup → data visible in workout history
```
