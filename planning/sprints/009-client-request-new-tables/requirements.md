# Sprint 009 - Client Request on the New Tables: Requirements

**Guarded:** yes. It changes the live database (a migration the operator applies), collects clients' names and emails through a new public endpoint, and changes who can read that data.

## Amendments (2026-11-19, Architect, before the Builder starts)

The operator decided to stay on Supabase through Sprint 013 and then move to Neon (roadmap Sprints 017 and 018), so this sprint and the next four follow three portability rules:

1. **One data module.** All new database access goes through `lib/db/` (plain functions that return plain objects). Routes and pages never import the Supabase client directly in new code.
2. **Security in server code.** Every new route checks who is calling in code. Database policies are a second lock, never the only one.
3. **No Supabase-only extras.** No Supabase Auth admin functions beyond signing in and reading the session, no storage or realtime, no database functions called through the REST layer, no REST relationship embeds. Use plain queries joined in code. New migrations use standard SQL.

Old code (Sprints 005 to 008) is left as it is and is ported during Sprints 017 and 018.

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
| 071 | Portability rules for Sprints 009 to 013: new data access lives in `lib/db/`; authorization is checked in server code; no Supabase-only features in new code or migrations. | Keeps the planned move to Neon cheap (Decision 072). | New routes and pages call `lib/db/*` functions only. |
| 072 | The operator stays on Supabase's free plan through Sprint 013 and restores the project by hand when it pauses; there is no keep-alive sprint. A move to Neon is planned as Sprints 017 and 018 and is confirmed when Sprint 013 closes. Password reset (016) moves after the move. | Avoids paying for Supabase Pro and avoids a keep-alive dependency; the database is nearly empty so the move is cheapest before launch. | Roadmap amended. Each operator step in these sprints touches the database, which also counts as activity. |
| 070 | `requests.meeting_type_id` and `requests.duration_id` are required, and a request's duration must belong to its meeting type (composite foreign key). `requests` and `slots` are server-only (Decision 061). `slots` forbids a duplicate start within a request. | Data integrity and personal data protection. | Migration 009. The old text `meeting_type` column stays until Sprint 014. |

## Risks and questions to record

- **R-016 (new):** the public endpoint has no rate limit beyond the trap field and slot cap. Spam could fill `requests` and, from Sprint 011, trigger emails to professionals. Mitigation later: platform-level rate limiting, and the dev email redirect in Sprint 010. Revisit before the beta.
- **R-005:** duplicate requests are still accepted; update its note.
- **R-009:** note that `requests` and `slots` no longer have a public-role policy after migration 009.
- **R-017 (new):** Supabase's free plan pauses an idle project after about a week, which makes the database unreachable until the operator restores it. Observed on 2026-11-19. Mitigation: restore by hand; keep gaps between sprint sessions short; the move to Neon (Sprints 017 and 018) removes it.
- **Q-013 (new):** should the client get an acknowledgement email ("we received your request")? It is not in `DOMAIN.md`'s template list; decide in Sprint 010 planning.

## Out of scope

- Any email, magic link, professional notification, response page, threshold, or pairing.
- Removing the old routes or tables (Sprint 014). CAPTCHA. Rate limiting infrastructure.
- Super Admin settings UI for the time zone (Sprint 015).
- Editing or cancelling a request from the admin Requests page.

## Success

A client opens a meeting type's link, picks a length, proposes times, and submits. The request and its slots are saved, correct to the minute in the business time zone, and appear on the admin Requests page. Wrong or tampered submissions are refused by the server.
