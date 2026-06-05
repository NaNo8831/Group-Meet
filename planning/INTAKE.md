# Project Intake

## Project Metadata

| Field | Value |
|---|---|
| Project name | Group Meet |
| Client | Private |
| Project slug | group-meet |
| Description | Group Meet lets external Participants request a meeting with a team, then automatically confirms the booking once one Leader and one Support have both indicated availability for the same time slot. |
| Project type | Internal tool |
| Tech stack | - Next.js 14 (App Router)- TypeScript- Supabase (Postgres + Row Level Security)- Vercel (hosting)- Resend (transactional email)- shadcn/ui + Tailwind CSS- react-hook-form + zod- date-fns |
| Planning folder | group-meet/ |
| Implementation repo | Downloaded project folder |
| Canonical GitHub repo | https://github.com/NaNo8831/Group-Meet |
| Created | 2026-06-05 |

---

## Business Problem

Scheduling meetings that require two specific internal roles (Leader and Support) is a manual, error-prone process driven by back-and-forth emails. There is no central place for Participants to submit a request or for team members to indicate availability, and no automation to trigger confirmation once the right people are free.

---

## Primary Users / Roles

- **Participant (external):** Submits a meeting request with their name, email, topic, and up to 5 proposed time slots. Receives a confirmation email when the meeting is locked in. Has a read-only status page to track their request. No account or login required.
- **Leader (internal team member):** Receives a notification email when a new request comes in. Clicks a unique link to select available time slots. One Leader must be confirmed for every meeting.
- **Support (internal team member):** Same voting flow as Leader. One Support must be confirmed for every meeting.

---

## Current Workflow

Scheduling is handled entirely by manual back-and-forth emails between the Participant and the team, with no structured process for confirming the right roles are available.

---

## Pain Points

- No single place for Participants to submit a request
- No visibility into which team members are available for a given slot
- Confirmation requires manual coordination between at least two internal people
- Easy to end up with a meeting that has the wrong role coverage or no coverage at all

---

## Target Workflow

1. Participant fills out a request form with their name, email, topic, and proposed time slots.
2. All active team members receive an email with a unique link to select their available slots.
3. After each vote, the system automatically checks if any slot now has both a Leader and a Support available.
4. If quorum is met, the earliest qualifying slot is confirmed, the meeting is locked, and confirmation emails are sent automatically to the Participant, the assigned Leader, and the assigned Support.

---

## Source Materials

- Rallly (https://rallly.co/) — referenced as UI/UX inspiration
- Project architecture documents: requirements.md, blueprint.md, acceptance.md, planning/STATE.md, planning/DECISIONS.md

---

## Systems / Tools Involved

- Supabase — database and Row Level Security
- Resend — transactional email (team notifications + confirmation emails)
- Vercel — hosting and deployment

---

## Data Inputs And Outputs

**Inputs:**
- Participant name, email, meeting topic, proposed time slots (date + start time + end time, up to 5)
- Team member availability votes (one or more slot selections per member)

**Outputs:**
- Meeting record stored in Supabase with status (pending / confirmed)
- Team notification emails with voting links (one per active team member)
- Participant confirmation email (confirmed date/time, assigned Leader and Support first names)
- Team confirmation emails to assigned Leader and Support (participant details, topic, confirmed date/time)
- Participant status page at /meetings/[id] (read-only, no login)

---

## Out Of Scope For First Version

- Ability for Participants to reschedule or cancel a confirmed meeting
- Admin dashboard for managing team members (team members seeded directly in the database for Phase 1)
- Calendar integration (Google Calendar, Outlook, .ics) — deferred to Phase 2
- Participant login or account creation
- Auth on voting links (Phase 1 uses ?member=[uuid] query param; magic link auth deferred to Phase 2)

---

## Success Criteria

- Zero back-and-forth emails required to schedule a meeting
- Every confirmed meeting is guaranteed to have exactly one Leader and one Support
- Participant receives a confirmation email with no manual intervention from the team

---

## Open Questions

- Where will the GitHub repository be hosted? (currently UNKNOWN)
- Will calendar integration (.ics, Google Calendar, Outlook) be added in Phase 2?
- Should the quorum logic ever prefer a slot other than the earliest qualifying one (e.g. highest team-member overlap)?
- What happens if no quorum is ever reached — is there a timeout or a manual override flow?

---

## Notes For Architect Pack 001

Use this intake as primary discovery context.

If details are incomplete, preserve unknowns in `planning/QUESTIONS.md`.

Do not invent business rules or technical facts.

Architect Pack 001 should remain planning/documentation only unless Ray explicitly says otherwise.
