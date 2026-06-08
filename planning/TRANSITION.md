# Claude Code Transition Handoff

**Project:** Group Meet  
**Last Updated:** 2026-06-08  
**Branch:** `docs/claude-code-handoff`

This handoff is for Claude Code taking over Builder work on Group Meet. Read `AGENTS.md` first every session and treat the written planning folder as the source of truth.

## Current Project Status

### What Has Been Built and Is Working

- Next.js App Router application scaffold upgraded to Next.js `^16.2.7`.
- Public request form exists at `/`.
- Participant status page exists at `/meetings/[id]`.
- Team voting page exists at `/team/meetings/[id]?member=[uuid]`.
- API routes exist:
  - `POST /api/meetings`
  - `POST /api/responses`
- Supabase schema and seed SQL files are present under `supabase/`.
- Resend email helper functions are implemented for team notification and confirmation emails.
- Date/time picker components exist under `src/components/DateTimePicker/`.
- Sprint 004 public request form refactor is implemented in code:
  - Client fields are `clientName`, `clientEmail`, and `meetingType`.
  - Meeting types are In-depth 75 min and Short-form 45 min.
  - Slots are selected through a Sunday-first calendar.
  - Past dates and dates more than 28 days out are disabled.
  - Time options use 15-minute increments from 07:00 through 21:00.
  - Same-date slot conflicts are blocked with a 15-minute buffer.
  - Slot `endsAt` values are derived from meeting type duration.
- Dynamic routes have been updated for Next.js 16 async `params` and `searchParams`.
- Supabase page-load errors log cleanly and render user-facing error states instead of crashing.
- Email failures are non-fatal and logged only.
- Quorum logic picks the earliest qualifying slot when multiple slots qualify.

### What Has Been Tested and Confirmed

- `npx tsc --noEmit` passed during Sprint 004 validation.
- `npm run build` passed during Sprint 004 validation.
- Local dev server startup with `npm run dev -- --hostname 127.0.0.1 --port 3000` was verified during Sprint 004.
- Console duration assertions passed for both 45-minute and 75-minute slot derivation.
- A test POST to `/api/meetings` reached Supabase, confirming request parsing and zod validation were working.
- The remaining `POST /api/meetings` failure was traced to live database legacy NOT NULL constraints, not to request body parsing.

### What Is Still Pending

- Live Supabase database must relax or default legacy `meetings` columns:
  - `participant_name`
  - `participant_email`
  - `topic`
- Full live request submission validation against Supabase and Resend credentials.
- Vercel project linkage, environment configuration, and production deployment validation.
- Follow-up work for legacy ripple effects in status pages, voting pages, and email helpers.
- Future domain workflow sprints for professional response, admin pairing, client confirmation, and related magic-link flows.
- npm audit advisories still need follow-up review.

## Known Issues

- Email sending is limited to Resend verified accounts only until a sending domain is configured.
- Full end-to-end smoke test is pending domain setup.
- UI/UX sweep has not yet been completed.
- `POST /api/meetings` is blocked against the current live database because legacy `meetings` columns still enforce NOT NULL constraints while Sprint 004 intentionally writes only the new fields.
- Resend delivery validation requires a valid `RESEND_API_KEY` and verified sender/domain configuration.

## Environment Setup

### Run Locally

Install dependencies if needed:

```powershell
npm install
```

Start the local development server:

```powershell
npm run dev
```

The app should then be available at the local Next.js dev URL, typically `http://localhost:3000`.

### Required Environment Variables

The required variable names are listed in `.env.example`. Do not commit real values.

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
RESEND_API_KEY
NEXT_PUBLIC_APP_URL
```

### Supabase Schema and Seed Locations

- Primary schema: `supabase/schema.sql`
- Primary seed data: `supabase/seed.sql`
- Additional domain schema draft: `supabase/Phase 1 Domain Schema for Request & Pairings.sql`
- Additional service-role RLS policy file: `supabase/Enable servis_role row security policies.sql`

## Recent Decisions

- Next.js was upgraded from 14 to 16.2.7.
- Next.js 16 requires async handling for route `params` and `searchParams`.
- `eslint-config-next` was updated to match Next.js 16.
- Email failures are non-fatal and logged only.
- Quorum picks the earliest qualifying slot.
- Meeting duration is fixed by meeting type:
  - In-depth = 75 minutes.
  - Short-form = 45 minutes.
- End time is never entered by the user; it is derived from start time plus duration.
- Slots are stored and displayed in the platform business timezone.
- Default platform timezone is US/Eastern.

## Next Tasks

- Complete a UI/UX sweep on all three pages:
  - Public request form at `/`
  - Participant status page at `/meetings/[id]`
  - Team voting page at `/team/meetings/[id]?member=[uuid]`
- Set up the Resend email domain through Google Workspace DNS.
- Relax or default the live Supabase legacy NOT NULL constraints on `meetings.participant_name`, `meetings.participant_email`, and `meetings.topic`.
- Run a full end-to-end smoke test once the email domain is live.
- Validate Vercel deployment and production environment variables.

## Claude Code Notes

- Read `AGENTS.md` first every session.
- Read `planning/STATE.md` second.
- All planning lives in `planning/`.
- Build from sprint files, not from memory.
- After an Architect Pack is applied, implement from generated sprint files under `planning/sprints/`, not from the pack file.
- Open a PR for every code change.
- Do not redefine scope or invent product behavior.
- Do not add auth, database, cloud sync, CRM, invoicing, or GitHub API automation unless explicitly authorized by an active sprint.
- Do not store secrets, API keys, passwords, tokens, or private credentials.
- Update `planning/STATE.md` at the end of each meaningful Builder session.
- Record durable decisions in `planning/DECISIONS.md`.
- Update architecture and validation docs only when the sprint changes make them inaccurate or incomplete.
