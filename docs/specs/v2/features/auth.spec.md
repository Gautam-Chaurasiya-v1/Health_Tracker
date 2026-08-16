# Technical Spec: Authentication

**Feature:** User Registration, Login, JWT Auth, and Token Management  
**PRD Reference:** Section 4 (Non-Functional), Section 5 (Technical Architecture)  
**Dev 1 (Backend):** `routes/auth.ts`, `services/auth.service.ts`, `middleware/jwt.guard.ts`  
**Dev 2 (Frontend):** `screens/Login.tsx`, `screens/Register.tsx`, token storage via `react-native-keychain`

---

## User Stories

- As a new user, I can register with email + password so I have a personal account.
- As a returning user, I can log in and receive a token so I can access my data.
- As a user, my session persists between app launches so I don't have to log in every time.
- As a user, if my session expires, I am silently re-authenticated via refresh token without being disrupted.

---

## Acceptance Criteria

### Registration
- [ ] Email must be unique. Duplicate email returns `409 EMAIL_EXISTS`.
- [ ] Password minimum 8 characters, hashed with **bcrypt (cost factor 12)** before storage.
- [ ] `displayName` 2–50 characters.
- [ ] `weightUnit` ('kg' or 'lbs') stored and applied globally.
- [ ] On success: returns `accessToken` (15-min JWT) + `refreshToken` (30-day, stored in DB as bcrypt hash).
- [ ] Client stores `refreshToken` in native secure storage (Keychain/Keystore), never in AsyncStorage.

### Login
- [ ] Timing-safe comparison for password check (prevent timing attacks).
- [ ] Returns same token pair as registration.
- [ ] On wrong credentials: `401 INVALID_CREDENTIALS` — no specificity about which field is wrong.

### Token Refresh
- [ ] `/auth/refresh` accepts `refreshToken`, validates against stored hash.
- [ ] On success: issues new `accessToken` + rotates `refreshToken` (old one invalidated).
- [ ] On expired/invalid token: `401 TOKEN_EXPIRED`. Client must redirect to Login screen.
- [ ] Refresh tokens are single-use (rotation prevents theft window).

### Logout
- [ ] `/auth/logout` invalidates the refresh token on the server.
- [ ] Client clears both tokens from Keychain/Keystore.

---

## Edge Cases & Error Handling

| Scenario | Expected Behavior |
|----------|------------------|
| Register with malformed email | `422` with field-level Zod error |
| Register with password < 8 chars | `422` with field-level error |
| Login while already logged in | Issue new token pair, invalidate old refresh |
| Refresh with already-used token (replay attack) | `401` and invalidate the entire token family |
| Concurrent requests with expiring token | Both retry refresh; second retry uses new token (client-side mutex) |
| User account soft-deleted | `401 ACCOUNT_DISABLED` |

---

## Security Considerations

- JWTs signed with HS256 using a secret ≥ 256 bits (from env `JWT_SECRET`).
- Separate `JWT_REFRESH_SECRET` for refresh tokens.
- `sub` claim = userId UUID.
- No sensitive data in JWT payload.
- Refresh token rotation with family invalidation (detect reuse = potential theft).
- Rate limit `/auth/login` to **10 requests/15 minutes per IP** to prevent brute force.

---

## Integration Points

- All protected routes: `JwtGuard` middleware validates `Authorization: Bearer <token>`.
- `JwtGuard` injects `req.userId` for downstream handlers.
- Refresh token hash stored in `users.refresh_token_hash` and `users.refresh_token_exp`.

---

## TDD Test Plan

### Unit Tests (Dev 1)
```
auth.service.test.ts:
  ✓ hashPassword() produces bcrypt hash
  ✓ verifyPassword() returns true for correct password
  ✓ verifyPassword() returns false for wrong password
  ✓ generateTokenPair() returns valid JWT + opaque refresh token
  ✓ verifyAccessToken() returns payload for valid token
  ✓ verifyAccessToken() throws for expired token
  ✓ rotateRefreshToken() invalidates old token, returns new pair
  ✓ rotateRefreshToken() throws INVALID_TOKEN for already-used token

jwt.guard.test.ts:
  ✓ Passes request when valid Bearer token present
  ✓ Returns 401 when no Authorization header
  ✓ Returns 401 when token is expired
  ✓ Returns 401 when token is malformed
```

### Integration Tests (Dev 1)
```
POST /auth/register:
  ✓ 201 on valid payload
  ✓ 409 on duplicate email
  ✓ 422 on invalid email format
  ✓ 422 on short password

POST /auth/login:
  ✓ 200 with valid credentials
  ✓ 401 with wrong password
  ✓ 401 with non-existent email

POST /auth/refresh:
  ✓ 200 with valid refresh token (rotates token)
  ✓ 401 with expired refresh token
  ✓ 401 with reused refresh token (replay)

POST /auth/logout:
  ✓ 204 and token invalidated
```

### E2E Tests (Dev 2)
```
Detox:
  ✓ User can complete registration flow
  ✓ User can log in and reach home screen
  ✓ App auto-refreshes token without user action
  ✓ Expired refresh token redirects to Login screen
```
