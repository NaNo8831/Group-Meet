# ARCHITECT_BRIEFING

> Bounded current-state snapshot. The Builder refreshes this at every sprint close; the Architect reads it first at every sprint start. Not a log. No source code, secrets, or credentials. See `docs/ARCHITECT_BRIEFING_SPEC.md`.

**Project:** Group Meet
**Sprint just completed:** Sprint 007 — Stabilize and Align
**Last updated:** 2026-11-06

## Where things stand

The project folder now tells one story. The method files, the sprint history, and every planning document describe the same product: clients request a meeting through a link, professionals in a pool commit to times for the roles they can fill, and an admin approves before anything is confirmed. Meeting types become something an admin creates, with named lengths, required roles, and a pool of people. No app code changed, so the running app is exactly as it was. Next is Sprint 008, which builds the meeting type workspace.

## Executive summary

- **Business outcome:** Lets outside clients request a meeting with a team and books it once every required role has someone available and an admin approves.
- **Current focus:** Moving the beta onto the domain workflow with admin-defined meeting types, in nine sprints (007 to 015).
- **What is proven:** A client can submit the request form, admins can sign in and manage a professional roster, and the project builds cleanly. Planning documents, data model direction, and the road are now agreed and written down.
- **What is not live:** Meeting types, roles, and pools; professional magic links; admin pairing; client confirmation; scheduled jobs; email templates and a verified sending domain; Super Admin tools. Real form submission and email delivery are still unverified. The running meeting flow is still the legacy one.

## Current status

Phase: pre-beta, planning aligned. Branch `chore/sprint-007-stabilize` holds the Sprint 007 commits on top of the two unpushed fix commits. Nothing is pushed and no pull request exists. The live database matches the legacy flow plus the roster and admin tables.

## Since last sprint

- 120x method v22 files committed; all 35 manifest files match their recorded hashes.
- Architect Pack Markdown files are now tracked in git; the installer in that folder stays ignored and was not touched.
- `DOMAIN.md`, `DECISIONS.md` (047 to 056), `DATA_MODEL.md` (planned Sprint 008 section), `RISKS.md`, `QUESTIONS.md`, `ARCHITECTURE.md`, and `AGENTS.md` aligned. `docs/ARCHITECT_BRIEFING_SPEC.md` created. STATE trimmed with history archived.
- Roadmap row 007 is `done`.

## Architecture / file map

No change to application structure. See `docs/ARCHITECTURE.md`. New planning artifacts: `planning/ROADMAP.md`, `planning/STATUS.json`, `planning/archive/STATE-through-sprint-005.md`, `docs/ARCHITECT_BRIEFING_SPEC.md`. The legacy meetings flow (`app/api/meetings`, `app/api/responses`, `lib/quorum.ts`, `app/team`, `app/meetings`) is retired in Sprint 014.

## Decisions

047 to 056 in `planning/DECISIONS.md`: domain flow for the beta; admin-defined meeting types; named duration options; roles and pools replace tiers; per-type threshold; Admin and Super Admin split; admin-created requests deferred but allowed for in the model; client picks the final slot; one link per meeting type; packs tracked in git.

## Risks / watch-items

R-006 to R-012 in `planning/RISKS.md`. Highest: two parallel designs until Sprint 014 (R-007), unverified Resend domain (R-008), permissive legacy access rules including public read (R-009), no automated tests (R-011).

## Open questions for the Architect

Q-002 calendar format, Q-005 branding, Q-006 live database state, Q-007 which email templates, Q-008 default minimum responses, Q-009 beta size, Q-010 legacy `team_members` data. All in `planning/QUESTIONS.md`.

## Validation / test status

**Tests:** 0 passing, 0 failing.

No automated test suite exists. Typecheck and build pass. Sprint 007 changed no code. Not run: a live form submission, any email send, a deployed Vercel build, the admin bootstrap flow.

## Readiness signals

| Signal | Status | Detail |
| --- | --- | --- |
| Application tests | attention | No automated tests exist; typecheck and build pass. |
| Live submission | attention | A real form submission against Supabase has not been re-tested. |
| Email delivery | attention | Resend sending domain is not verified; email reaches only the account owner. |
| Delivery readiness | attention | Vercel linkage and production environment variables are not validated. |

## Evidence

- `npx tsc --noEmit`: exit 0, no output.
- `npm run build`: exit 0, 12 routes listed, `proxy` middleware present.
- `git diff --stat 6f29d3c3 -- app lib src supabase public`: no output (no application changes).
- `git check-ignore -v` on the installer and the Sprint 007 pack: only the installer is reported ignored (`.gitignore` line 26).
- Manifest hash check over `.120x/method-manifest.json` (35 files, line endings normalised): no missing or differing files.
- `grep -c "^| 04[7-9]\|^| 05[0-6]" planning/DECISIONS.md`: 10 rows (047 to 056).
- `git status --short` and `git log --oneline 6f29d3c3..HEAD`: see the final report; the only expected untracked or modified file is `next-env.d.ts`.

## Plan corrections

- The blueprint's staging list omitted `planning/ROADMAP.md`, `planning/STATUS.json`, and the sprint folder, which would have broken the clean-tree criterion. They were included in the final commit.
- The blueprint said to keep the follow-up fix as the one prior sprint in STATE. Sprint 006 and its follow-up are one unit, so both were kept; Sprint 005 and older went to the archive.
- `docs/ARCHITECTURE.md` said Super Admin work was "Sprint 014"; the roadmap puts it in Sprint 015, so the two mentions were corrected (the blueprint allowed one line only).
- `docs/ARCHITECTURE.md` still describes the legacy flow's current behavior in detail; that is accurate until Sprint 014 and was left as is.

## Recommended next Architect action

- **Do:** Plan Sprint 008 (meeting types, roles, and pools): name the tables, the migration, who applies it, and the seed and migration of today's tiers into pools.
- **Owner:** The Architect, with the operator.
- **Decision:** The default minimum responses per meeting type (Q-008), and whether to confirm live database state (Q-006) before the migration is written.

Operator housekeeping: move the installer out of `planning/architect-packs/`, confirm which migrations are applied, start Resend domain verification, and push the branch when ready.
