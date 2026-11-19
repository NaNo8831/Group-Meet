============================================================
FILE: planning/sprints/009-client-request-new-tables/requirements.md
============================================================

# Sprint 009 - Client Request on the New Tables: Requirements

**Guarded:** yes. It changes the live database (a migration the operator applies), collects clients' names and emails through a new public endpoint, and changes who can read that data.

## Why

Sprint 008 let admins build meeting types. Clients still use the old form, which saves to the old tables with two hard-coded types. This sprint gives each active meeting type its own public link. A client opens `/meet/<slug>`, reads the landing text, picks one of that meeting type's named lengths, proposes times, and the request is saved on the new tables (`requests` and `slots`). No email is sent and no professional is notified yet (Sprints 010 and 011). A small read-only admin Requests page makes the submissions visible.

## Scope

**Stage A (database and API, ends at an operator checkpoint)**

1. A read-only preflight SQL file, a migration the operator applies, a post-check, and a rollback.
2. Pure slot-rule logic and request validation in `lib`.
3. The public endpoint `POST /api/meet/[slug]/requests`.
4. The admin endpoint `GET /api/admin/requests`.

**Stage B (screens, after the operator confirms Stage A)**

5. The date/time picker takes its lengths and time zone from the meeting type instead of the two fixed types.
6. Public pages: `/` lists active meeting types; `/meet/[slug]` shows the landing text and the request form; a friendly not-found page.
7. Admin: a read-only Requests page and a nav link.
8. Documentation and close-out.

## Behavior rules

- Only active meeting types are public. An unknown or inactive slug shows the not-found page; the API returns 404.
- The client sends name, email, the chosen duration option, and proposed start times. The client never sends end times; the server never trusts any (Decision 049). A slot stores only its start.
- A meeting type with a single duration skips the choice step; the one length is used automatically.
- Slot rules, checked on the server in the business time zone (the `business_timezone` value in `platform_settings`, default US/Eastern, passed to the picker so both sides agree):
  - each start is strictly in the future and no later than 29 days from now;
  - each start is on a 15-minute mark between 07:00 and 21:00 inclusive (21:00 only on the hour);
  - at least 1 and at most 30 slots, with no duplicate starts;
  - any two starts are at least (chosen minutes + 15) minutes apart.
- Spam controls: a hidden trap field (if filled, the request is quietly dropped and the response looks like success) and the 30-slot cap. No CAPTCHA and no third-party service. Duplicate requests from the same person are accepted (R-005 stays open).
- A new request has status `pending`, the meeting type, the chosen duration, and the business time zone copied from the setting. The client email is trimmed and lowercased. `created_by_admin_id` stays empty (Decision 053).
- After submitting, the client sees a "request received" screen with the chosen length and times (in the business time zone). There is no email and no personal page yet.
- The home page `/` lists active meeting types (title, a short excerpt of the landing text, and lengths). The old public form entrance is removed. The old routes `/api/meetings`, `/meetings/[id]`, and `/team/*` stay until Sprint 014.
- The landing text is plain text. It is rendered as text with line breaks kept, never as HTML.
- The admin Requests page is read-only: client name and email, meeting type, length, proposed times, status, and created date, newest first, up to the latest 100. Admins and Super Admins can see it.

## Decisions to record (the Builder writes them as rows in `planning/DECISIONS.md`, dated on the day the sprint closes)

