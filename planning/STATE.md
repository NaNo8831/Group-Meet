# Group Meet — Project State

**Last Updated:** 2026-11-19 — Sprint 009 complete: Client Request on the New Tables
**Status:** SPRINT 009 COMPLETE — a client can open `/meet/<slug>` for an active meeting type, choose a length, propose times (at least two full calendar days ahead), and submit; the request is saved on `requests` and `slots` with server-enforced rules, and admins see it on `/admin/requests`. Migration 009 is applied. Branch `sprint-009-client-request` holds the work locally (not pushed). Next: Sprint 010, email foundation. Known gaps: no email is sent yet, no admin password reset (R-015), and the Supabase free plan pauses when idle (R-017).

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
- Public home page `/` listing active meeting types; request page `/meet/[slug]`; request API `POST /api/meet/[slug]/requests`
- Slot rules in `lib/slot-rules.ts`, validation in `lib/requests.ts`, data access in `lib/db/requests.ts` (the first module behind the portability rule)
- Date/time picker driven by the meeting type's durations and the business time zone; calendar greys out days before the earliest allowed day
- Admin Requests page `/admin/requests` (read-only) and `GET /api/admin/requests`
- Migration `supabase/migrations/009_requests_new_model.sql` (applied), with preflight, post-check, and rollback SQL
- `planning/ROADMAP.md` now runs to about 12 sprints, including a planned move to Neon (Sprints 017 and 018)

## Recently Completed

### Sprint 009 — Client Request on the New Tables

Completed:
- Stage A: migration 009 (required links, composite key tying a request's length to its meeting type, unique slot starts, server-only access on `requests` and `slots`), pure slot rules, request validation, the `lib/db/requests.ts` data module, the public request route, and the admin requests route. Operator ran the preflight, applied the migration twice, and ran the post-check.
- Stage B: picker refactor, public pages (`/`, `/meet/[slug]`, not-found), request form with hidden trap field and "request received" panel, admin Requests page and nav link.
- Operator amendments during the walkthrough: past times greyed out, then the notice rule: two full calendar days ahead from midnight in the business time zone (Decision 066 amended; one small `minDate` prop added to `MonthCalendar`).
- Decisions 064 to 072 recorded; R-016 and R-017 added; Q-013 added; DOMAIN rule 26 added.

Validation: `npx tsc --noEmit` and `npm run build` pass; 29 slot-rule cases pass; rejection cases and signed-out paths checked against the dev server; operator post-check and walkthrough passed. No automated tests exist.

### Sprint 008 — Meeting Types, Roles, and Pools

Completed:
- Stage A: preflight, migration, post-check, and rollback SQL; `lib/meeting-types.ts`; seven admin API routes; roster API and types lose tier. Operator ran the preflight, applied the migration twice, and ran the post-check.
- Stage B: admin nav links, meeting type list, create page, and editor (details, status toggle, thresholds, durations, roles, pool); roster components lose tier controls.
- Live database: five new tables, two seeded inactive meeting types, `requests` has nullable `meeting_type_id`, `duration_id`, `created_by_admin_id`; open policies removed from `professionals`.
- Decisions 057 to 063 recorded; R-013 resolved, R-014 mitigated, R-015 added.

Validation: `npx tsc --noEmit` and `npm run build` pass; signed-out requests are redirected or refused; operator post-check and walkthrough passed. No automated tests exist.

Older history: `planning/archive/STATE-through-sprint-005.md`, `STATE-sprint-006.md`, and `STATE-sprint-007.md`.

## Next Actions

- Sprint 010: email foundation (templates in the database, real sending through the verified Resend domain, a development setting that redirects all outgoing mail to one inbox; decide the client acknowledgement email, Q-013). Guarded: it sends real email.
- Operator: push `sprint-009-client-request` and open a pull request when ready; restore the Supabase project whenever it pauses; remove or switch off the walkthrough test meeting type and requests; move the installer out of `planning/architect-packs/`
- Architect (when Sprint 013 closes): confirm or cancel the move to Neon (Q-014)

## Blockers

- The Resend sending domain is reported verified by the operator, but no email has been sent by the app yet (R-008 to be closed in Sprint 010)
- Supabase free plan pauses idle projects (R-017)
- Vercel project linkage and production environment variables are not validated
- `npm audit` advisories are unreviewed (R-006, R-012)
