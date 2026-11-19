# Sprint 009 - Builder Handoff Prompt

You are the Builder for Group Meet, Sprint 009: Client Request on the New Tables. This sprint is guarded (database migration, personal data collected through a public endpoint, and a change to who can read that data). It runs in two operator-gated stages.

## Read first, in order

1. `AGENTS.md`
2. `templates/method/120x-agent-identity.md`
3. `planning/ARCHITECT_BRIEFING.md`, `planning/STATE.md`, `planning/DECISIONS.md`, `planning/DOMAIN.md`, `planning/RISKS.md`, `planning/QUESTIONS.md`, `planning/ROADMAP.md`
4. `planning/sprints/009-client-request-new-tables/requirements.md`, `blueprint.md`, `acceptance.md`
5. The amendments at the top of `requirements.md` and the "Portability rules" section of `blueprint.md`; `docs/DATA_MODEL.md`, `docs/ARCHITECTURE.md`, `docs/API.md`
6. The code you will change or imitate: `app/page.tsx`, `src/components/DateTimePicker/**`, `lib/meeting-types.ts`, `lib/supabase.ts`, `app/api/admin/meeting-types/**`, `app/admin/(protected)/**`
7. `supabase/migrations/008_meeting_types.sql` and `supabase/preflight/008_*.sql` (the pattern to follow)

Check git first and trust it over prose. Create branch `sprint-009-client-request` from `main`. If the working tree differs from the blueprint's "Verified at planning time" section, say so in your plan.

## Code gate

Because this sprint is guarded, post your build plan before editing anything: the exact file list per stage, the approach, what could go wrong, the checks you will run, and any deviation from this pack with reasons. Wait for the operator to approve that plan. The operator then approves each stage's checkpoint separately.

## Task contract

- **objective:** Let a client open the link for one active meeting type, choose one of its named lengths, propose times, and submit a request that is saved on the new `requests` and `slots` tables with server-enforced rules, and let admins see those requests on a read-only page.
- **owns:**
  - Stage A: `supabase/preflight/009_preflight.sql`, `supabase/preflight/009_postcheck.sql`, `supabase/migrations/009_requests_new_model.sql`, `supabase/rollbacks/009_requests_new_model_rollback.sql`, `lib/slot-rules.ts`, `lib/requests.ts`, `lib/db/requests.ts`, `app/api/meet/[slug]/requests/route.ts`, `app/api/admin/requests/route.ts`.
  - Stage B: `src/components/DateTimePicker/index.tsx`, `types.ts`, `DurationStep.tsx`, `TimeSlotEditor.tsx`, and `MonthCalendar.tsx` (only the optional `minDate` prop); `app/page.tsx`; `app/meet/[slug]/page.tsx`; `app/meet/[slug]/not-found.tsx`; `src/components/MeetingRequest/**`; `app/admin/(protected)/requests/page.tsx`; `src/components/Requests/**`; `app/admin/(protected)/AdminNav.tsx`.
  - Close-out: `planning/STATE.md`, `planning/DECISIONS.md`, `planning/RISKS.md`, `planning/QUESTIONS.md`, `planning/ROADMAP.md` (row 009 only), `planning/ARCHITECT_BRIEFING.md`, `planning/STATUS.json`, `planning/archive/`, `docs/DATA_MODEL.md`, `docs/ARCHITECTURE.md`, `docs/API.md`, `docs/VALIDATION.md`; local git commits on `sprint-009-client-request`.
- **must_not:** import the Supabase client or any Supabase package outside `lib/db/` in new code (Decision 071); use REST relationship embeds, database functions called through the REST layer, storage, or realtime; send, queue, or wire any email; create magic links; notify professionals; touch the old routes and libraries (`app/api/meetings`, `app/api/responses`, `app/meetings`, `app/team`, `lib/quorum.ts`, `lib/email.ts`, `lib/validation.ts`); edit `src/components/DateTimePicker/MonthCalendar.tsx` beyond adding the optional `minDate` prop (Amendment 2); accept end times from the browser; read or write `meetings`, `time_slots`, `team_members`, `responses`, or `professionals` in new code; render the landing text as HTML; add CAPTCHA, a third-party service, or any npm dependency; run SQL against the live database; submit a valid request to the live database or otherwise write to it yourself (only the operator's walkthrough writes data); log client names or emails; store secrets; edit managed method files (`templates/`, `.claude/`, `.agents/`, `.120x/`, `scripts/`); push, open a pull request, merge, rebase, or amend commits; delete user files; invent behavior beyond Decisions 047 to 072.
- **acceptance:** the 27 numbered criteria in `acceptance.md`.
- **verification:** run each from the project root and report the exact command and result.
  1. `npx tsc --noEmit`
  2. `npm run build`
  3. `grep -n "ends_at\|endsAt" app/api/meet lib/requests.ts lib/slot-rules.ts` (expect no output in new server code)
  4. `grep -rn "in_depth\|short_form\|MEETING_DURATIONS\|BUSINESS_TIMEZONE" src/components/DateTimePicker app/page.tsx app/meet` (expect no output after Stage B)
  5. `grep -inE "drop table|delete from|truncate" supabase/migrations/009_requests_new_model.sql` (expect no output) and `grep -inE "^\s*(insert|update|delete|alter|drop|create|truncate)\b" supabase/preflight/009_preflight.sql` (expect no output)
  6. A one-off run of the pure rule function covering every case in acceptance criterion 7, for example `node --experimental-strip-types -e "import('./lib/slot-rules.ts').then(m => { /* cases */ })"`, showing each case and its result. If your Node version cannot run it, say so and show the cases by reading the code. Pass `now` explicitly so results do not depend on today's date.
  7. With the dev server running and no data written: unknown slug returns 404, invalid JSON returns 400, and a body that fails validation returns 400, for `POST /api/meet/<slug>/requests`; and `GET /api/admin/requests` returns 401 signed out. Only run cases you have confirmed by reading the code reject before any insert.
  8. `grep -rn "createServiceSupabaseClient\|@supabase" app/page.tsx app/meet app/api/meet app/api/admin/requests src/components/MeetingRequest src/components/Requests` (expect no output)
  9. `git diff --stat main..HEAD -- app/api/meetings app/api/responses app/meetings app/team lib/quorum.ts lib/email.ts lib/validation.ts package.json` (expect no output) and confirm every changed path is in `owns`.
  10. Operator-run and reported by the operator: preflight, migration twice, post-check (Stage A); walkthrough, criteria 20 to 23 (Stage B).

Two honest repair attempts per failure, then stop and report. Stop at each checkpoint and wait. At close, write the briefing, update the roadmap, and write `planning/STATUS.json` as described in the blueprint, and report any divergence from this pack with reasons.
