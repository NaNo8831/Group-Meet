# Roadmap - Group Meet

> A living estimate, not a contract. Sprints get added, split, re-ordered, or dropped as the work teaches us. The Architect updates this file at every session and shows the change in git; the Builder marks a row `done` when that sprint closes.

**About:** 9 sprints on the road
**Last estimated:** 2026-11-12
**Completed before this roadmap existed:** sprints 001-006 (the record lives in `planning/sprints/` and `planning/STATE.md`)

| # | Sprint | Phase | Status | Why it matters |
| --- | --- | --- | --- | --- |
| 007 | Stabilize and align | Foundation | done | Gets the folder, the method files, and every planning document describing the same product, so the build stops drifting. |
| 008 | Meeting types, roles, and pools | Meeting setup | done | Lets an admin create a meeting type with a title, landing page, named durations, required roles, and a pool of professionals. Everything after this reads from it. |
| 009 | Client request on the new tables | Client and email | planned | A client opens the link for one meeting type, picks a duration, proposes times, and the request is saved on the new model. |
| 010 | Email foundation | Client and email | planned | Emails come from database templates and actually reach people, which needs the Resend sending domain verified. |
| 011 | Professional links and responses | Booking workflow | planned | Pool professionals get a private link, pick slots, and say which roles they can fill, until the admin locks the pairing. |
| 012 | Threshold and admin pairing | Booking workflow | planned | The system notices when every required role can be filled, tells the admin, and the admin picks people and enters the location. |
| 013 | Client confirmation | Booking workflow | planned | The client picks the final time, or opts out, and everyone gets the right confirmation email. |
| 014 | Time rules and legacy retirement | Launch | planned | Scheduled jobs (3-business-day rule, completion), and the old meetings flow and its open access rules are switched off. |
| 015 | Super Admin tools and beta check | Launch | planned | Admin invites, email template editing, timezone setting, then a full run with real people. |

## Notes

- Email (010) comes early on purpose: it is the biggest unknown and sprints 011 to 015 depend on it. The Resend domain DNS work is the operator's, in Google Workspace.
- Guarded sprints (the person approves the build plan first): 008 (migration), 010 (sends real email), 011 (personal data, tokens), 012 (permissions), 014 (migration, deletes legacy access). 009, 013 and 015 are guarded if they add migrations.
- Every sprint from 008 on must name the tables each page reads and writes, and name any migration it needs, in its blueprint (Plan correction from Sprints 004 to 006).
- Sprint 008 runs in two operator-gated stages: A (preflight, migration, admin API) ends with the operator applying the migration and running a post-check; B (admin screens) ends with the operator walking through them. It also removes the tier toggle from the roster page and locks the professionals table to the server only.
- The public link for a meeting type is `/meet/<slug>`, built in Sprint 009 (planned Decision 060).
- Admin-created requests on a client's behalf are deferred, not dropped. Keep the data model flexible for them (Decision 053).
- Sprint 009 may split if the date/time picker needs rework on the new duration model.
