# Technical Spec: Google Calendar Sync

**Feature:** Weekly training plan builder + Google Calendar OAuth integration  
**PRD Reference:** Section 2.4  
**Dev 1 (Backend):** `workers/calendar-sync.worker.ts`, `services/google-calendar.service.ts`, `routes/calendar.ts`  
**Dev 2 (Frontend):** `screens/WeeklyPlanner.tsx`, `components/DayCard.tsx`, `screens/Settings/CalendarSync.tsx`

---

## User Stories

- As a user, I can build a weekly training split (e.g., Push Mon, Pull Tue, Legs Thu).
- As a user, I can connect my Google Calendar so my workout schedule is automatically added.
- As a user, if I modify my training plan, my calendar is automatically updated.
- As a user, if I disconnect my calendar, my workout events are not removed (they stay as historical records).

---

## Acceptance Criteria

### Weekly Plan Builder (UI)
- [ ] User sees a 7-day grid (Mon–Sun).
- [ ] Each day: tap to set a label (e.g., "Push Day", "Pull Day", "Rest").
- [ ] Optional: assign specific exercises to each day.
- [ ] Plan is saved immediately to local WatermelonDB + synced to server.
- [ ] One active plan per user.

### Google Calendar OAuth (CRITICAL SCOPE)
- [ ] OAuth scope: `https://www.googleapis.com/auth/calendar.events` (NOT `calendar` — avoids Google verification).
- [ ] Flow:
  1. User taps "Connect Google Calendar" in Settings.
  2. In-app browser opens Google OAuth consent screen (`expo-web-browser` or `react-native-app-auth`).
  3. Auth code returned to app via redirect URI.
  4. App sends auth code to `POST /calendar/auth`.
  5. Server exchanges code for `access_token` + `refresh_token`.
  6. Server stores `refresh_token` encrypted (AES-256) in `users.gcal_refresh_token_enc`.
  7. Client stores nothing related to Google tokens (server holds them).
  8. Response: `{ connected: true, calendarId, syncedAt }`.

### Calendar Event Creation
- [ ] Each training day in the weekly plan becomes a recurring Google Calendar event.
- [ ] Event template:
  - **Title:** `"💪 Push Day"`
  - **Duration:** 1.5 hours (default; user configurable in Phase 2)
  - **Recurrence:** `RRULE:FREQ=WEEKLY;BYDAY={day}` (e.g., BYDAY=MO)
  - **Calendar:** User's primary Google Calendar
  - **Description:** List of planned exercises for that day.
- [ ] "Rest" days: no event created.

### Plan Updates → Calendar Sync
- [ ] When user saves changes to weekly plan: `PUT /weekly-plan` triggers BullMQ `CalendarSyncJob`.
- [ ] Job: delete old recurring events → create new ones.
- [ ] Retry on failure with exponential backoff (max 5 retries over 10 minutes).
- [ ] Sync status exposed via `GET /calendar/sync-status`.

### Token Refresh (Server-Side)
- [ ] Google access tokens expire in 1 hour.
- [ ] Server `google-calendar.service.ts` handles token refresh automatically before each API call.
- [ ] Refresh flow:
  1. Decrypt `gcal_refresh_token_enc`.
  2. POST to `https://oauth2.googleapis.com/token` with `grant_type=refresh_token`.
  3. Use new access token for Calendar API call.
  4. Update stored encrypted refresh token if Google rotates it.
- [ ] If refresh fails (revoked/expired): mark `users.gcal_connected = false`, notify client via sync pull response.

### Disconnect
- [ ] `POST /calendar/disconnect`: revoke Google token, clear `gcal_refresh_token_enc`, set `gcal_connected = false`.
- [ ] Calendar events previously created are NOT deleted (user keeps historical data).
- [ ] Client shows "Disconnected" status in Settings.

---

## Edge Cases

| Scenario | Expected Behavior |
|----------|------------------|
| User revokes access from Google's account settings | Next sync attempt fails with 401. Backend marks disconnected. User notified in Settings. |
| User has no Google account | OAuth flow fails gracefully. Settings shows "Requires a Google account." |
| Calendar quota exceeded (Google API rate limit) | BullMQ job backs off and retries. Error surfaced in Settings if persists > 1 hour. |
| User changes training plan while sync is in progress | BullMQ job is idempotent — new job supersedes old one (using a named job key per user). |
| OAuth redirect URI mismatch | Google returns `redirect_uri_mismatch`. Error shown on screen. Dev must configure redirect URI in Google Cloud Console. |
| User offline when connecting calendar | OAuth requires connectivity. Show error: "Please connect to the internet to link Google Calendar." |

---

## Security Considerations

- **Refresh token never leaves the server.** Client only knows `connected: true/false`.
- **AES-256 encryption** of refresh token at rest. Encryption key in `ENCRYPTION_KEY` env var.
- **OAuth state parameter** (CSRF protection) validated in `/calendar/auth` endpoint.
- **Redirect URI** must be an exact match registered in Google Cloud Console.

---

## Integration Points

- `weekly-plan` CRUD: `PUT /weekly-plan` triggers calendar sync.
- `sync-protocol.md`: plan changes sync via standard data sync. Calendar sync is separate (BullMQ worker).
- `CalendarSyncJob` is a **named BullMQ job** (key: `calendar-sync:{userId}`) — duplicate jobs for same user are deduplicated.

---

## TDD Test Plan

### Unit Tests (Dev 1 — Backend)
```
google-calendar.service.test.ts:
  ✓ exchangeAuthCode() returns tokens on valid code
  ✓ exchangeAuthCode() throws INVALID_AUTH_CODE on bad code
  ✓ refreshAccessToken() returns new token
  ✓ refreshAccessToken() throws CALENDAR_DISCONNECTED on revoked refresh token
  ✓ createRecurringEvent() builds correct RRULE for each day of week
  ✓ createRecurringEvent() skips 'Rest' days
  ✓ deleteUserEvents() removes all events with gymtracker source tag
  ✓ encryptToken() / decryptToken() round-trip correctly

calendar-sync.worker.test.ts:
  ✓ Job is deduplicated per userId (second enqueue replaces first)
  ✓ Job retries on Google API 5xx
  ✓ Job marks gcal_sync_status = 'failed' after max retries
  ✓ Job creates correct number of events for a 5-day plan

routes/calendar.test.ts:
  ✓ POST /calendar/auth validates state param (CSRF)
  ✓ POST /calendar/auth returns 400 on missing authCode
  ✓ GET /calendar/sync-status reflects current connection state
  ✓ POST /calendar/disconnect clears token and marks disconnected
```

### Component Tests (Dev 2 — Frontend)
```
WeeklyPlanner.test.tsx:
  ✓ Shows 7-day grid
  ✓ Tapping a day opens label input
  ✓ Saving plan calls PUT /weekly-plan
  ✓ "Rest" days show a distinct visual state

CalendarSync.test.tsx (Settings screen):
  ✓ Shows "Connect Google Calendar" when disconnected
  ✓ Initiates OAuth flow on button tap
  ✓ Shows connected state + last sync time after connection
  ✓ Shows error state when sync_status = 'failed'
  ✓ Disconnect button calls POST /calendar/disconnect and updates UI
```
