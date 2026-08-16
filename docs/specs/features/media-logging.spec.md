# Technical Spec: Media Logging (Workout + Diet)

**Feature:** Photo/video attachment to workout sessions, exercises, diet progress, and meals  
**PRD Reference:** Section 2.3, Section 3.2  
**Dev 1 (Backend):** `routes/media.ts`, `workers/media-upload.worker.ts`, R2 presigned URL generation  
**Dev 2 (Frontend):** `components/MediaPicker.tsx`, `components/WorkoutMediaAttach.tsx`, `screens/ProgressTimeline.tsx`, `components/ProgressPhotoCard.tsx`

---

## User Stories

- As a user, I can attach photos to a workout session (e.g., form check, gym selfie).
- As a user, I can attach a short video to an exercise to check my form.
- As a user, I can take or upload progress photos (front, side, back, 360° scan) linked to my diet log day.
- As a user, I can attach a photo to a specific meal log (for portion reference).
- As a user, I can view a timeline of my progress photos over time.
- As a user, all media works offline — captured and stored locally, uploaded when connected.

---

## Acceptance Criteria

### Media Capture & Selection
- [ ] Photos: capture via camera or pick from gallery.
- [ ] Videos: record in-app only (no gallery video import in Phase 1 — security/size risk).
- [ ] Compression before storage (never store raw camera output):
  - Photos: `react-native-compressor` → max 10MB output.
  - Videos: `react-native-compressor` → max 100MB, max 60 seconds (workout), 50MB / 30 seconds (body scan).
- [ ] Hard reject (error toast) if compressed output exceeds limits.

### Workout Media
- [ ] Per **session**: up to 5 photos.
- [ ] Per **exercise entry**: up to 2 videos.
- [ ] Media linked via `session_id` or `entry_id` in `media_records`.
- [ ] Visible as thumbnail row below the exercise in WorkoutLogger.

### Diet Progress Media
- [ ] Per **diet log day**: up to 3 body progress photos (`poseType`: front, side, back).
- [ ] Optional: 1 scan video per day (30 sec, 50MB max).
- [ ] `poseType` required for progress photos. Enforced by UI (user selects pose before capture).
- [ ] Per **meal entry**: up to 1 meal photo.

### Offline Storage
- [ ] On capture: file saved to `{AppDocumentsDir}/media/{uuid}.{ext}` via `react-native-fs`.
- [ ] `media_records` created in WatermelonDB with `local_uri` and `sync_status: 'pending'`.
- [ ] `local_uri` stored as relative path from app documents directory (not absolute, for portability).

### Cloud Sync (Upload Flow)
- [ ] After data sync completes, `MediaSyncWorker` picks up `media_records` WHERE `sync_status = 'pending'`.
- [ ] `POST /media/upload-url` → receive `{ mediaId, uploadUrl, expiresAt }`.
- [ ] `PUT uploadUrl` with file binary (direct to R2, not through backend).
- [ ] `PATCH /media/{mediaId}/confirm` on success.
- [ ] WatermelonDB updated: `remote_url` set, `sync_status: 'uploaded'`.
- [ ] On upload failure: retry 3× with exponential backoff. After 3 failures: `sync_status: 'failed'`.
- [ ] Presigned URL expiry (403 from R2): re-request URL, retry upload.

### Privacy
- [ ] No media is ever publicly accessible. All R2 objects are private.
- [ ] Remote URLs stored in DB are the R2 object keys, not public URLs.
- [ ] When app needs to display media: `GET /media/{mediaId}/view-url` returns a fresh presigned GET URL (15-min TTL).
- [ ] Media is never shared between users.

### Progress Timeline
- [ ] Dedicated screen: paginated list of progress photos in reverse chronological order.
- [ ] Each card: date, bodyweight (if logged that day), photo thumbnail.
- [ ] Side-by-side comparison: user can select two dates and view photos split-screen.
- [ ] Filter by pose type (front / side / back / scan).

