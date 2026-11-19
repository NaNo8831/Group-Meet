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

### A6. `lib/requests.ts` (pure) and `lib/db/requests.ts` (data access)

`lib/requests.ts` (no database imports): `createRequestSchema` (zod): `client_name` (trim, 1 to 120), `client_email` (trim, email, lowercase), `duration_id` (uuid), `starts_at` (array of ISO date-time strings, 1 to 30), `website` (optional string, the trap field).

`lib/db/requests.ts` (the only new file that imports the Supabase client; Portability rule 1). Plain functions that return plain objects, with no Supabase types in their signatures:
- `getBusinessTimezone()`: the `platform_settings` value for `business_timezone`, fallback `US/Eastern`.
- `listActiveMeetingTypes()`: active types with their durations ordered (for the home page).
- `getActiveMeetingTypeBySlug(slug)`: the active type, its durations ordered, and the time zone, or null when the slug is unknown or the type is inactive.
- `createRequestWithSlots({ meetingTypeId, durationId, clientName, clientEmail, businessTimezone, startsAt[] })`: inserts the request and its slots; if the slots insert fails, removes the request just created and throws.
- `listRecentRequests(limit)`: the latest requests with their slots, meeting type title and slug, and duration label and minutes, joined in code from separate queries.

Routes and pages call these functions only.

### A7. `app/api/meet/[slug]/requests/route.ts` (`POST`, no sign-in required)

Order matters; every rejection happens before any insert:

1. Parse JSON (400 on invalid), validate with `createRequestSchema` (400 with the first plain message).
2. If `website` is non-empty, return `{ ok: true }` with status 200 and save nothing.
3. Load the public meeting type by slug (404 "This meeting link isn't available." if missing or inactive).
4. Find the duration among that type's durations by `duration_id` (400 "Choose one of the listed lengths." if not found).
5. `validateSlots` with the duration's minutes, `now`, and the business time zone (400 with its message).
6. Insert the request through `createRequestWithSlots` (`client_name`, `client_email`, `meeting_type_id`, `duration_id`, `status: "pending"`, `business_timezone`).
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

## Portability rules (Decision 071)

1. New database access lives only in `lib/db/`. No route, page, or component in Sprint 009 imports `createServiceSupabaseClient` or any Supabase package directly.
2. Every route authorizes in code (admin routes with `getAuthenticatedAdminFromRequest`; the public route by the active-type rule). Policies are a second lock.
3. No Supabase-only extras in new code: no REST relationship embeds, no database functions called through the REST layer, no storage or realtime, no use of `auth.*` database functions in new migrations. Login code is left as is and is replaced in Sprint 018.

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
