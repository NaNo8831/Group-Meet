# ARCHITECT_BRIEFING

> Bounded current-state snapshot. The Builder refreshes this at every sprint close; the Architect reads it first at every sprint start. Not a log. No source code, secrets, or credentials. See `docs/ARCHITECT_BRIEFING_SPEC.md`.

**Project:** Group Meet
**Sprint just completed:** Sprint 008 — Meeting Types, Roles, and Pools
**Last updated:** 2026-11-12

## Where things stand

An admin can now build a meeting type from scratch: a title and link, named lengths like Short 30 or Long 60, the roles each meeting needs and how many people for each, and a pool of professionals who can fill them. It works end to end for the admin side, and the live database has the new tables and is locked down so only the server can reach professionals' contact details. Clients still cannot use any of it yet, so the next step is Sprint 009: the public link where a client picks a length and proposes times. One real gap showed up: there is no way to reset an admin password.

## Executive summary

- **Business outcome:** Lets outside clients request a meeting with a team and books it once every required role has someone available and an admin approves.
- **Current focus:** Moving the beta onto the domain workflow, now with admin-defined meeting types in place and the client-facing side next.
- **What is proven:** An admin can sign in, manage the professional roster, and create and configure meeting types with durations, roles, and pools. The live database accepted the migration twice with no error, the post-check passed, and professionals' data is no longer reachable with the public key.
- **What is not live:** Clients cannot request through a meeting type (no public link yet), no email goes through the new model, professionals have no response page, there is no threshold or pairing, and there is no admin password reset. The old meetings flow still runs the real client form.

## Current status

Phase: pre-beta, stage 2 of 9 on the road. Branch `sprint-008-meeting-types` holds four local commits on top of `main` (not pushed, no pull request). The live database has migration 008 applied. The two seeded meeting types and any walkthrough test data are inactive or test-only.

## Since last sprint

- Migration 008 applied: five new tables, two seeded inactive meeting types, nullable links on `requests`, server-only access on the new tables and on `professionals`.
- Admin API (seven route files) and admin screens (list, create, editor with durations, roles, thresholds, pool) built and walked through by the operator.
- Roster: tier toggle, column, and field removed; the database column remains until Sprint 014.
- Docs updated: DECISIONS 057 to 063, RISKS R-013 to R-015, QUESTIONS Q-006 and Q-008 resolved and Q-011 and Q-012 added, DATA_MODEL, ARCHITECTURE, API, VALIDATION. Sprint 006 history archived.

## Architecture / file map

- `lib/meeting-types.ts`: types, validation, slug, readiness, database error mapping.
- `app/api/admin/meeting-types/**`: seven routes. `app/admin/(protected)/meeting-types/**`: list, new, editor. `src/components/MeetingTypes/`: the screens' components.
- `supabase/migrations/008_meeting_types.sql` with `supabase/preflight/008_preflight.sql`, `008_postcheck.sql`, and `supabase/rollbacks/008_meeting_types_rollback.sql`.
- Tables used by the new code: `meeting_types`, `meeting_type_durations`, `meeting_type_roles`, `meeting_type_pool`, `meeting_type_pool_roles`, and `professionals` (read). None of it touches the legacy tables. Full map in `docs/ARCHITECTURE.md`.

## Decisions

057 to 063 in `planning/DECISIONS.md`: no default minimum responses, tier removed from the roster, free-text roles and durations with inactive-by-default and an activation rule, public link at `/meet/<slug>`, server-only access for the new tables, seeded pools derived from tier once, snake_case admin API.

## Risks / watch-items

- R-015 (new): no admin password reset; a lockout of the only Super Admin is possible. Passwords are set in the Supabase dashboard for now.
- R-008: Resend sending domain not verified, so email reaches only the account owner.
- R-007 and R-009: legacy flow and its permissive access rules remain until Sprint 014. `requests` and `admins` keep a Phase 1 policy tied to the public role but limited by a condition.
- R-011: no automated tests. R-006 and R-012: `npm audit` advisories unreviewed.
- Walkthrough test data (a test meeting type and three test professionals with fake emails) may still be in the live database.

