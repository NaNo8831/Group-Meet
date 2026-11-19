# ARCHITECT_BRIEFING

> Bounded current-state snapshot. The Builder refreshes this at every sprint close; the Architect reads it first at every sprint start. Not a log. No source code, secrets, or credentials. See `docs/ARCHITECT_BRIEFING_SPEC.md`.

**Project:** Group Meet
**Sprint just completed:** Sprint 009 — Client Request on the New Tables
**Last updated:** 2026-11-19

## Where things stand

A client can now open the link for a meeting type, pick one of its lengths, propose times, and send the request, and it shows up for admins on a new Requests page. The server checks every time (at least two full days ahead, on the quarter hour, within hours, spaced apart), and your walkthrough with a real request passed. Nothing is emailed yet, so no professional knows about a request. Next is Sprint 010, which makes email real. One practical note: the Supabase project paused itself after a week of quiet and had to be restored by hand, which is why a move to Neon is planned after Sprint 013.

## Executive summary

- **Business outcome:** Lets outside clients request a meeting with a team and books it once every required role has someone available and an admin approves.
- **Current focus:** Building the booking workflow on the domain model, now with the client side live and email next.
- **What is proven:** An admin can build meeting types; a client can open a type's link, choose a length, propose valid times, and submit; the request is saved correctly on the new tables and appears in the admin Requests list; the server refuses bad or tampered times; the database ties a request's length to its meeting type and keeps client data server-only.
- **What is not live:** No email goes out (no acknowledgement, no notice to professionals, no confirmation); professionals have no response page; there is no threshold, pairing, or client confirmation; there is no admin password reset; the database host (Supabase free plan) pauses when idle. The old meetings flow remains in the code but is not linked from any page.

## Current status

Phase: pre-beta, 3 of about 12 road sprints done (007, 008, 009). Branch `sprint-009-client-request` holds the Sprint 009 commits on top of `main` (not pushed, no pull request). The live database has migrations 005 to 009. The walkthrough left at least one test request and an active test meeting type in the live database.

## Since last sprint

- Migration 009 applied: required request links, a composite key tying a length to its meeting type, unique slot starts, server-only access on `requests` and `slots`.
- Public pages (`/`, `/meet/[slug]`, not-found), request API, request form with hidden trap field, and the picker rebuilt on the meeting type's lengths and the business time zone.
- Admin Requests page and nav link (read-only).
- Operator changes during the walkthrough: past times greyed out, then a two-full-calendar-days notice rule counted from midnight in the business time zone, with one small `minDate` prop added to `MonthCalendar`.
- Roadmap amended earlier this sprint: about 12 sprints, with Neon move sprints 017 and 018 after 013 and password reset (016) after them.

## Architecture / file map

- `lib/slot-rules.ts` (pure rules, shared with the picker), `lib/requests.ts` (validation), `lib/db/requests.ts` (the only new data access; plain functions, no Supabase types exposed).
- `app/api/meet/[slug]/requests/route.ts` (public), `app/api/admin/requests/route.ts`, `app/page.tsx`, `app/meet/[slug]/`, `app/admin/(protected)/requests/`.
- `src/components/MeetingRequest/`, `src/components/Requests/`, `src/components/DateTimePicker/` (picker driven by durations and time zone).
- `supabase/migrations/009_requests_new_model.sql` with preflight, post-check, and rollback SQL.
- Tables used by the new code: `meeting_types`, `meeting_type_durations`, `platform_settings`, `requests`, `slots`. None of the legacy tables or `professionals` are touched. Full map in `docs/ARCHITECTURE.md`.

## Decisions

064 to 072 in `planning/DECISIONS.md`: `/` lists active types and requests live at `/meet/<slug>`; server derives end times; slot rules (amended to two full calendar days notice); trap field and slot cap instead of CAPTCHA; admin Requests read-only; time zone from platform settings; required links, composite key, server-only tables; three portability rules; stay on Supabase through Sprint 013 with a planned Neon move.

## Risks / watch-items

- R-017 (new): Supabase's free plan pauses an idle project; the public pages then show a "could not load" message until the operator restores it.
- R-016 (new): the public request endpoint is unthrottled; matters once Sprint 011 emails professionals.
- R-015: no admin password reset. R-008: email delivery unproven until Sprint 010. R-011: no automated tests. R-006 and R-012: `npm audit` advisories unreviewed. R-007 and R-009: legacy flow and its open access rules until Sprint 014.
- Walkthrough test data (a test meeting type, test professionals, and at least one test request) is still in the live database.

## Open questions for the Architect

