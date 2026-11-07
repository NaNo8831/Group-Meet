# Group Meet — Project State

**Last Updated:** 2026-11-06 — Sprint 007 complete: Stabilize and Align
**Status:** SPRINT 007 COMPLETE — the 120x method files, the Architect Pack history, and every planning document are committed and describe one product: the domain workflow with admin-defined meeting types (Decisions 047 to 056). The road is in `planning/ROADMAP.md` (about 9 sprints, 007 to 015). Next: Sprint 008, meeting types, roles, and pools. No application code changed in Sprint 007.

## What Exists
- GitHub repo: https://github.com/NaNo8831/Group-Meet
- Next.js 16.2.7 App Router application scaffold
- Domain-aligned public request form at `/`
- Participant status page at `/meetings/[id]`
- Admin login page at `/admin/login` (email + password, Supabase Auth)
- Admin layout with email display and Sign out button (`app/admin/(protected)/layout.tsx`)
- `proxy.ts` protecting all `/admin/*` and `/api/admin/*` routes
- Auth helpers: `lib/supabase-server.ts`, `lib/supabase-client.ts`, `lib/auth.ts`
- `/api/admin/me` endpoint for admin identity/role verification
- `supabase/migrations/006_admin_auth.sql` — adds `auth_user_id` to `admins` table with RLS policies
- `docs/ADMIN_SETUP.md` — first Super Admin bootstrap instructions
- Professional roster page at `/admin/professionals`
- API routes: `GET/POST /api/admin/professionals`, `PATCH /api/admin/professionals/[id]`, `POST /api/admin/professionals/import`
- `src/components/ProfessionalRoster/` components: index, ProfessionalTable, AddProfessionalForm, CsvImportForm, types
- `supabase/migrations/005_professionals.sql` — creates `professional_tier` enum and `professionals` table (must be applied to live DB)
- Refactored `TimeSlotEditor` with inline chip layout, week grouping, ⋮ context menu with "Apply to all [Day]" and Delete
- Team voting page at `/team/meetings/[id]?member=[uuid]`
- API routes: `POST /api/meetings`, `POST /api/responses`
- Supabase schema and seed files under `supabase/`
- Resend email helper functions for team notification and confirmations
- Local validation completed: `npm run build`, dev server smoke test
- Dynamic meeting/status routes now await Next.js 16 `params`/`searchParams`
- Supabase page-load errors now log and render clean user-facing error messages
- Future domain data model draft at `docs/DATA_MODEL.md`
- Architecture documentation updated at `docs/ARCHITECTURE.md` with Built / Partial / Planned labels and current Next.js dependency version
- Builder operating rules now include end-of-sprint planning document update criteria in `AGENTS.md`
- Date/time picker components under `src/components/DateTimePicker/`
- `date-fns-tz` dependency for US/Eastern slot serialization
- `planning/ROADMAP.md` — the nine-sprint road (007 to 015)
- 120x method v22 files committed (`.120x/`, `.claude/`, `.agents/`, `templates/`, `scripts/`)
- Architect Pack `.md` files are tracked in git (`.gitignore` ignores only non-Markdown files in `planning/architect-packs/`)
- `docs/ARCHITECT_BRIEFING_SPEC.md` — describes the briefing shape
- `docs/DATA_MODEL.md` has a "Planned changes (Sprint 008)" section for the admin-defined meeting type model

## Recently Completed

### Sprint 007 — Stabilize and Align

Completed:
- Method files committed on branch `chore/sprint-007-stabilize` (local, not pushed)
- `.gitignore` now tracks Architect Pack Markdown files; the large installer in that folder stays ignored and untouched
- `planning/DOMAIN.md`, `planning/DECISIONS.md` (047 to 056), `planning/RISKS.md`, `planning/QUESTIONS.md`, `docs/DATA_MODEL.md`, `docs/ARCHITECTURE.md`, and `AGENTS.md` aligned to the domain workflow and meeting-type model
- `docs/ARCHITECT_BRIEFING_SPEC.md` created
- Older STATE history moved verbatim to `planning/archive/STATE-through-sprint-005.md`

Validation: `npx tsc --noEmit` clean; `npm run build` passed (12 routes). No application code changed.

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

## Next Actions

- Sprint 008: meeting types, roles, and pools (new tables, admin workspace; guarded — includes a migration)
- Operator: move the installer `planning/architect-packs/CursorUserSetup-x64-3.7.12.exe` out of the repo folder
- Operator: confirm which migrations (`005`, `006`) and the Super Admin bootstrap are applied in live Supabase (Q-006)
- Operator: start Resend sending-domain verification (DNS through Google Workspace) so Sprint 010 can send real email
- Push `chore/sprint-007-stabilize` and open a pull request when ready (not done in this sprint)

## Blockers

- Resend sending domain is not verified; email reaches only the account owner (R-008)
- Live end-to-end submission has not been validated against Supabase and Resend
- Vercel project linkage and production environment variables are not validated
- `npm audit` advisories are unreviewed (R-006, R-012)