| # | Decision | Why | Implication |
|---|---|---|---|
| 064 | `/` is the list of active meeting types and each type is requested at `/meet/<slug>`. The old public form entrance is removed; the old API and pages stay until Sprint 014. | Implements Decisions 055 and 060. | `app/page.tsx` is replaced. Legacy routes remain reachable by URL only. |
| 065 | The public request endpoint is `POST /api/meet/[slug]/requests`. The server derives each slot's end from the chosen duration; slots store only the start. Client emails are stored trimmed and lowercase. | Decision 049; the browser is not trusted for times. | The request body carries `duration_id` and `starts_at` values only. |
| 066 | Server slot rules: strictly in the future, at most 29 days ahead, on a 15-minute mark from 07:00 to 21:00 in the business time zone, 1 to 30 slots, unique starts, and any two starts at least duration plus 15 minutes apart. | Mirrors the picker's rules so the server is the real guard. | Rules live in `lib/slot-rules.ts` as pure functions. |
| 067 | Spam controls for the public form are a hidden trap field and a 30-slot cap. No CAPTCHA until abuse appears. Duplicate requests are accepted. | Keeps the form simple and dependency-free. | R-016 tracks the unthrottled public endpoint. |
| 068 | The admin Requests page in Sprint 009 is read-only. Actions (pairing, re-notify) arrive in Sprint 012. | Makes submissions visible without building the dashboard early. | `GET /api/admin/requests` only. |
| 069 | The business time zone is read from `platform_settings` (key `business_timezone`, default US/Eastern) by the server and passed to the picker. The hard-coded zone constant is removed. | One source of truth (Decisions 027, 028, 035). | Sprint 015's settings page can change it without code edits to the picker. |
| 070 | `requests.meeting_type_id` and `requests.duration_id` are required, and a request's duration must belong to its meeting type (composite foreign key). `requests` and `slots` are server-only (Decision 061). `slots` forbids a duplicate start within a request. | Data integrity and personal data protection. | Migration 009. The old text `meeting_type` column stays until Sprint 014. |

## Risks and questions to record

- **R-016 (new):** the public endpoint has no rate limit beyond the trap field and slot cap. Spam could fill `requests` and, from Sprint 011, trigger emails to professionals. Mitigation later: platform-level rate limiting, and the dev email redirect in Sprint 010. Revisit before the beta.
- **R-005:** duplicate requests are still accepted; update its note.
- **R-009:** note that `requests` and `slots` no longer have a public-role policy after migration 009.
- **Q-013 (new):** should the client get an acknowledgement email ("we received your request")? It is not in `DOMAIN.md`'s template list; decide in Sprint 010 planning.

## Out of scope

- Any email, magic link, professional notification, response page, threshold, or pairing.
- Removing the old routes or tables (Sprint 014). CAPTCHA. Rate limiting infrastructure.
- Super Admin settings UI for the time zone (Sprint 015).
- Editing or cancelling a request from the admin Requests page.

## Success

A client opens a meeting type's link, picks a length, proposes times, and submits. The request and its slots are saved, correct to the minute in the business time zone, and appear on the admin Requests page. Wrong or tampered submissions are refused by the server.

============================================================
FILE: planning/sprints/009-client-request-new-tables/blueprint.md
============================================================

# Sprint 009 - Client Request on the New Tables: Blueprint

Guarded. Two operator-gated stages. Create branch `sprint-009-client-request` from `main`. Commit locally per stage. Do not push.

## Verified at planning time (2026-11-13, read-only)