- Q-013: should the client get an acknowledgement email (a ninth template)?
- Q-011: the development email redirect setting and the 4 to 5 test inboxes.
- Q-007: which of the eight templates the beta needs. Q-014: confirm the Neon move at Sprint 013. Q-012 is answered by the amended road (016 after the move). Q-005, Q-009, Q-010, Q-002 unchanged.

## Validation / test status

**Tests:** 0 passing, 0 failing.

No automated test suite exists. Typecheck and build pass. The slot rules were run on their own with a fixed "now" (29 cases, all pass), but that was a one-off run, not a saved test. The operator ran the preflight, migration 009 twice, and the post-check in Supabase, and passed a walkthrough that included a real submission. A failed slots insert (the clean-up of the request) was never triggered.

## Readiness signals

| Signal | Status | Detail |
| --- | --- | --- |
| Application tests | attention | No automated tests exist; the slot rules were checked by a one-off run and the screens by the operator's walkthrough. |
| Live submission | passed | A real request went through `/meet/<slug>` on the live database and appeared on the admin Requests page with correct times. |
| Email delivery | attention | The app has sent no email yet; the Resend domain is reported verified but unproven until Sprint 010. |
| Hosting stability | attention | Supabase's free plan paused the project after a week of quiet; a move to Neon is planned (Sprints 017 and 018, confirmed at 013). |

## Evidence

- `npx tsc --noEmit`: exit 0. `npm run build`: exit 0; route list includes `/meet/[slug]`, `/admin/requests`, `/api/meet/[slug]/requests`, `/api/admin/requests`, and the legacy routes.
- Slot rules, run on their own with `node --experimental-strip-types` and a fixed "now": 29 of 29 cases pass. Notable cases: 45-minute length, 09:00 with 09:45 refused and 09:00 with 10:00 accepted; 75-minute length, 10:00 with 11:15 refused and 11:30 accepted; today and tomorrow refused and the day after tomorrow accepted; a late-evening "now" where a 48-hour clock rule would refuse but the calendar-day rule accepts; a case across the March daylight saving change; 07:00 and 06:00 in daylight and standard time; 30 days ahead and 31 times refused; the `US/Eastern` alias accepted.
- Dev server, rejection-only (nothing written): invalid JSON, missing or bad fields, and no times returned 400; an unknown link and the switched-off seeded link returned 404 (which also proved the database was reachable); a filled trap field returned 200 without a write; `GET /api/admin/requests` returned 401 signed out; `/` returned 200; `/meet/<unknown>` returned 404; `/admin/requests` redirected to login.
- Greps: no old type names or hour-based rule in the picker, home page, or `/meet`; only `lib/db/` imports the Supabase client in the new code; no `ends_at` in new server code; no `drop table`, `delete from`, or `truncate` in migration 009; no writes in the preflight; no changes to the legacy routes, `lib/validation.ts`, `lib/email.ts`, or `package.json`.
- Operator-run (reported by the operator): preflight reviewed; migration 009 applied twice; post-check showed `meeting_type_id` and `duration_id` required, the composite key present and the single-column key gone, the unique slots index, only `service_role` policies, and zero rows; walkthrough passed.

## Plan corrections

- The pack said "strictly in the future" for proposed times. The operator then asked for greyed-out past times at the gate, then a 48-hour rule, then two full calendar days from midnight. A minimum-notice question belongs in discovery; it changed the server rules, the picker, the calendar, and four plan files after Stage B.
- The blueprint forbade editing `MonthCalendar`. The notice rule needed a small optional `minDate` prop there, recorded as a deliberate exception.
- The pack file for Sprint 009 is now older than the sprint files (portability rules, Neon plan, and the notice rule were added to the sprint files after applying). The sprint files are authoritative.
- Running the preflight one query at a time took many round trips because the SQL editor shows only the last result. Future preflights and post-checks should be written to return one combined result, with a column for the expected value.
- The Supabase project paused between sessions, which the road did not anticipate. The roadmap now carries the Neon move; Sprint 016 (password reset) moved after it.
- Sprint 010's scope grew: the development email redirect (Q-011) and the acknowledgement email decision (Q-013) were added to it.

## Recommended next Architect action

- **Do:** Plan Sprint 010 (email foundation): templates stored in the database, real sending through the verified Resend domain, a development setting that redirects all outgoing mail to one inbox, and the client acknowledgement email decision.
- **Owner:** The Architect, with the operator.
- **Decision:** Which email templates the beta needs (Q-007), whether the client gets an acknowledgement email (Q-013), and which inboxes and sending address to use for testing.

Operator housekeeping: push `sprint-009-client-request` and open a pull request when ready, restore the Supabase project whenever it pauses, switch off or remove the walkthrough test meeting type and test requests, and move the installer out of `planning/architect-packs/`.
