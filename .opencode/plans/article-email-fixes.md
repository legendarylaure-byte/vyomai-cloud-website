# Fix Articles, Email, and Delete Issues

## Problem 1: Seed Articles UUID Mismatch (BLOCKING)
**File:** `server/firebase-storage.ts:197`
**Bug:** `col("articles").doc(randomUUID()).set({ id: randomUUID(), ... })` — doc ID differs from stored `id` field. Delete and update fail for seeded articles.
**Fix:** Use same UUID for both:
```ts
const id = randomUUID();
await col("articles").doc(id).set({ id, ...a, createdAt: new Date().toISOString() });
```

## Problem 2: RESEND_API_KEY Not in getEmailConfig() Normal Path
**File:** `server/email-service.ts:89`
**Bug:** `smtpPassword` fallback chain missing `RESEND_API_KEY` in normal (DB) path.
**Fix:** Add `|| process.env.RESEND_API_KEY` at the end of the fallback chain.

## Problem 3: All Publish Buttons Show Loading on Any Toggle
**File:** `client/src/pages/admin/articles.tsx`
**Bug:** Single `togglePublishMutation` — all buttons share `isPending`.
**Fix:** Track which article ID is being toggled with a state variable, only show spinner for that article.

## Files to Modify
| File | Change |
|------|--------|
| `server/firebase-storage.ts:197` | Fix UUID mismatch in seedArticles |
| `server/email-service.ts:89` | Add `\|\| process.env.RESEND_API_KEY` fallback |
| `client/src/pages/admin/articles.tsx` | Add per-article toggle loading state |

## After Changes
```bash
git add -A && git commit -m "Fix seed articles UUID, email RESEND_API_KEY fallback, publish button states"
git push
npx vercel deploy --prod --yes
```

## Vercel Env Var to Set (manually in dashboard)
- `RESEND_API_KEY` = `re_PKnG5uo9_6e2obfgD2xBQoEGmCExpAtL7`
- `GOOGLE_CLIENT_ID` = `1075238017646-3pet24g62h7u6c6akaevq9ncennc1ru7.apps.googleusercontent.com` (verify it's still there)
- `VITE_GOOGLE_CLIENT_ID` = same as above (verify)
- `ADMIN_PASSWORD` = ADMIN_PASSWORD_PLACEHOLDER