- `main` is at the merge of Sprint 008 (`aa28c8c6`). Working tree clean except `next-env.d.ts`.
- `app/page.tsx` is the old public form (react-hook-form, `DateTimePicker`, posts to `/api/meetings`, then redirects to `/meetings/[id]`). `DateTimePicker` is used only there.
- `src/components/DateTimePicker/`: `types.ts` hard-codes `MeetingType = in_depth | short_form`, `MEETING_DURATIONS` (75 and 45), and `BUSINESS_TIMEZONE = "America/New_York"`; `DurationStep.tsx` renders two fixed cards; `TimeSlotEditor.tsx` reads `MEETING_DURATIONS[meetingType]` once (the `duration` constant) for its overlap rule with `BUFFER_MINUTES = 15`; `MonthCalendar.tsx` disables dates before today and after today plus 28 days and is Sunday-first. `MonthCalendar` needs no change.
- Overlap rule in the picker: two starts conflict when they are less than (minutes + 15) apart. The server rule is the same condition across all slots.
- `requests` (live): `id`, `client_name`, `client_email`, `meeting_type` (text, now nullable), `status` (default `pending`), `business_timezone` (default `US/Eastern`), plus the nullable `meeting_type_id`, `duration_id`, `created_by_admin_id` added by migration 008. 0 rows at planning time. `slots` (Phase 1 SQL): `id`, `request_id` (cascade), `starts_at`, `is_active`, `pruned_at`, timestamps. Both tables currently carry a Phase 1 policy named `service role full access` that is tied to the public role and limited only by a condition.
- Meeting type tables from Sprint 008 are server-only. The public pages and endpoint must read them through server code with the service client, never from the browser.
- Auth helpers and admin route pattern are unchanged: `getAuthenticatedAdminFromRequest`, `createServiceSupabaseClient`, JSON errors as `{ error }`, snake_case JSON (Decision 063).
- Unknown until the operator runs the preflight: the exact names of the live foreign key constraints on `requests`, the names and roles of the policies on `requests` and `slots`, and the `platform_settings` value.

## Tables used (every route and page)

| Route or page | Reads | Writes |
|---|---|---|
| `GET /` (list page, server) | `meeting_types`, `meeting_type_durations` | none |
| `GET /meet/[slug]` (server) | `meeting_types`, `meeting_type_durations`, `platform_settings` | none |
| `POST /api/meet/[slug]/requests` | `meeting_types`, `meeting_type_durations`, `platform_settings` | `requests`, `slots` |
| `GET /api/admin/requests` | `requests`, `slots`, `meeting_types`, `meeting_type_durations` | none |
| `/admin/requests` (page) | via the admin route only | none |

No page or route in this sprint reads or writes `meetings`, `time_slots`, `team_members`, `responses`, or `professionals`.

## Stage A - database and API

### A1. Preflight SQL (`supabase/preflight/009_preflight.sql`)

Read-only (`select` only). Labeled result sets:

1. Row counts: `requests`, `slots`, `meeting_types` (active and inactive), `meeting_type_durations`.
2. Any `requests` row where `meeting_type_id` or `duration_id` is null (count; must be 0 or the migration will stop).
3. Constraints on `requests` and `slots` (name and definition), including foreign keys and uniques.
4. Policies on `requests` and `slots` (name, roles, command, qual).
5. Unique constraints and indexes on `meeting_type_durations`.
6. The `platform_settings` row for `business_timezone`.

### A2. Migration (`supabase/migrations/009_requests_new_model.sql`)

One transaction, idempotent, no `drop table`, `delete from`, or `truncate`. First a guard that raises a clear error if `requests` or `meeting_type_durations` is missing, or if any `requests` row has a null `meeting_type_id` or `duration_id`.

1. `meeting_type_durations`: add a unique constraint on (`id`, `meeting_type_id`) if it does not exist (needed for the composite key).
2. `requests`: set `meeting_type_id` and `duration_id` to NOT NULL.
3. `requests`: add a composite foreign key (`duration_id`, `meeting_type_id`) referencing `meeting_type_durations (id, meeting_type_id)` on delete restrict, if it does not exist. Then drop the now-redundant single-column foreign key on `duration_id` (default name `requests_duration_id_fkey`) with `drop constraint if exists`. This avoids two competing relationships between the same tables.
4. `slots`: create a unique index on (`request_id`, `starts_at`) if it does not exist.
5. Indexes: `requests (meeting_type_id)` and `requests (created_at desc)` if they do not exist.
6. Row level security on `requests` and `slots`: drop `service role full access` on both (if it exists), drop and recreate `requests_service_role_all` and `slots_service_role_all` as policies for the `service_role` role only, for all commands. Do not touch other tables.

### A3. Rollback (`supabase/rollbacks/009_requests_new_model_rollback.sql`)

