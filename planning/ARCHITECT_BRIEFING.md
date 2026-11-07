# ARCHITECT_BRIEFING

> Bounded current-state snapshot. The Builder refreshes this at every sprint close; the Architect reads it first at every sprint start. Not a log. No source code, secrets, or credentials. See `docs/ARCHITECT_BRIEFING_SPEC.md`.

**Project:** Group Meet
**Sprint just completed:** Sprint 006 follow-up (legacy field fixes) on top of Sprint 006 — Admin Authentication
**Last updated:** 2026-11-06

## Where things stand

The public request form, admin login, and professional roster page are built, and the live database now accepts new requests. The status page, team voting page, and emails were switched to the new client fields and build cleanly. The meeting flow itself (who gets emailed, who votes, how it confirms) still runs on the original Sprint 001 design, not the domain workflow in `DOMAIN.md`. Nothing has been tested end to end against live Supabase and Resend yet. Next is planning live beta testing, which is the Architect's call on scope.

## Executive summary

- **Business outcome:** Lets outside clients request a meeting with a team and books it once the right people are available, with admins managing who takes part.
- **Current focus:** Getting from a working scaffold to a live beta where admins can set up meetings, manage professionals, and control the emails people receive.
- **What is proven:** A client can fill in the request form (name, email, meeting type, proposed times). Admins can sign in, and manage a roster of professionals (add, CSV import, tier and active toggles). Typecheck and production build pass.
- **What is not live:** Real form submission and email delivery are unverified. Emails can only reach the Resend account owner until a sending domain is verified. The professional workflow in `DOMAIN.md` is unbuilt: magic links, professional response page, admin dashboard and pairing, client confirmation page, "No longer interested", scheduled jobs, Super Admin settings, email template editing, admin invites. Admin creation of meetings does not exist.

## Current status

Phase: pre-beta. Two parallel designs exist in the repo. The domain model (`requests`, `slots`, `professionals`, `pairings`, and others in `docs/DATA_MODEL.md`) is documented and mostly created in the database, but only `professionals` and `admins` are used by code. The running meeting flow uses legacy `meetings`, `time_slots`, `team_members`, and `responses`. Admin roster management and the meeting flow are not connected: the people who get emailed come from `team_members` (seeded by SQL), not from the `professionals` roster.

## Since last sprint

- Migration `007_relax_legacy_meeting_columns.sql` written and applied by the operator (drops NOT NULL on `meetings.participant_name`, `participant_email`, `topic`).
- `Meeting` type, status page, team voting page, and email helpers now use `client_name`, `client_email`, `meeting_type`, with fallback to legacy fields on old rows. Titles now show the meeting type, since the form no longer collects a topic.
- Participant confirmation email is skipped and logged if no client email exists.
- Both changes are committed locally on branch `fix/relax-legacy-meeting-columns` (not pushed, no PR yet).

## Architecture / file map

- `app/page.tsx`: public request form. `src/components/DateTimePicker/`: calendar and time-slot picker.
- `app/api/meetings/route.ts`: creates a legacy `meetings` row plus `time_slots`, emails all active `team_members`.
- `app/api/responses/route.ts` and `lib/quorum.ts`: legacy auto-confirm when one Leader and one Support share a slot.
- `app/meetings/[id]/`: client status page. `app/team/meetings/[id]/`: team voting page (member id in the query string, no magic link).
- `app/admin/login`, `app/admin/(protected)/`: admin login and protected layout. `proxy.ts`: protects `/admin/*` and `/api/admin/*`. `lib/auth.ts`: auth helpers.
- `app/admin/(protected)/professionals`, `app/api/admin/professionals/**`, `src/components/ProfessionalRoster/`: roster management on the new `professionals` table.
- `lib/email.ts`: Resend helpers with hardcoded text, sending from Resend's test address.
- `supabase/migrations/005`, `006`, `007`: roster, admin auth, legacy column relaxation. Older schema files live in `supabase/` root. Full map in `docs/ARCHITECTURE.md`.

## Decisions

Durable decisions are in `planning/DECISIONS.md` (001–046). Relevant to the next planning round:
- 001, 002, 006: duration is fixed by meeting type (In-depth 75, Short-form 45) and the user never sets it. The requested "meeting times / duration set up" may conflict with this.
- 007, 008: clients and professionals have no accounts, magic links only.
- 009, 010, 042–046: admin is invite-only with Admin and Super Admin roles. Email and password login. Role read fresh from the database every request.
- 011, 034: email templates are database-stored, Super Admin-editable, one active template per key.
- 018, 024: professionals give a Lead / Support / Either preference. Admin assigns the roles. In-depth tier can fill any role. General tier fills Short-form only.
- 031: professionals are soft-deleted via `is_active`.

## Risks / watch-items

