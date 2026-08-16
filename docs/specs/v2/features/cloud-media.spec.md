# Technical Spec: Cloud Media Pipeline

**Phase:** V2  
**Prerequisite:** V1 media logging (local storage) must be working  
**Adds:** Cloudflare R2 upload, presigned URLs, BullMQ media workers

---

## What V2 Adds Over V1

V1 stores all media on the device filesystem. V2 upgrades this with:

1. **Cloud backup** — media files uploaded to Cloudflare R2 for durability
2. **Presigned URLs** — direct client-to-R2 upload (no backend proxy)
3. **Background upload worker** — BullMQ job processes pending uploads asynchronously
4. **Cross-device access** — media viewable from any authenticated device via presigned GET URLs
5. **Privacy** — all R2 objects are private; accessed only via time-limited presigned URLs (15-min TTL)

## Upload Flow

```
Step 1: Data sync completes (session/set records synced)
Step 2: MediaSyncWorker queries: media_records WHERE sync_status = 'pending'
Step 3: For each pending media:
  a. POST /media/upload-url → { mediaId, uploadUrl, expiresAt }
  b. HTTP PUT to uploadUrl with file binary (direct to R2)
  c. PATCH /media/{mediaId}/confirm on success
  d. WatermelonDB: sync_status = 'uploaded', remote_url set

On failure: retry 3× with exponential backoff (2s, 4s, 8s)
After 3 failures: sync_status = 'failed', retry next session
On presigned URL expiry (403): re-request URL, retry
```

## API Endpoints

```
POST   /media/upload-url              → generate presigned R2 PUT URL
PATCH  /media/{mediaId}/confirm       → confirm upload complete
DELETE /media/{mediaId}               → delete record + R2 object
GET    /media/{mediaId}/view-url      → presigned GET URL (15-min TTL)
GET    /diet/logs/{date}/progress-media → list progress media for date
GET    /progress-timeline              → paginated progress timeline
```

## Server-Side Validation

```typescript
const LIMITS = {
  photo:         10 * 1024 * 1024,   // 10MB
  video_workout: 100 * 1024 * 1024,  // 100MB
  video_scan:    50 * 1024 * 1024,   // 50MB
};
```

## Changes to V1 Media Records

No schema changes needed — V1 `media_records` table already has:
- `remote_url` (string, optional) — populated after R2 upload
- `sync_status` ('pending' | 'uploaded' | 'failed') — tracks upload state

V2 adds usage of these fields. V1 leaves them as null/'pending'.