Transaction. Drops the composite foreign key and the slots unique index and the two new indexes, restores the single foreign key on `duration_id`, makes `meeting_type_id` and `duration_id` nullable again. Does not recreate the old public-role policies (comment why). Does not drop the Sprint 008 unique constraint.

### A4. Post-check (`supabase/preflight/009_postcheck.sql`)

Select-only, labeled: the two columns are NOT NULL; the composite foreign key exists and the single-column one does not; the slots unique index exists; the only policies on `requests` and `slots` are `service_role`; a query listing any policy on those two tables not limited to `service_role` (expect no rows). Include a rule-inspection query showing the composite foreign key definition (nothing is inserted).

### A5. `lib/slot-rules.ts` (pure, no Next or Supabase imports; may import `date-fns-tz`)

Exports `validateSlots({ startsAt: string[], minutes: number, now: Date, timeZone: string })` returning `{ ok: true }` or `{ ok: false, message }` with plain messages, and constants for the rules (max 30, max 29 days ahead, grid 15, hours 07:00 to 21:00, buffer 15). Rules exactly as in the requirements. Evaluate local time with `toZonedTime` (or `formatInTimeZone`) in the supplied zone so daylight saving is handled by the zone database, never by a fixed offset.

### A6. `lib/requests.ts` (server only)

- `createRequestSchema` (zod): `client_name` (trim, 1 to 120), `client_email` (trim, email, lowercase), `duration_id` (uuid), `starts_at` (array of ISO date-time strings, 1 to 30), `website` (optional string, the trap field).
- `loadPublicMeetingType(slug)`: returns the active meeting type, its durations ordered, and the business time zone (from `platform_settings`, fallback `US/Eastern`), or null when the slug is unknown or the type is inactive.
- `loadBusinessTimezone()`.

### A7. `app/api/meet/[slug]/requests/route.ts` (`POST`, no sign-in required)

Order matters; every rejection happens before any insert:

1. Parse JSON (400 on invalid), validate with `createRequestSchema` (400 with the first plain message).
2. If `website` is non-empty, return `{ ok: true }` with status 200 and save nothing.
3. Load the public meeting type by slug (404 "This meeting link isn't available." if missing or inactive).
4. Find the duration among that type's durations by `duration_id` (400 "Choose one of the listed lengths." if not found).
5. `validateSlots` with the duration's minutes, `now`, and the business time zone (400 with its message).
6. Insert the request (`client_name`, `client_email`, `meeting_type_id`, `duration_id`, `status: "pending"`, `business_timezone`).
7. Insert the slots (`request_id`, `starts_at` normalized to ISO). If the slots insert fails, delete the request just created (compensating delete) and return a generic 500.
8. Return `{ ok: true }` with 201. Do not return the request id. Never log names or emails; log only error codes.

### A8. `app/api/admin/requests/route.ts` (`GET`)

401 when not signed in. Return the latest 100 requests (newest first) with client name and email, status, created time, business time zone, meeting type title and slug, duration label and minutes, and the slots ordered by start. Do not use a database embed for the duration (two relationships existed historically); fetch requests, then slots, meeting types, and durations by id in separate queries and join in code.

### Stage A checkpoint (operator)

Stop after Stage A. Set `planning/STATUS.json` to `awaiting-approval`. Report files, verification output, and these operator steps:

1. Run `supabase/preflight/009_preflight.sql` one query at a time and send the results.
2. If nothing is surprising, run `supabase/migrations/009_requests_new_model.sql` once, then once more (the second run must succeed and change nothing).
3. Run `supabase/preflight/009_postcheck.sql` and send the results.
4. Say "stage A confirmed".

Do not start Stage B until confirmed. Two repair attempts at most on SQL problems.

## Stage B - screens

Plain Tailwind in the style of the existing pages. Server components load data with the service client; client components call the endpoints.

### B1. Date/time picker (`src/components/DateTimePicker/`)

