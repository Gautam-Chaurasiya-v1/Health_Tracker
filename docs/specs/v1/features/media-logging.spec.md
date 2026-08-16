# Technical Spec: Media Logging (Local Storage)

**Phase:** V1 (Local-Only)  
**Storage:** WatermelonDB (`media_records`) + device filesystem  
**Files:** `components/MediaPicker.tsx`, `components/WorkoutMediaAttach.tsx`, `screens/ProgressTimeline.tsx`, `components/ProgressPhotoCard.tsx`

---

## User Stories

- As a user, I can attach photos to a workout session (e.g., form check, gym selfie).
- As a user, I can attach a short video to an exercise to check my form.
- As a user, I can take progress photos (front, side, back) linked to my diet log day.
- As a user, I can attach a photo to a specific meal log (for portion reference).
- As a user, I can view a timeline of my progress photos over time.
- As a user, all media is stored on my phone — no cloud upload in V1.

---

## Acceptance Criteria

### Media Capture & Selection
- [ ] Photos: capture via camera or pick from gallery.
- [ ] Videos: record in-app only (no gallery video import in V1 — size risk).
- [ ] Compression before storage (never store raw camera output):
  - Photos: `react-native-compressor` → max 10MB output.
  - Videos: `react-native-compressor` → max 100MB, max 60 seconds.
- [ ] Hard reject (error toast) if compressed output exceeds limits.

### Workout Media
- [ ] Per **session**: up to 5 photos.
- [ ] Per **exercise entry**: up to 2 videos.
- [ ] Media linked via `session_id` or `entry_id` in `media_records`.
- [ ] Visible as thumbnail row below the exercise in WorkoutLogger.

### Diet Progress Media
- [ ] Per **diet log day**: up to 3 body progress photos (`pose_type`: front, side, back).
- [ ] `pose_type` required for progress photos. Enforced by UI (user selects pose before capture).
- [ ] Per **meal entry**: up to 1 meal photo.

### Local Storage
- [ ] On capture: file saved to `{AppDocumentsDir}/media/{uuid}.{ext}` via `react-native-fs`.
- [ ] `media_records` created in WatermelonDB with `local_uri` (relative path from app documents dir).
- [ ] All media displayed from local filesystem URI.
- [ ] Deleting a media record also deletes the file from the filesystem.

### Progress Timeline
- [ ] Dedicated screen: paginated list of progress photos in reverse chronological order.
- [ ] Each card: date, bodyweight (if logged that day), photo thumbnail.
- [ ] Side-by-side comparison: user can select two dates and view photos split-screen.
- [ ] Filter by pose type (front / side / back).

---

## Edge Cases

| Scenario | Expected Behavior |
|----------|------------------|
| User deletes media | Local file deleted, WatermelonDB record deleted |
| User logs body progress without a diet log for that day | Diet log auto-created on progress media save |
| Video exceeds 60 seconds | Recording stops automatically at 60s. Toast: "Max recording length is 60 seconds." |
| App storage low | Check available storage before capture. If < 500MB: warn user. If < 100MB: block capture |
| User has 50+ progress photos | Paginated timeline loads 20 at a time |
| User changes phone | Local media not automatically transferred. Use data export (see `data-export.spec.md`) to back up metadata; photos must be manually transferred via file manager |

---

## File Size Validation (Client-Side)

```typescript
const LIMITS = {
  photo:    10 * 1024 * 1024,   // 10MB
  video:    100 * 1024 * 1024,  // 100MB
};
```

---

## Integration Points

- `meal_entries.meal_photo_id` → `media_records.id` (local reference).
- Progress timeline reads from `media_records` WHERE `context = 'diet_progress'`.

---

## Test Plan

### Component Tests
```
MediaPicker.test.tsx:
  ✓ Shows camera and gallery options
  ✓ Calls compression before saving
  ✓ Rejects photo > 10MB after compression
  ✓ Saves to local filesystem with correct path
  ✓ Creates WatermelonDB record

ProgressTimeline.test.tsx:
  ✓ Renders list of progress photos sorted by date desc
  ✓ Shows local_uri thumbnail
  ✓ Loads next page on scroll (pagination)
  ✓ Filter by pose type correctly filters results
  ✓ Side-by-side comparison renders two selected photos
```

### E2E Tests (Detox)
```
✓ User takes body progress photo with pose selection → appears in timeline
✓ User views progress timeline → scrolls and loads more
```