## Open questions for the Architect

- Q-012: where password reset goes on the road (recommended: its own small guarded sprint before the beta).
- Q-011: a development email setting that redirects all outgoing mail to one inbox, and the test inboxes for the beta check (plus-addressing once the domain is verified).
- Q-005 branding, Q-007 which email templates the beta needs, Q-009 beta size, Q-010 legacy `team_members` data, Q-002 calendar format.

## Validation / test status

**Tests:** 0 passing, 0 failing.

No automated test suite exists. Typecheck and build pass. The operator ran the preflight, the migration twice, and the post-check in Supabase, and walked through the admin screens. The pool-seeding rule was not exercised because the roster was empty when the migration ran.

## Readiness signals

| Signal | Status | Detail |
| --- | --- | --- |
| Application tests | attention | No automated tests exist; typecheck and build pass and the operator walked through the screens. |
| Live submission | attention | A real client request has not been run through the new model; that arrives in Sprint 009. |
| Email delivery | attention | Resend sending domain is not verified; email reaches only the account owner. |
| Admin access recovery | attention | No password reset page; a lost password must be fixed in the Supabase dashboard. |

## Evidence

- `npx tsc --noEmit`: exit 0, no output.
- `npm run build`: exit 0; the route list includes `/admin/meeting-types`, `/admin/meeting-types/new`, `/admin/meeting-types/[id]`, and seven `/api/admin/meeting-types…` routes.
- Dev server smoke test while signed out (port 3107, then stopped): the three admin pages returned 307 to `/admin/login`; the API returned 401 for GET, POST, PATCH, PUT, and DELETE.
- `grep -rn "tier" app/api/admin/professionals src/components/ProfessionalRoster`: no output.
- `grep -inE "drop table|delete from|truncate"` on the migration: no output. Write-statement grep on the preflight: no output.
- `git diff --stat main..HEAD` for the legacy flow, date/time picker, and `package.json`: no output. All other changed paths are within the sprint's `owns` list.
- Slug example: `slugify("In-Depth Intro, Part 2!")` returned `in-depth-intro-part-2`.
- Operator-run in the Supabase SQL editor (reported by the operator): preflight results reviewed; migration applied twice; post-check showed five tables with row security on, only `service_role` policies, no non-server policy on `professionals`, two seeded types with the expected durations and roles, nullable request columns, and the foreign key that blocks a role from another meeting type. A read-only check of `admins` and the Auth user (run by the Builder with the project keys) showed the email matches exactly.

## Plan corrections

- The pack put two roster components in Stage B, but the build would not compile after Stage A removed tier from the roster types, so they moved into Stage A.
- The migration originally left the Phase 1 "service role full access" policy on `professionals`. It is tied to the public role, so it would have failed the sprint's own acceptance rule; the migration now drops it too (the preflight showed it existed).
- The pool-seeding acceptance check could not discriminate right and wrong implementations because the live roster was empty (0 and 0). The rule is correct by reading but unproven.
- The pack named the pool body `roleIds`; the built API uses `role_ids` to match the rest of the admin API (Decision 063).
- The roadmap has no sprint for admin password reset or for a development email safeguard. Both showed up during testing (a login lockout and the 4 to 5 inbox need). The Architect should amend the road next session.
- The blueprint did not say how to treat a stale session after recreating an Auth user. The operator hit "not authorized" until the dev server was restarted. Admin sign-in errors cannot tell "no session" from "no admin record".

## Recommended next Architect action

- **Do:** Plan Sprint 009 (client request on the new tables with `/meet/<slug>`, a duration choice, and the home page list of active types) and add a small admin password reset sprint to the road before the beta; include the development email safeguard in Sprint 010.
- **Owner:** The Architect, with the operator.
- **Decision:** Whether password reset is its own sprint or part of Sprint 015, and how Sprint 009 treats the existing public form on `/` while the legacy flow still runs.

Operator housekeeping: push `sprint-008-meeting-types` and open a pull request when ready, remove or leave inactive the test meeting type and test professionals, start Resend domain verification, and move the installer out of `planning/architect-packs/`.
