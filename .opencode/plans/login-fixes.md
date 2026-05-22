# Fix Login Issues

## Problem
- Password login fails: stored password hash doesn't match `ADMIN_PASSWORD` env var if it was changed after initial deploy
- Google login stuck at `gsi/transform`: missing `itp_support`, `useOneTap`, `cancel_on_tap_outside` props
- Firestore email lookup is case-sensitive, can create duplicate users on Google login
- Client hides real server errors behind generic "Invalid username or password"

## Planned Changes

### 1. `server/firebase-storage.ts` — Sync password on restart + case-insensitive email
- **`ensureAdminUser`**: After finding existing user, check if `ADMIN_PASSWORD` env var produces a different hash than stored; if so, update it. This makes password changes via Vercel env vars take effect immediately on restart.
- **`getUserByEmail`**: Query with lowercase comparison (store emails lowercase; query with both lowercased). Or alternatively, always store emails lowercase on create and always lowercase the search term.
- **`createUser`**: Normalize email to lowercase before storing.

### 2. `client/src/pages/admin-login-qr.tsx` — Fix Google Login + fix double `.json()` (already done)
- Add `itp_support={true}` to `<GoogleLogin>` component (fixes `gsi/transform` hang on Safari/Chrome with ITP)
- The double `.json()` bug was already fixed in previous commit

### 3. `client/src/App.tsx` — Fix GoogleOAuthProvider
- Add `useOneTap={false}` prop to prevent OneTap auto-sign-in from interfering with popup flow
- Add `cancel_on_tap_outside={false}` prop to prevent accidental dismissal

### 4. `client/src/pages/admin-login.tsx` — Fix double `.json()` + error handling
- Line 130-131: Remove extra `.json()` call (same bug as admin-login-qr.tsx had)
- Show the actual server error message instead of generic "Invalid username or password"

## Files to Modify
| File | Change |
|------|--------|
| `server/firebase-storage.ts:80-94` | Add password sync + email case-insensitive lookup |
| `client/src/pages/admin-login-qr.tsx:570-577` | Add `itp_support={true}` to `GoogleLogin` |
| `client/src/App.tsx:66` | Add `useOneTap={false}`, `cancel_on_tap_outside={false}` to `GoogleOAuthProvider` |
| `client/src/pages/admin-login.tsx:127-149` | Fix double `.json()` + show real error message |