- `types.ts`: remove `MeetingType`, `MEETING_DURATIONS`, `Duration`, and `BUSINESS_TIMEZONE`. `toApiSlots(slots, minutes, timeZone)` returns `{ startsAt }` values (ISO) using `fromZonedTime(..., timeZone)`; drop `endsAt`. Keep `getTimeOptions`, `formatTimeLabel`, `DEFAULT_START_TIME`.
- `DurationStep.tsx`: renders cards from a `durations: { id, label, minutes }[]` prop (label plus "N min"). Selected id is controlled by the parent.
- `TimeSlotEditor.tsx`: replace the `meetingType` prop with `durationMinutes: number`; the overlap rule is otherwise unchanged.
- `index.tsx`: props `durations`, `timeZone`, `onChange(slots: { startsAt: string }[], durationId: string | null)`. If there is exactly one duration, select it automatically and hide the choice step. `MonthCalendar.tsx` is not edited.

### B2. Public pages

- `app/page.tsx` (replace; server component, `dynamic = "force-dynamic"`): heading, short intro, and a card per active meeting type (title, excerpt of the first 160 characters of the landing text as plain text, lengths). Each card links to `/meet/<slug>`. If none are active, show a friendly "No meetings are open for requests right now." message.
- `app/meet/[slug]/page.tsx` (server component, `dynamic = "force-dynamic"`): `generateMetadata` uses the title; calls `notFound()` when the type is missing or inactive; shows title and landing text (`whitespace-pre-line`, plain text) on the left and `RequestForm` on the right; a small "All meeting types" link back to `/`.
- `app/meet/[slug]/not-found.tsx`: plain message and a link to `/`.
- `src/components/MeetingRequest/RequestForm.tsx` (client): name, email, the picker, a hidden trap field named `website` (visually hidden, `tabIndex -1`, `autoComplete off`, not announced to screen readers), submit to `/api/meet/<slug>/requests`. Show the server's plain error message on failure and keep the form values. On success show the "request received" panel: the chosen length and the proposed times formatted in the business time zone with its label, plus a link back to `/`.

### B3. Admin

- `app/admin/(protected)/requests/page.tsx` and `src/components/Requests/RequestList.tsx`: read-only table from `GET /api/admin/requests` with loading, empty ("No requests yet."), and error states. Times are shown in the business time zone.
- `app/admin/(protected)/AdminNav.tsx`: add a "Requests" link.

### Stage B checkpoint (operator)

Stop for the operator walkthrough (acceptance criteria 20 to 27) before close-out.

## Close-out (after the operator accepts Stage B)

Update per `AGENTS.md`: `planning/STATE.md` (archive Sprint 007 history verbatim into `planning/archive/` and keep Sprint 008 plus 009), `planning/DECISIONS.md` (064 to 070), `planning/RISKS.md` (R-016, notes on R-005 and R-009), `planning/QUESTIONS.md` (Q-013), `docs/DATA_MODEL.md`, `docs/ARCHITECTURE.md` (new Public Request component, Built), `docs/API.md` (the two new routes), `docs/VALIDATION.md` (Sprint 009 section). Mark roadmap row 009 `done`. Refresh `planning/ARCHITECT_BRIEFING.md` with real evidence and Plan corrections. Write `planning/STATUS.json` as `sprint-closed`.

## Flight evidence

