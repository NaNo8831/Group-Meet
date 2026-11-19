# Roadmap - Group Meet

> A living estimate, not a contract. Sprints get added, split, re-ordered, or dropped as the work teaches us. The Architect updates this file at every session and shows the change in git; the Builder marks a row `done` when that sprint closes.

**About:** 12 sprints on the road
**Last estimated:** 2026-11-19
**Completed before this roadmap existed:** sprints 001-006 (the record lives in `planning/sprints/` and `planning/STATE.md`)

| # | Sprint | Phase | Status | Why it matters |
| --- | --- | --- | --- | --- |
| 007 | Stabilize and align | Foundation | done | Gets the folder, the method files, and every planning document describing the same product, so the build stops drifting. |
| 008 | Meeting types, roles, and pools | Meeting setup | done | Lets an admin create a meeting type with a title, landing page, named durations, required roles, and a pool of professionals. Everything after this reads from it. |
| 009 | Client request on the new tables | Client and email | done | A client opens the link for one meeting type, picks a duration, proposes times, and the request is saved on the new model. |
| 010 | Email foundation | Client and email | planned | Emails come from database templates and actually reach people, which needs the Resend sending domain verified. |
| 011 | Professional links and responses | Booking workflow | planned | Pool professionals get a private link, pick slots, and say which roles they can fill, until the admin locks the pairing. |
| 012 | Threshold and admin pairing | Booking workflow | planned | The system notices when every required role can be filled, tells the admin, and the admin picks people and enters the location. |
| 013 | Client confirmation | Booking workflow | planned | The client picks the final time, or opts out, and everyone gets the right confirmation email. |
| 017 | Move to Neon: database and data layer | Hosting move | planned | Moves the database off Supabase's free plan, which pauses when idle, and ports the data access (kept behind one module since Sprint 009). Go or no-go is confirmed when Sprint 013 closes. |
| 018 | Move to Neon: admin login | Hosting move | planned | Replaces Supabase Auth with a standard email-and-password login so nothing depends on Supabase; admins keep the same sign-in. |
| 014 | Time rules and legacy retirement | Launch | planned | Scheduled jobs (3-business-day rule, completion), and the old meetings flow and its open access rules are switched off. |
| 015 | Super Admin tools and beta check | Launch | planned | Admin invites, email template editing, timezone setting, then a full run with real people. |
| 016 | Admin password reset | Launch | planned | Admins can recover a lost password from the login page. Built on the new login after the move, so it is built once. |

## Notes

- Email (010) comes early on purpose: it is the biggest unknown and sprints 011 to 015 depend on it. The Resend domain DNS work is the operator's, in Google Workspace.
- Guarded sprints (the person approves the build plan first): 008 and 009 (migrations, personal data), 010 (sends real email), 011 (personal data, tokens), 012 (permissions), 014 (migration, deletes legacy access), 016, 017, and 018 (login, database move). 013 and 015 are guarded if they add migrations.
- Every sprint from 008 on must name the tables each page reads and writes, and name any migration it needs, in its blueprint (Plan correction from Sprints 004 to 006).
- Sprint 009 runs in two operator-gated stages: A (preflight, migration, request API, admin requests API) ends with the operator applying the migration and running a post-check; B (picker refactor, public pages, admin Requests page) ends with the operator submitting a real request. It replaces the old public form on `/` with the list of active meeting types.
- The public link for a meeting type is `/meet/<slug>`, built in Sprint 009 (planned Decision 060).
- Admin-created requests on a client's behalf are deferred, not dropped. Keep the data model flexible for them (Decision 053).
- Sprints 016, 017, and 018 are numbered that way because existing sprint numbers are referenced in the decision log; table order is flight order. Password reset (016) now follows the login move (018) so it is built once, on the new login. Until then, passwords are set in the Supabase dashboard.
- Sprint 010 also carries a development email setting that redirects all outgoing mail to one inbox (Q-011) and decides whether clients get an acknowledgement email (Q-013).
- Hosting: Supabase's free plan pauses an idle project after about a week. There is no keep-alive sprint; the operator restores the project by hand when it pauses, and Sprints 009 to 013 follow three portability rules (one data module `lib/db`, security checked in server code, no Supabase-only extras) so the move to Neon (017, 018) stays cheap. The move is a decision point, confirmed when Sprint 013 closes.