- Email delivery is blocked on a verified Resend domain (DNS through Google Workspace). Until then, only the account owner can receive test emails.
- Two parallel designs (legacy meetings flow and domain model) risk building admin pages on the wrong tables. The Architect needs to say which is authoritative for the beta.
- `RISKS.md` and `QUESTIONS.md` still describe Sprint 001 and have not been refreshed. R-006 (Next.js 14 advisories) is outdated since the app is on Next.js 16.
- Team voting links carry the member id in the query string with no token. Accepted for the internal Phase 1 audience (R-002), but a beta with real professionals raises the stakes.
- RLS policies on legacy tables are permissive (`using (true)`), including public read on `meetings`, `time_slots`, and `responses`.
- No automated tests exist. Verification so far is typecheck, build, and manual checks.
- `npm audit` advisories were flagged earlier and not yet reviewed.
- Live database state for migrations `005` and `006` and the first Super Admin bootstrap (`docs/ADMIN_SETUP.md`) has not been confirmed by the operator.

## Open questions for the Architect

1. **Meeting creation:** does "admin creates a meeting" replace the public client request form, run alongside it, or mean an admin sets up an event that clients then book into?
2. **Duration:** is duration still fixed by meeting type (Decisions 001, 002, 006), or does the admin set it per meeting? If admin-set, which decisions are superseded?
3. **Roles:** does "professionals and roles" mean Lead and Support, In-depth and General tiers, or Admin and Super Admin permissions, or all three?
4. **Per-meeting people:** should professional import and manual entry be per meeting (a new meeting-to-person link) or stay a global roster that each meeting draws from?
5. **Titles:** meeting titles are a new field, since the form no longer collects a topic. Who sets them, and are they shown to clients and professionals?
6. **Email templates:** which of the eight templates in `DOMAIN.md` are needed for beta, and is Super Admin-only editing still required? The `email_templates` table exists, but there is no UI and no wiring.
7. **Legacy flow:** does the beta keep the legacy auto-confirm flow, or does it need the domain workflow (magic links, threshold, admin pairing) first? This decides whether the admin pages below can be built on `professionals`.
8. **Beta scope:** how many real users and what data volume, and what counts as "ready" for beta?
9. **Beta order of work:** the operator listed these in order: a real form submission test, email delivery on a verified Resend domain, then admin login and meeting setup with professionals and roles. Confirm this order.
10. **Q-002 to Q-005 in `QUESTIONS.md`:** calendar invites, slot preference, team management, and branding are all still open.

## Validation / test status

**Tests:** 0 passing, 0 failing.

No automated test suite exists (`tests/` holds only a README). `npx tsc --noEmit` is clean and `npm run build` passes with 12 routes after the latest changes. Not yet run: a live form submission against Supabase, any email send through Resend, a deployed Vercel build, and the admin bootstrap flow.

## Readiness signals

| Signal | Status | Detail |
| --- | --- | --- |
| Application tests | attention | No automated tests. Typecheck and build pass, but no end-to-end run has happened. |
| Live submission | attention | The database blocker is fixed per the operator, but a real form submission has not been re-tested. |
| Email delivery | attention | Resend sending domain is not verified, so emails reach only the account owner. |
| Delivery readiness | attention | Vercel linkage and production environment variables are not validated. |

## Evidence

- `npx tsc --noEmit`: no output (clean).
- `npm run build`: passed, 12 routes listed (`/`, `/admin/login`, `/admin/professionals`, `/api/admin/me`, `/api/admin/professionals`, `/api/admin/professionals/[id]`, `/api/admin/professionals/import`, `/api/meetings`, `/api/responses`, `/meetings/[id]`, `/team/meetings/[id]`, plus `/_not-found`) and the `proxy.ts` middleware.
- Migration `007` applied by the operator in the Supabase SQL Editor. This was reported by the operator and not independently verified.
- `git log`: two local commits on `fix/relax-legacy-meeting-columns` (`71945703`, `6f29d3c3`), not pushed.

## Plan corrections

- `DOMAIN.md` and the data model describe a full request, pairing, and magic-link workflow, but the code was built incrementally on the legacy meeting design. The Sprint 004 and 005 plans did not say which tables each page should use, which caused the roster to be built on `professionals` while meetings stayed on `team_members`.
- The Sprint 004 plan changed the form fields without a matching database migration, which blocked submissions until migration 007.
- The `planning/sprints/` folder contains only Sprint 001, and the Architect Packs for later sprints are git-ignored, so the sprint history is not recoverable from the repo.

## Recommended next Architect action

- **Do:** Decide how admin-created meetings fit with the client request form, and which tables the beta runs on, then write Architect Pack 007 for live beta setup. Order the work: real submission test and Resend domain verification first, then admin meeting setup, professionals and roles, then meeting titles and email templates.
- **Owner:** The operator, with the Architect.
- **Decision:** Whether the beta keeps the legacy auto-confirm flow or moves to the domain workflow (magic links, threshold, admin pairing), and whether meeting duration stays fixed by type.

Supporting context: the operator wants admin users to be able to create meetings, import and manually enter professionals per meeting, set meeting times and durations, and manage meeting titles, email templates, and communication. They also want a real form submission test, a verified Resend email domain, and admin login with meeting setup. The Architect should create `planning/ROADMAP.md` alongside the pack, since none exists yet.