- **Invariants at risk:** (1) a request's duration must belong to its meeting type; (2) end times must come from the server's chosen duration, never the browser; (3) slot rules must hold in the business time zone through daylight saving changes; (4) `requests` and `slots` must be unreachable with the public key.
- **Discriminating example (buffer):** duration 45. Starts 09:00 and 09:45 on the same day must be refused (gap 45 is less than 45 + 15 = 60); 09:00 and 10:00 are accepted. A plausible wrong rule without the buffer accepts 09:45. Duration 75: 10:00 and 11:15 refused (75 < 90); 10:00 and 11:30 accepted.
- **Discriminating example (daylight saving):** with the zone America/New_York, 07:00 local on 2027-03-15 (daylight time) is 11:00Z and must be accepted; 06:00 local (10:00Z) must be refused. An implementation that uses a fixed UTC offset of -5 hours would judge 11:00Z as 06:00 and wrongly refuse it. The reverse holds on 2027-01-15 (standard time): 12:00Z is 07:00 local. (Pick dates in the future relative to the test's `now` argument by passing `now` explicitly.)
- **Discriminating example (composite key):** inserting a request with the In-depth meeting type id and a Short-form duration id must fail at the database; the single-column key alone would accept it.
- **Source of truth:** the slot rules are enforced by `validateSlots` (server); the integrity rule by the composite foreign key; server-only access by the policies.
- **Known uncertainty:** exact live constraint and policy names (resolved by the preflight). `Intl` support for the `US/Eastern` alias on the server runtime: if `toZonedTime` rejects it, use the equivalent IANA name and report it as a plan correction.

## Risks

- A public endpoint writes personal data: every rejection must occur before the insert.
- The picker refactor changes a working form: Stage B ends with an operator walkthrough on a real submission.
- Two stages and about 20 files: the gates exist for that reason.

============================================================
FILE: planning/sprints/009-client-request-new-tables/acceptance.md
============================================================

# Sprint 009 - Client Request on the New Tables: Acceptance

## Stage A

1. `supabase/preflight/009_preflight.sql` exists and contains only `select` statements.
2. `supabase/migrations/009_requests_new_model.sql` exists, is one transaction, is idempotent, and contains no `drop table`, `delete from`, or `truncate`.
3. After the operator applies the migration twice, the second run reports no error and the post-check is unchanged.
4. `requests.meeting_type_id` and `requests.duration_id` are NOT NULL; the composite foreign key (`duration_id`, `meeting_type_id`) exists and the single-column foreign key on `duration_id` does not; `slots` refuses a duplicate (`request_id`, `starts_at`).
5. The only policies on `requests` and `slots` apply to `service_role`; the post-check query for any other policy returns no rows.
6. `supabase/rollbacks/009_requests_new_model_rollback.sql` and `supabase/preflight/009_postcheck.sql` exist.
7. `lib/slot-rules.ts` has no Next, Supabase, or app imports, and `validateSlots` gives these results (shown by running it): duration 45 with starts 09:00 and 09:45 the same day refused; 09:00 and 10:00 accepted; duration 75 with 10:00 and 11:15 refused, 10:00 and 11:30 accepted; 07:00 America/New_York on a future daylight-time date accepted and 06:00 refused; a start 30 days ahead refused; a start in the past refused; 31 starts refused; duplicate starts refused; 07:10 refused.
8. `POST /api/meet/[slug]/requests` rejects before inserting in every one of these cases: invalid JSON (400), invalid name or email (400), unknown slug (404), inactive meeting type (404), duration id not belonging to the type (400), any slot-rule failure (400). A filled trap field returns 200 and saves nothing. A valid request saves one `requests` row and its `slots` rows and returns 201 without an id.
9. The saved request has `status` `pending`, the chosen `meeting_type_id` and `duration_id`, the `business_timezone` from the setting, and a lowercase trimmed email; the saved slots hold only start times.
10. `GET /api/admin/requests` returns 401 when signed out and the latest requests with their slots when signed in as Admin or Super Admin.
11. `npx tsc --noEmit` and `npm run build` pass. No file outside the Stage A `owns` list changed.

## Stage B

12. The picker has no reference to `in_depth`, `short_form`, `MEETING_DURATIONS`, or `BUSINESS_TIMEZONE`; it builds its choices from the meeting type's durations and uses the supplied time zone.
13. `/` lists only active meeting types, each linking to `/meet/<slug>`; with none active it shows the friendly message.
14. `/meet/<slug>` for an active type shows its title and landing text (as plain text) and the form; for an unknown or inactive slug it shows the not-found page.
15. A meeting type with one duration skips the choice step; one with several shows a card per duration with its name and minutes.
16. Submitting a valid request shows the "request received" panel with the chosen length and the times in the business time zone. A rejected request shows the server's plain message and keeps what the client typed.
17. The trap field is not visible and not reachable by keyboard.
18. `/admin/requests` lists submitted requests newest first with client name and email, meeting type, length, times in the business time zone, status, and created date; signed out it redirects to `/admin/login`. The nav shows "Requests".
19. The old routes `/api/meetings`, `/meetings/[id]`, and `/team/meetings/[id]` still build and are unchanged.
20. Operator walkthrough: with an active meeting type that has at least two durations, open `/`, follow the link, submit a request with two or three times on different days, and see the received panel.
21. The same request appears on `/admin/requests` with the correct length and times to the minute in Eastern Time.
22. A request with times closer together than the length plus 15 minutes cannot be submitted (the picker blocks it, and the server refuses it if forced).
23. Turning the meeting type off makes `/meet/<slug>` show not-found and removes it from `/`.

## Always

24. Nothing under `app/api/meetings`, `app/api/responses`, `app/meetings`, `app/team`, `lib/quorum.ts`, `lib/email.ts`, or `lib/validation.ts` changed.
25. No new dependency in `package.json`. No email is sent by any new code.
26. Typecheck and build pass at the end of each stage.

============================================================
FILE: planning/sprints/009-client-request-new-tables/handoff-prompt.md
============================================================

# Sprint 009 - Builder Handoff Prompt

You are the Builder for Group Meet, Sprint 009: Client Request on the New Tables. This sprint is guarded (database migration, personal data collected through a public endpoint, and a change to who can read that data). It runs in two operator-gated stages.

## Read first, in order

1. `AGENTS.md`
2. `templates/method/120x-agent-identity.md`
3. `planning/ARCHITECT_BRIEFING.md`, `planning/STATE.md`, `planning/DECISIONS.md`, `planning/DOMAIN.md`, `planning/RISKS.md`, `planning/QUESTIONS.md`, `planning/ROADMAP.md`
4. `planning/sprints/009-client-request-new-tables/requirements.md`, `blueprint.md`, `acceptance.md`
5. `docs/DATA_MODEL.md`, `docs/ARCHITECTURE.md`, `docs/API.md`
6. The code you will change or imitate: `app/page.tsx`, `src/components/DateTimePicker/**`, `lib/meeting-types.ts`, `lib/supabase.ts`, `app/api/admin/meeting-types/**`, `app/admin/(protected)/**`
7. `supabase/migrations/008_meeting_types.sql` and `supabase/preflight/008_*.sql` (the pattern to follow)

Check git first and trust it over prose. Create branch `sprint-009-client-request` from `main`. If the working tree differs from the blueprint's "Verified at planning time" section, say so in your plan.

## Code gate

Because this sprint is guarded, post your build plan before editing anything: the exact file list per stage, the approach, what could go wrong, the checks you will run, and any deviation from this pack with reasons. Wait for the operator to approve that plan. The operator then approves each stage's checkpoint separately.

## Task contract

- **objective:** Let a client open the link for one active meeting type, choose one of its named lengths, propose times, and submit a request that is saved on the new `requests` and `slots` tables with server-enforced rules, and let admins see those requests on a read-only page.
- **owns:**
  - Stage A: `supabase/preflight/009_preflight.sql`, `supabase/preflight/009_postcheck.sql`, `supabase/migrations/009_requests_new_model.sql`, `supabase/rollbacks/009_requests_new_model_rollback.sql`, `lib/slot-rules.ts`, `lib/requests.ts`, `app/api/meet/[slug]/requests/route.ts`, `app/api/admin/requests/route.ts`.
  - Stage B: `src/components/DateTimePicker/index.tsx`, `types.ts`, `DurationStep.tsx`, `TimeSlotEditor.tsx`; `app/page.tsx`; `app/meet/[slug]/page.tsx`; `app/meet/[slug]/not-found.tsx`; `src/components/MeetingRequest/**`; `app/admin/(protected)/requests/page.tsx`; `src/components/Requests/**`; `app/admin/(protected)/AdminNav.tsx`.
  - Close-out: `planning/STATE.md`, `planning/DECISIONS.md`, `planning/RISKS.md`, `planning/QUESTIONS.md`, `planning/ROADMAP.md` (row 009 only), `planning/ARCHITECT_BRIEFING.md`, `planning/STATUS.json`, `planning/archive/`, `docs/DATA_MODEL.md`, `docs/ARCHITECTURE.md`, `docs/API.md`, `docs/VALIDATION.md`; local git commits on `sprint-009-client-request`.
- **must_not:** send, queue, or wire any email; create magic links; notify professionals; touch the old routes and libraries (`app/api/meetings`, `app/api/responses`, `app/meetings`, `app/team`, `lib/quorum.ts`, `lib/email.ts`, `lib/validation.ts`) or `src/components/DateTimePicker/MonthCalendar.tsx`; accept end times from the browser; read or write `meetings`, `time_slots`, `team_members`, `responses`, or `professionals` in new code; render the landing text as HTML; add CAPTCHA, a third-party service, or any npm dependency; run SQL against the live database; submit a valid request to the live database or otherwise write to it yourself (only the operator's walkthrough writes data); log client names or emails; store secrets; edit managed method files (`templates/`, `.claude/`, `.agents/`, `.120x/`, `scripts/`); push, open a pull request, merge, rebase, or amend commits; delete user files; invent behavior beyond Decisions 047 to 070.
- **acceptance:** the 26 numbered criteria in `acceptance.md`.
- **verification:** run each from the project root and report the exact command and result.
  1. `npx tsc --noEmit`
  2. `npm run build`
  3. `grep -n "ends_at\|endsAt" app/api/meet lib/requests.ts lib/slot-rules.ts` (expect no output in new server code)
  4. `grep -rn "in_depth\|short_form\|MEETING_DURATIONS\|BUSINESS_TIMEZONE" src/components/DateTimePicker app/page.tsx app/meet` (expect no output after Stage B)
  5. `grep -inE "drop table|delete from|truncate" supabase/migrations/009_requests_new_model.sql` (expect no output) and `grep -inE "^\s*(insert|update|delete|alter|drop|create|truncate)\b" supabase/preflight/009_preflight.sql` (expect no output)
  6. A one-off run of the pure rule function covering every case in acceptance criterion 7, for example `node --experimental-strip-types -e "import('./lib/slot-rules.ts').then(m => { /* cases */ })"`, showing each case and its result. If your Node version cannot run it, say so and show the cases by reading the code. Pass `now` explicitly so results do not depend on today's date.
  7. With the dev server running and no data written: unknown slug returns 404, invalid JSON returns 400, and a body that fails validation returns 400, for `POST /api/meet/<slug>/requests`; and `GET /api/admin/requests` returns 401 signed out. Only run cases you have confirmed by reading the code reject before any insert.
  8. `git diff --stat main..HEAD -- app/api/meetings app/api/responses app/meetings app/team lib/quorum.ts lib/email.ts lib/validation.ts src/components/DateTimePicker/MonthCalendar.tsx package.json` (expect no output) and confirm every changed path is in `owns`.
  9. Operator-run and reported by the operator: preflight, migration twice, post-check (Stage A); walkthrough, criteria 20 to 23 (Stage B).

Two honest repair attempts per failure, then stop and report. Stop at each checkpoint and wait. At close, write the briefing, update the roadmap, and write `planning/STATUS.json` as described in the blueprint, and report any divergence from this pack with reasons.
