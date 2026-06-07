# Group Meet — Project State

**Last Updated:** 2026-06-07 — Sprint 004 bug-fix pass completed with database constraint blocker
**Status:** SPRINT 004 PARTIAL — Calendar and time-slot conflict fixes are complete; submit failure is diagnosed as a live database legacy NOT NULL constraint that blocks compliant new-column-only inserts

## What Exists
- GitHub repo: https://github.com/NaNo8831/Group-Meet
- Next.js 16.2.7 App Router application scaffold
- Domain-aligned public request form at `/`
- Participant status page at `/meetings/[id]`
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

## Current Blocker

`POST /api/meetings` reaches Supabase, but the `meetings` insert fails because legacy columns still enforce NOT NULL:
- `participant_name`
- `participant_email`
- `topic`

Exact Supabase error observed during Sprint 004 bug-fix validation:

```text
null value in column "participant_name" of relation "meetings" violates not-null constraint
```

The failing row contained the new Sprint 004 values for `client_name`, `client_email`, and `meeting_type`, confirming that body parsing and zod validation succeeded and the code is not inserting legacy fields. To make the form submit successfully while respecting the instruction not to write legacy columns, the live database must make the legacy columns nullable or give them safe defaults.

## Recently Completed

### Sprint 004 Bug-Fix Pass

Completed:
- Changed `MonthCalendar` from Monday-first to Sunday-first
- Added duration-aware time-slot conflict blocking on the same date
- Disabled unavailable time options in the selector
- Made `+ Add time` choose the first available non-conflicting time instead of blindly adding a blocked default
- Removed temporary API debug logging after diagnosis
- Added a targeted API error for the remaining legacy schema constraint

Validation:
- `npx tsc --noEmit` passed
- `npm run build` passed
- Test POST to `/api/meetings` still returns 500 because the live database requires legacy NOT NULL columns that Sprint 004 is intentionally not writing

### Sprint 004 — Public Request Form Refactor

Completed.

Implemented:
- Replaced legacy public form fields with `clientName`, `clientEmail`, `meetingType`, and derived `slots`
- Removed `topic`, `participantName`, `participantEmail`, old start/end inputs, and the 5-slot validation cap from the public request form
- Added two meeting type cards for In-depth 75 min and Short-form 45 min
- Added Sunday-first calendar with disabled past dates and dates beyond 28 days
- Added per-date 15-minute time selectors from 07:00 through 21:00
- Added same-date time conflict blocking with a 15-minute buffer
- Added US/Eastern slot conversion with derived `endsAt` using `date-fns-tz`
- Updated `POST /api/meetings` to insert only `client_name`, `client_email`, and `meeting_type` for meeting identity/type
- Updated API, validation, and architecture documentation to match the new request shape

Validation:
- `npx tsc --noEmit` passed
- `npm run build` passed
- Console duration assertions passed for both 45-minute and 75-minute slot derivation
- `npm run dev -- --hostname 127.0.0.1 --port 3000` started successfully in foreground verification

Known accepted limitation: status pages, voting pages, and email helpers still depend on some legacy meeting fields and will be updated in future sprints. No changes were made to those areas in Sprint 004.

The live Supabase database still has legacy columns, but Sprint 004 does not write them:
- `participant_name`
- `participant_email`
- `topic`

### Sprint 003 — Architecture Documentation

Completed. `docs/ARCHITECTURE.md` was reconciled with the current codebase and future domain plan. No application code, migrations, or schema files were changed.

### Builder Operating Rule Update

Completed. `AGENTS.md` now includes explicit end-of-sprint planning document update criteria. No application code, production behavior, schema, migrations, or product documentation changed.

## Next Actions

- Relax or default legacy `meetings.participant_name`, `meetings.participant_email`, and `meetings.topic` constraints in the live Supabase database
- Plan a follow-up sprint for legacy ripple effects in status pages, voting pages, and email helpers
- Validate a live request submission against Supabase and Resend credentials
- Continue future domain workflow sprints for professional response, admin pairing, and client confirmation

## Sprint 003 Goal
Review and update `docs/ARCHITECTURE.md` so it accurately reflects:
- Current Sprint 001 implementation structure and legacy data model
- Future domain workflow from `planning/DOMAIN.md`
- Built, Partial, and Planned status for each major component
- Actual dependency versions from `package.json`, including Next.js `^16.2.7`
- Known gaps between the current codebase and the full domain specification

No application code, migrations, or schema files were changed.

## Sprint 002 Goal
Draft a planning-only future data model that supports the domain workflow in `planning/DOMAIN.md`:
- Future entities documented: `requests`, `slots`, `professionals`, `professional_responses`, `pairings`, `admins`, `magic_links`, `email_templates`, `platform_settings`
- Enum definitions documented for request status, meeting type, professional tier, professional role, role preference, admin role, magic link types, and email templates
- Existing Sprint 001 tables identified as legacy in open questions
- Migration strategy explicitly deferred to a future sprint
- No application code, migration files, schema files, or SQL changed

## Sprint 001 Goal
Deliver a fully working Group Meet v1:
- Next.js scaffold + all dependencies installed — complete
- Supabase schema created, RLS enabled, team members seeded — SQL files complete; must be applied in Supabase
- Participant request form at `/` — complete
- Participant status page at `/meetings/[id]` — complete
- Team voting page at `/team/meetings/[id]?member=[uuid]` — complete
- API routes: POST /api/meetings, POST /api/responses (with quorum logic) — complete
- All three Resend email types — implemented; requires `RESEND_API_KEY`
- Deployed to Vercel — pending external project/env configuration

## Blockers
- Live `meetings` table still requires legacy NOT NULL columns while Sprint 004 intentionally writes only `client_name`, `client_email`, and `meeting_type`
- Live end-to-end submission still requires valid Supabase connection string/keys in `.env.local` and Vercel env vars
- Resend account/API key and verified sending domain must be configured for email delivery validation
- Vercel project must be linked to GitHub repo and deployed for production validation
- npm audit still reports dependency advisories that require follow-up review

## Next After Sprint 001
- Phase 2 planning: magic link auth, calendar integration (.ics), admin dashboard

## Next After Sprint 002
- Architect/operator review of `docs/DATA_MODEL.md`
- Resolve open questions before writing migrations
- Future sprint to decide legacy table migration strategy for `team_members`, `meetings`, `time_slots`, and `responses`