---

## Edge Cases

| Scenario | Expected Behavior |
|----------|------------------|
| User attaches photo offline, never gets online | Photo stays in local filesystem, `sync_status: 'pending'`. Shown from `local_uri`. |
| User deletes media before upload | Local file deleted, WatermelonDB record marked for delete, no upload attempted. |
| User logs body progress without a diet log for that day | Diet log auto-created on progress media save. |
| Video exceeds 60 seconds | Recording stops automatically at 60s. Toast: "Max recording length is 60 seconds." |
| App storage low | Check available storage before capture. If < 500MB: warn user. If < 100MB: block capture. |
| User changes phone | Local media not automatically transferred. Remote media accessible via presigned URLs after login. |
| Presigned upload URL expires (15 min passed) | Client catches 403, re-requests new URL, retries automatically. |
| User has 50+ progress photos | Paginated timeline loads 20 at a time. Thumbnails shown from local_uri if not yet synced. |

---

## API Endpoints (Dev 1)

```
POST /media/upload-url           → generate presigned R2 PUT URL
PATCH /media/{mediaId}/confirm   → confirm upload complete
DELETE /media/{mediaId}          → delete record + R2 object
GET /media/{mediaId}/view-url    → generate presigned R2 GET URL (15 min TTL)
GET /diet/logs/{date}/progress-media → list progress media for date
GET /progress-timeline           → paginated progress media timeline
```

### File Size Validation (Server)
```typescript
// validators/media.validator.ts
const LIMITS = {
  photo:    10 * 1024 * 1024,   // 10MB
  video_workout: 100 * 1024 * 1024, // 100MB
  video_scan:    50 * 1024 * 1024,  // 50MB
};
```

---

## Integration Points

- `meal_entries.meal_photo_id` → `media_records.id` (optional FK).
- `sync-protocol.md` Section 7: Media Sync Flow.
- R2 bucket: `gymtracker-media-{env}`.

---

## TDD Test Plan

### Unit Tests (Dev 1 — Backend)
```
media.service.test.ts:
  ✓ generateUploadUrl() returns valid presigned URL and mediaId
  ✓ generateUploadUrl() rejects photo > 10MB
  ✓ generateUploadUrl() rejects video > 100MB
  ✓ confirmUpload() updates sync_status to 'uploaded'
  ✓ confirmUpload() returns 404 for unknown mediaId
  ✓ deleteMedia() removes DB record and enqueues R2 delete job
  ✓ generateViewUrl() returns presigned GET URL with 15-min TTL
  ✓ generateViewUrl() returns 404 for non-existent media
  ✓ generateViewUrl() returns 403 if requesting user != media owner

media-upload.worker.test.ts:
  ✓ Worker picks up pending media records from queue
  ✓ Worker marks record 'uploaded' on success
  ✓ Worker retries on transient failure (up to 3x)
  ✓ Worker marks 'failed' after 3 retries
```

### Component Tests (Dev 2 — Frontend)
```
MediaPicker.test.tsx:
  ✓ Shows camera and gallery options
  ✓ Calls compression before saving
  ✓ Rejects photo > 10MB after compression
  ✓ Saves to local filesystem with correct path
  ✓ Creates WatermelonDB record with sync_status 'pending'

ProgressTimeline.test.tsx:
  ✓ Renders list of progress photos sorted by date desc
  ✓ Shows local_uri thumbnail if not yet uploaded
  ✓ Shows remote presigned URL thumbnail if uploaded
  ✓ Loads next page on scroll (pagination)
  ✓ Filter by pose type correctly filters results
  ✓ Side-by-side comparison renders two selected photos
```

### E2E Tests (Dev 2 — Detox)
```
✓ User attaches photo to workout session offline → syncs when online
✓ User takes body progress photo with pose selection → appears in timeline
✓ User views progress timeline → scrolls and loads more
```
