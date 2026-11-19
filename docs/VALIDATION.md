# Group Meet — Validation Plan

## Approach
Phase 1 uses manual end-to-end testing. No automated test suite is required for v1 launch. The acceptance criteria in `planning/sprints/001-discovery-architecture/acceptance.md` serve as the validation checklist.

## Sprint 004 Validation Rules

The public request form now validates the domain-aligned request shape:
- `clientName` is required
- `clientEmail` is required and must be a valid email address
- `meetingType` is required and must be `in_depth` or `short_form`
- `slots` must include at least one `{ startsAt, endsAt }` item
- `endsAt` is derived from `startsAt + duration` by meeting type, not entered by the client
- The old 5-slot cap has been removed; the date picker constrains selections to today through 28 days from today
- The calendar is Sunday-first
- Time options on the same date are disabled when they would overlap an existing slot plus a 15-minute buffer
- `toApiSlots()` converts selected US/Eastern dates/times to ISO strings using `date-fns-tz`

Sprint 004 local validation:
- `npx tsc --noEmit` passed
- `npm run build` passed
- Console duration assertions passed for both Short-form 45-minute and In-depth 75-minute slot derivation
- Live submit currently fails until legacy `meetings.participant_name`, `meetings.participant_email`, and `meetings.topic` are nullable or defaulted (migration `007_relax_legacy_meeting_columns.sql` fixes this; re-test a live submit after applying it)

## Builder Validation Run — 2026-06-05

- `npm install` completed and generated `package-lock.json`.
- `npm run build` completed successfully with zero TypeScript errors.
- `npm run dev -- --hostname 127.0.0.1 --port 3000` smoke test returned HTTP 200 for `/`.
- `npm audit --json` completed; reported advisories remain because the available automated fix upgrades Next.js beyond the Sprint 001 Next.js 14 scope.
- Full Supabase/Resend email flow was not exercised locally because service credentials and a live Supabase project were not available in the repo.

## Critical Paths to Test Manually

### Path 1: Happy path — quorum on first two votes
1. Submit request form with 2 time slots
2. Open team voting page as a Leader — select slot 1
3. Open team voting page as a Support — select slot 1
4. Verify meeting status updates to confirmed
5. Verify all three confirmation emails received

### Path 2: Quorum requires multiple rounds
1. Submit request form with 3 time slots
2. Leader selects only slot 2 and slot 3
3. Support selects only slot 1 — no quorum yet
4. Support selects slot 2 — quorum met on slot 2 (earliest qualifying)
5. Verify slot 2 is confirmed, not slot 3

### Path 3: Meeting already confirmed
1. Confirm a meeting (Path 1)
2. Open a third team member's voting link
3. Verify voting form is replaced with "already confirmed" message
4. Verify no duplicate confirmation emails sent

### Path 4: Invalid inputs
1. Submit request form with missing fields — verify inline errors
2. Submit request form without a meeting type or proposed slot — verify inline errors and disabled submit behavior
3. Load `/meetings/[invalid-uuid]` — verify "Meeting not found"
4. Load voting page with unknown `member` param — verify graceful error

### Path 5: Email failure resilience
1. Temporarily set an invalid Resend API key
2. Submit request form
3. Verify meeting is still created in Supabase
4. Verify error is logged (check Vercel function logs)
5. Restore correct API key

## Deployment Checklist
- [ ] All env vars set in Vercel
- [ ] Supabase schema and seed applied to production project
- [ ] Test full happy path on production URL before sharing


## Sprint 008 Validation

Rules enforced by the database and repeated in `lib/meeting-types.ts`:
- Meeting type: title 1 to 120 characters; slug lowercase letters, digits, single hyphens, 3 to 60 characters, unique; description plain text up to 2000; `min_matched_slots` at least 1; `min_responses` null or at least 1.
- Duration: label 1 to 40, unique per meeting type; minutes 5 to 480 in steps of 5.
- Role: name 1 to 40, unique per meeting type; `required_count` at least 1.
- A pool role must belong to the same meeting type as its pool entry (composite foreign key).
- Turning a meeting type on needs at least one duration and one role. Removing the last duration or role of an active type is refused.

Evidence (2026-11-12):
- `npx tsc --noEmit` exit 0; `npm run build` exit 0 with 3 new admin pages and 7 new API routes.
- Signed out: the three admin pages redirect to `/admin/login` (307) and all new API routes return 401 for GET, POST, PATCH, PUT, DELETE.
- Operator ran the preflight, migration `008` twice, and the post-check in the Supabase SQL editor: five new tables with row security on and only `service_role` policies; no non-server policy on `professionals`; two seeded types with the expected durations and roles; `requests` new columns nullable.
- Not exercised: the pool-seeding rule (roster was empty), the role-integrity rule beyond viewing its constraint, and automated tests (none exist).
- Operator walkthrough passed: create a meeting type, refused activation without a duration and role, add durations and roles, assign a pool, activate, and view the list.


## Sprint 009 Validation

Rules enforced on the server (`lib/slot-rules.ts`, `lib/requests.ts`) and, for integrity, by the database:
- Name 1 to 120 characters; email valid, at most 254, stored lowercase; the duration must belong to the meeting type (composite foreign key).
- Start times: on or after the day two full calendar days ahead (midnight, business time zone); at most 29 days ahead; 15-minute marks from 07:00 to 21:00; 1 to 30 times; unique; at least length plus 15 minutes apart. A `slots` row cannot repeat a start within a request.
- A filled hidden trap field returns success and saves nothing.

Evidence (2026-11-19):
- `npx tsc --noEmit` and `npm run build` exit 0.
- Slot rules run on their own with a fixed "now": 29 cases pass, including spacing (45 and 75 minute lengths), today and tomorrow refused and the day after tomorrow accepted, a late-evening case where a 48-hour clock rule and the calendar-day rule disagree, a case across the March daylight saving change, 07:00 and 06:00 in daylight and standard time, the 30-day and 30-time limits, duplicates, off-grid minutes, and the `US/Eastern` alias.
- Public endpoint rejection cases against the dev server (nothing written): invalid JSON, missing or bad fields, no times, unknown link, and a switched-off link return 400 or 404; the trap field returns 200 without a database write. `GET /api/admin/requests` returns 401 signed out.
- Pages signed out: `/` returns 200; `/meet/<unknown or switched-off>` returns 404; `/admin/requests` redirects to `/admin/login`.
- Operator ran the preflight, migration `009` twice, and the post-check in the Supabase SQL editor (required links `NO` nullable, composite key present, single-column key gone, unique slots index, only `service_role` policies, zero rows).
- Operator walkthrough passed: active meeting type listed on `/`, landing page and length choice, times picked and refused correctly, a real request submitted and shown on the admin Requests page with correct times, turning the type off removes it, and the notice rule re-checked after each change.
- Not exercised: a failed slots insert (the clean-up of the request), a flood of requests, and automated tests (none exist).
