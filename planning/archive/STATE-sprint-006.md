# STATE history: Sprint 006 and its follow-up

> Verbatim copy of these sections of `planning/STATE.md`, moved here at Sprint 008 close. Finished history; do not read at session start.

### Sprint 006 Follow-up — Legacy Field Ripple Fixes

Completed:
- `lib/types.ts` `Meeting` now carries `client_name`, `client_email`, `meeting_type`; legacy `participant_*`/`topic` are optional
- `lib/format.ts` adds `clientName`, `clientEmail`, `meetingTitle` helpers (fall back to legacy fields on pre-Sprint 004 rows)
- Participant status page, team voting page, and all three email helpers now use the new fields
- Participant confirmation email is skipped with a logged error if no client email exists
- Migration `007_relax_legacy_meeting_columns.sql` applied by the operator to the live DB

Validation: `npx tsc --noEmit` clean; `npm run build` passed (12 routes). Not yet validated against live Supabase/Resend.

### Sprint 006 — Admin Authentication

Completed:
- `@supabase/ssr` installed; `lib/supabase-server.ts` and `lib/supabase-client.ts` created
- `proxy.ts` (Next.js 16 proxy file, replaces middleware.ts) protects `/admin/*` and `/api/admin/*`
- Unauthenticated `/admin/*` requests redirect to `/admin/login`; unauthenticated `/api/admin/*` requests return 401
- `app/admin/login/page.tsx` — clean email/password login form with inline error display
- `app/admin/(protected)/layout.tsx` — Server Component layout with email display and Sign out
- `app/admin/(protected)/AdminNav.tsx` — Client Component sign-out button
- `lib/auth.ts` — `getAuthenticatedAdmin()`, `getAuthenticatedAdminFromRequest()`, `isSuperAdmin()` helpers
- Role read fresh from `admins` table on every request; JWT role not trusted
- Admin role sync: matches by `auth_user_id`, falls back to email for bootstrap; backfills `auth_user_id` on first match
- Deactivated admins (`is_active = false`) denied with 403
- `/api/admin/me` endpoint for post-login admin verification
- All Sprint 005 TODO auth comments replaced with real auth checks in all three admin API routes
- `supabase/migrations/006_admin_auth.sql` — adds `auth_user_id uuid` to `admins`, unique index, RLS policies
- `docs/ADMIN_SETUP.md` — first Super Admin bootstrap instructions

Validation:
- `npx tsc --noEmit` — clean (no errors)
- `npm run build` — passed, 12 routes listed, no warnings

Note: Next.js 16 renamed `middleware.ts` → `proxy.ts` with export renamed from `middleware` to `proxy`.

Older history (Sprint 005 and earlier): `planning/archive/STATE-through-sprint-005.md`.

