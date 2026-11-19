# Sprint 009 - Client Request on the New Tables: Acceptance

## Stage A

1. `supabase/preflight/009_preflight.sql` exists and contains only `select` statements.
2. `supabase/migrations/009_requests_new_model.sql` exists, is one transaction, is idempotent, and contains no `drop table`, `delete from`, or `truncate`.
3. After the operator applies the migration twice, the second run reports no error and the post-check is unchanged.
4. `requests.meeting_type_id` and `requests.duration_id` are NOT NULL; the composite foreign key (`duration_id`, `meeting_type_id`) exists and the single-column foreign key on `duration_id` does not; `slots` refuses a duplicate (`request_id`, `starts_at`).
5. The only policies on `requests` and `slots` apply to `service_role`; the post-check query for any other policy returns no rows.
6. `supabase/rollbacks/009_requests_new_model_rollback.sql` and `supabase/preflight/009_postcheck.sql` exist.
7. `lib/slot-rules.ts` has no Next, Supabase, or app imports, and `validateSlots` gives these results (shown by running it): duration 45 with starts 09:00 and 09:45 the same day refused; 09:00 and 10:00 accepted; duration 75 with 10:00 and 11:15 refused, 10:00 and 11:30 accepted; 07:00 America/New_York on a future daylight-time date accepted and 06:00 refused; a start 30 days ahead refused; a start in the past refused; today and tomorrow refused and the day after tomorrow accepted, including late in the evening and across a daylight saving change (Amendment 2); 31 starts refused; duplicate starts refused; 07:10 refused.
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
27. Portability: in the new Sprint 009 code, only files under `lib/db/` import the Supabase client or any Supabase package, and no new migration uses `auth.*` functions. `grep -rn "createServiceSupabaseClient\|@supabase" app/page.tsx app/meet app/api/meet app/api/admin/requests src/components/MeetingRequest src/components/Requests` returns no output.
