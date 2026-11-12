# Group Meet — Project State

**Last Updated:** 2026-11-12 — Sprint 008 complete: Meeting Types, Roles, and Pools
**Status:** SPRINT 008 COMPLETE — admins can create meeting types with named durations, roles with required counts, and pools of professionals. Migration 008 is applied to the live database and `professionals` is now server-only. Branch `sprint-008-meeting-types` holds the work locally (not pushed). Next: Sprint 009, client request on the new tables with a link per meeting type. Known gap: no admin password reset (R-015).

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
- Meeting type workspace at `/admin/meeting-types` (list, create, editor with durations, roles, thresholds, and pool); API under `/api/admin/meeting-types/**`; `lib/meeting-types.ts`
- Migration `supabase/migrations/008_meeting_types.sql` (applied), with preflight, post-check, and rollback SQL under `supabase/`
- Roster page and API no longer show or write tier (Decision 058)
- Admin header links: Meeting types, Professionals

## Recently Completed

### Sprint 008 — Meeting Types, Roles, and Pools

Completed:
- Stage A: preflight, migration, post-check, and rollback SQL; `lib/meeting-types.ts`; seven admin API routes; roster API and types lose tier. Operator ran the preflight, applied the migration twice, and ran the post-check.
- Stage B: admin nav links, meeting type list, create page, and editor (details, status toggle, thresholds, durations, roles, pool); roster components lose tier controls.
- Live database: five new tables, two seeded inactive meeting types, `requests` has nullable `meeting_type_id`, `duration_id`, `created_by_admin_id`; open policies removed from `professionals`.
- Decisions 057 to 063 recorded; R-013 resolved, R-014 mitigated, R-015 added.

Validation: `npx tsc --noEmit` and `npm run build` pass; signed-out requests are redirected or refused; operator post-check and walkthrough passed. No automated tests exist.

### Sprint 007 — Stabilize and Align

Completed:
- Method files committed on branch `chore/sprint-007-stabilize` (local, not pushed)
- `.gitignore` now tracks Architect Pack Markdown files; the large installer in that folder stays ignored and untouched
- `planning/DOMAIN.md`, `planning/DECISIONS.md` (047 to 056), `planning/RISKS.md`, `planning/QUESTIONS.md`, `docs/DATA_MODEL.md`, `docs/ARCHITECTURE.md`, and `AGENTS.md` aligned to the domain workflow and meeting-type model
- `docs/ARCHITECT_BRIEFING_SPEC.md` created
- Older STATE history moved verbatim to `planning/archive/STATE-through-sprint-005.md`

Validation: `npx tsc --noEmit` clean; `npm run build` passed (12 routes). No application code changed.

Older history: `planning/archive/STATE-through-sprint-005.md` and `planning/archive/STATE-sprint-006.md`.

## Next Actions

- Sprint 009: client request on the new tables, a link per meeting type (`/meet/<slug>`), and the home page list of active types (guarded if it changes data)
- Architect: plan an admin password reset sprint before the beta (R-015, Q-012)
- Architect: decide the development email safeguard and test inboxes with Sprint 010 (Q-011)
- Operator: push `sprint-008-meeting-types` and open a pull request when ready; start Resend sending-domain verification; move the installer out of `planning/architect-packs/`
- Operator: remove or leave inactive the walkthrough test meeting type and test professionals

## Blockers

- Resend sending domain is not verified; email reaches only the account owner (R-008)
- Live end-to-end submission has not been validated against Supabase and Resend
- Vercel project linkage and production environment variables are not validated
- `npm audit` advisories are unreviewed (R-006, R-012)
