============================================================
FILE: planning/STATE.md
============================================================

# Group Meet — Project State

**Last Updated:** Architect Pack 001 applied
**Status:** SPRINT 001 READY — awaiting Builder execution

## What Exists
- GitHub repo: https://github.com/NaNo8831/Group-Meet
- Project folder with requirements, blueprint, acceptance criteria, and handoff prompt
- Supabase and Resend accounts needed before Builder starts

## Sprint 001 Goal
Deliver a fully working Group Meet v1:
- Next.js scaffold + all dependencies installed
- Supabase schema created, RLS enabled, team members seeded
- Participant request form at `/`
- Participant status page at `/meetings/[id]`
- Team voting page at `/team/meetings/[id]?member=[uuid]`
- API routes: POST /api/meetings, POST /api/responses (with quorum logic)
- All three Resend email types
- Deployed to Vercel

## Blockers
- Supabase project must be created and connection string/keys added to `.env.local`
- Resend account and API key required
- Vercel project must be linked to GitHub repo

## Next After Sprint 001
- Phase 2 planning: magic link auth, calendar integration (.ics), admin dashboard

============================================================
FILE: planning/DECISIONS.md
============================================================

# Group Meet — Decisions Log

## D-001: No auth on voting links (Phase 1)
**Decision:** Team member voting links use a `?member=[uuid]` query param. No login required.
**Why:** Speed of build. Audience is trusted internal team members receiving links via email.
**Trade-off:** Link could theoretically be forwarded and voted on by someone else.
**Phase 2 plan:** Replace with Supabase magic link auth.

## D-002: Email via Resend
**Decision:** Use Resend for all transactional email.
**Why:** Simple API, generous free tier, React email support for future use.
**Trade-off:** One additional service to configure.

## D-003: Quorum picks the earliest qualifying slot
**Decision:** When multiple slots have both a Leader and Support response, confirm the earliest one.
**Why:** Simple, unambiguous logic. No admin decision required.
**Trade-off:** May not always be the most convenient slot. Revisit in Phase 2 if needed.

## D-004: Email failure does not roll back meeting creation
**Decision:** If Resend fails, the meeting record is still saved and the error is logged.
**Why:** A DB write should not be undone due to a downstream email failure.
**Trade-off:** Team members may miss their voting link — monitoring recommended.

## D-005: Team members seeded directly in DB (Phase 1)
**Decision:** No admin UI. Team members inserted via Supabase dashboard or seed SQL.
**Why:** Reduces scope. Team composition is stable.
**Phase 2 plan:** Admin dashboard at `/admin` behind Supabase Auth.

## D-006: Next.js 14 App Router
**Decision:** Use App Router, not Pages Router.
**Why:** Modern pattern, better server component and API route co-location.
**Trade-off:** Some shadcn/ui components require `"use client"` — handle case by case.

## D-007: Full MVP in Sprint 001
**Decision:** Deliver the complete shippable v1 in one sprint.
**Why:** App is well-scoped, data model is clear, no ambiguous features in Phase 1.
**Trade-off:** Sprint is larger than a typical first sprint — Builder should work feature by feature in the order defined in handoff-prompt.md.

============================================================
FILE: planning/DOMAIN.md
============================================================

# Group Meet — Domain Context

## Core Concept
A meeting in Group Meet requires **quorum**: at least one team member with the role of **Leader** and at least one with the role of **Support** must both select the same proposed time slot. When quorum is detected, the meeting is automatically confirmed.

## Key Terms

| Term | Meaning |
|---|---|
| Participant | External person requesting the meeting. No account required. |
| Leader | Internal team member. One required per confirmed meeting. |
| Support | Internal team member. One required per confirmed meeting. |
| Time Slot | A proposed date + start time + end time submitted by the Participant. |
| Response | A team member's vote indicating availability for a specific slot. |
| Quorum | The condition where ≥1 Leader and ≥1 Support have both responded to the same slot. |
| Confirmed Slot | The earliest time slot that has achieved quorum. |
| Voting Link | A unique URL sent to each team member: `/team/meetings/[id]?member=[uuid]` |

## Status Lifecycle
```
pending → confirmed
```
- `pending`: Meeting created, awaiting team votes
- `confirmed`: Quorum met, slot locked, emails sent
- `cancelled`: Reserved for Phase 2

## Quorum Logic (plain language)
After every new response is saved:
1. Loop through all time slots for the meeting, ordered by earliest first
2. For each slot, check if there is at least one Leader response AND at least one Support response
3. If yes → that slot is the confirmed slot. Stop checking.
4. If no → continue to next slot
5. If no slot qualifies → do nothing, wait for more votes

============================================================
FILE: planning/RISKS.md
============================================================

# Group Meet — Risks

## R-001: No quorum is ever reached
**Risk:** All Leaders are busy during Support-available slots and vice versa. Meeting stays pending indefinitely.
**Likelihood:** Low–Medium
**Impact:** Medium — Participant hears nothing
**Mitigation (Phase 1):** None automated. Team member manually coordinates offline.
**Phase 2 plan:** Add a timeout notification and/or manual override by an admin.

## R-002: Voting link forwarded or reused
**Risk:** A team member forwards their unique voting link and someone else votes on their behalf.
**Likelihood:** Low
**Impact:** Low — wrong person's availability recorded
**Mitigation (Phase 1):** Acceptable risk given trusted internal audience.
**Phase 2 plan:** Supabase magic link auth replaces query param.

## R-003: Resend email delivery failure
**Risk:** Team notification email fails to send — team members never know a request came in.
**Likelihood:** Low
**Impact:** High — meeting stays pending silently
**Mitigation:** Log all Resend errors. Meeting creation does not fail. Manual re-trigger possible via Supabase dashboard in emergency.

## R-004: Duplicate quorum trigger
**Risk:** Two responses inserted nearly simultaneously both trigger the quorum check, resulting in duplicate confirmation emails.
**Likelihood:** Low
**Impact:** Medium — confusing for recipients
**Mitigation:** Check `meeting.status === 'pending'` before running quorum check and before sending emails. Use Supabase's atomic update to set status to `confirmed` only once.

## R-005: Participant submits duplicate requests
**Risk:** Participant submits the form multiple times, creating duplicate meeting records.
**Likelihood:** Medium
**Impact:** Low — wastes team bandwidth
**Mitigation (Phase 1):** No deduplication logic. Accept as known limitation.
**Phase 2 plan:** Add email-based deduplication check within a time window.

============================================================
FILE: planning/QUESTIONS.md
============================================================

# Group Meet — Open Questions

## Q-001: What happens if quorum is never reached?
**Status:** Open
**Context:** No timeout or manual override exists in Phase 1. Participant may wait indefinitely.
**Decision needed:** Should the system send a "we couldn't find a time" email after N days?

## Q-002: Calendar integration in Phase 2?
**Status:** Open — deferred
**Context:** Sending a `.ics` file or Google Calendar invite in confirmation emails was flagged as a Phase 2 goal.
**Decision needed:** Which format — `.ics` only, Google Calendar link, or both?

## Q-003: Slot selection preference
**Status:** Open
**Context:** Currently the earliest qualifying slot wins. Should the system ever prefer a different slot (e.g. the one with the most team members available)?
**Decision needed:** Confirm earliest-wins is acceptable for Phase 1.

## Q-004: Team member management
**Status:** Deferred to Phase 2
**Context:** Phase 1 seeds team members directly in the database. No UI to add/remove/deactivate members.
**Decision needed:** Who manages team members, and how often does the list change?

## Q-005: Participant-facing branding
**Status:** Open
**Context:** The app name is Group Meet but no logo, color scheme, or brand voice has been defined.
**Decision needed:** Use a neutral default style (shadcn/ui defaults) or apply custom branding?

============================================================
FILE: planning/FILE_INVENTORY.md
============================================================

# Group Meet — File Inventory

## Planning Folder
| File | Purpose |
|---|---|
| `planning/STATE.md` | Current project status and sprint goals |
| `planning/DECISIONS.md` | Architectural and product decisions with rationale |
| `planning/DOMAIN.md` | Domain terminology, status lifecycle, quorum logic |
| `planning/RISKS.md` | Known risks and mitigations |
| `planning/QUESTIONS.md` | Open questions and deferred decisions |
| `planning/FILE_INVENTORY.md` | This file |
| `planning/architect-packs/architect-pack-001-discovery.md` | This pack |
| `planning/sprints/001-discovery-architecture/requirements.md` | Sprint 001 requirements |
| `planning/sprints/001-discovery-architecture/blueprint.md` | Sprint 001 technical blueprint |
| `planning/sprints/001-discovery-architecture/acceptance.md` | Sprint 001 acceptance criteria |
| `planning/sprints/001-discovery-architecture/handoff-prompt.md` | Builder handoff prompt |

## Docs Folder
| File | Purpose |
|---|---|
| `docs/ARCHITECTURE.md` | System architecture overview |
| `docs/API.md` | API route reference |
| `docs/VALIDATION.md` | Validation and testing expectations |

## Application (to be created by Builder)
| Path | Purpose |
|---|---|
| `app/page.tsx` | Participant request form |
| `app/meetings/[id]/page.tsx` | Participant status page |
| `app/team/meetings/[id]/page.tsx` | Team member voting page |
| `app/api/meetings/route.ts` | POST: create meeting + slots, send team emails |
| `app/api/responses/route.ts` | POST: record vote, run quorum check |
| `lib/supabase.ts` | Supabase client (server + browser) |
| `lib/email.ts` | Resend email helpers |
| `lib/quorum.ts` | Quorum check logic |
| `lib/types.ts` | Shared TypeScript types |
| `.env.example` | Environment variable template |
| `supabase/schema.sql` | Database schema + RLS |
| `supabase/seed.sql` | Team member seed data |

============================================================
FILE: planning/sprints/001-discovery-architecture/requirements.md
============================================================

# Sprint 001 — Requirements

## Sprint Goal
Deliver a complete, shippable Group Meet v1 that allows a Participant to request a meeting, team members to vote on availability, and the system to automatically confirm the meeting and notify all parties when quorum is reached.

## In Scope

### 1. Project Scaffold
- Initialize Next.js 14 project with TypeScript and App Router
- Install and configure: shadcn/ui, Tailwind CSS, react-hook-form, zod, date-fns, @supabase/supabase-js, resend
- Set up `.env.example` with all required variables
- Configure Supabase client for both server and browser contexts

### 2. Database
- Create all four tables: `team_members`, `meetings`, `time_slots`, `responses`
- Enable RLS on all tables with appropriate policies
- Seed at least one Leader and one Support into `team_members`

### 3. Participant Request Form (`/`)
- Fields: name, email, topic, time slots (date + start + end, min 1, max 5)
- Add/remove slot controls
- Zod validation: all fields required, valid email, end time after start time
- On success: redirect to `/meetings/[id]`
- On error: show inline message, preserve form state

### 4. Participant Status Page (`/meetings/[id]`)
- Public, no login
- Shows: topic, participant name, status badge
- Pending state: "Waiting for team availability confirmation"
- Confirmed state: date, time, Leader first name, Support first name
- Invalid ID: clean "Meeting not found" message

### 5. Team Voting Page (`/team/meetings/[id]?member=[uuid]`)
- Identifies team member from `member` query param
- Shows: member name + role, meeting topic, participant name, all proposed slots
- Selectable slots (checkbox or toggle card)
- Submit disabled until ≥1 slot selected
- If meeting already confirmed: show confirmation message, no voting
- On submit: POST responses, show thank-you state

### 6. API Routes
**POST `/api/meetings`**
- Validate input with zod
- Insert meeting + time slots into Supabase
- Fetch all active team members
- Send team notification email via Resend (one per member)
- Return `{ meetingId }`

**POST `/api/responses`**
- Validate input with zod
- Check meeting is still `pending`
- Insert responses (one per selected slot)
- Run quorum check
- If quorum: confirm meeting, send confirmation emails, return `{ confirmed: true }`
- If no quorum: return `{ confirmed: false }`

### 7. Quorum Logic (`lib/quorum.ts`)
- Loop time slots for the meeting ordered by `starts_at` ascending
- For each slot: check if ≥1 Leader response AND ≥1 Support response exist
- Return the first qualifying slot, or null
- Must be idempotent — safe to call multiple times

### 8. Email Notifications (Resend)
**Team notification:** sent on meeting creation to all active team members
**Participant confirmation:** sent when quorum is met
**Team confirmation:** sent to assigned Leader and Support when quorum is met

### 9. Deployment
- App deploys to Vercel without build errors
- Environment variables configured in Vercel project settings
- `npm run build` passes with zero TypeScript errors

## Out of Scope (Phase 1)
- Auth on voting links (query param only)
- Participant reschedule / cancel
- Admin dashboard for team member management
- Calendar integration (.ics, Google Calendar)
- Participant account creation or login
- No-quorum timeout or override

============================================================
FILE: planning/sprints/001-discovery-architecture/blueprint.md
============================================================

# Sprint 001 — Blueprint

## Project Structure

```
app/
├── page.tsx                            # Participant request form
├── meetings/
│   └── [id]/
│       └── page.tsx                    # Participant status page
├── team/
│   └── meetings/
│       └── [id]/
│           └── page.tsx                # Team voting page
└── api/
    ├── meetings/
    │   └── route.ts                    # POST: create meeting
    └── responses/
        └── route.ts                    # POST: record vote + quorum

lib/
├── supabase.ts                         # Supabase clients (server + browser)
├── email.ts                            # Resend helpers
├── quorum.ts                           # Quorum check logic
└── types.ts                            # Shared TypeScript types

supabase/
├── schema.sql                          # All tables + RLS
└── seed.sql                            # Team member seed data

.env.example
```

---

## Database Schema

```sql
-- team_members
create table team_members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  role text not null check (role in ('leader', 'support')),
  is_active boolean not null default true,
  created_at timestamptz default now()
);

-- meetings
create table meetings (
  id uuid primary key default gen_random_uuid(),
  participant_name text not null,
  participant_email text not null,
  topic text not null,
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'cancelled')),
  confirmed_slot_id uuid references time_slots(id),
  confirmed_leader_id uuid references team_members(id),
  confirmed_support_id uuid references team_members(id),
  created_at timestamptz default now()
);

-- time_slots
create table time_slots (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references meetings(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  created_at timestamptz default now()
);

-- responses
create table responses (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references meetings(id) on delete cascade,
  slot_id uuid not null references time_slots(id) on delete cascade,
  team_member_id uuid not null references team_members(id),
  created_at timestamptz default now(),
  unique(team_member_id, slot_id)
);
```

## RLS Policies

```sql
alter table meetings enable row level security;
create policy "public insert" on meetings for insert with check (true);
create policy "public read" on meetings for select using (true);
create policy "service update" on meetings for update using (true);

alter table time_slots enable row level security;
create policy "public insert" on time_slots for insert with check (true);
create policy "public read" on time_slots for select using (true);

alter table responses enable row level security;
create policy "public insert" on responses for insert with check (true);
create policy "public read" on responses for select using (true);

alter table team_members enable row level security;
create policy "public read active" on team_members for select using (is_active = true);
```

---

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
NEXT_PUBLIC_APP_URL=
```

---

## API Route Logic

### POST `/api/meetings`
```typescript
// 1. Parse + validate body with zod
// 2. Insert into meetings
// 3. Insert all slots into time_slots
// 4. Fetch all active team_members
// 5. For each member: send team notification email via Resend
// 6. Return { meetingId }
```

### POST `/api/responses`
```typescript
// 1. Parse + validate body: { meetingId, slotIds: string[], teamMemberId }
// 2. Fetch meeting — return 409 if status !== 'pending'
// 3. Insert one response row per slotId (upsert on conflict)
// 4. Call checkQuorum(meetingId)
// 5. If quorum slot returned:
//    a. Update meeting: status='confirmed', confirmed_slot_id, confirmed_leader_id, confirmed_support_id
//    b. Send 3 confirmation emails via Resend
//    c. Return { confirmed: true, slot }
// 6. Else return { confirmed: false }
```

### Quorum Check (`lib/quorum.ts`)
```typescript
export async function checkQuorum(meetingId: string) {
  // Fetch all slots for meeting ordered by starts_at asc
  // For each slot:
  //   fetch responses joined with team_members
  //   check roles array includes 'leader' AND 'support'
  //   if yes: return { slot, leaderId, supportId }
  // Return null if no qualifying slot
}
```

---

## Email Templates

### Team Notification
```
Subject: New meeting request from {participantName}
To: {teamMemberEmail}

{participantName} has requested a meeting.
Topic: {topic}

Proposed times:
{slot list — formatted date + time range}

Select your availability:
{votingLink}
```

### Participant Confirmation
```
Subject: Your meeting is confirmed — {formattedDate}
To: {participantEmail}

Your meeting has been confirmed.
Date & Time: {formattedDateTime}
You will meet with: {leaderName} and {supportName}
```

### Team Confirmation
```
Subject: Meeting confirmed with {participantName} — {formattedDate}
To: {leaderEmail} and {supportEmail}

Participant: {participantName} ({participantEmail})
Topic: {topic}
Date & Time: {formattedDateTime}
```

---

## Voting Link Format
```
{NEXT_PUBLIC_APP_URL}/team/meetings/{meetingId}?member={teamMemberId}
```

============================================================
FILE: planning/sprints/001-discovery-architecture/acceptance.md
============================================================

# Sprint 001 — Acceptance Criteria

## 1. Project Scaffold
- [ ] `npm run dev` starts without errors
- [ ] `npm run build` completes with zero TypeScript errors
- [ ] `.env.example` lists all required variables with blank values
- [ ] shadcn/ui, Tailwind, react-hook-form, zod, date-fns, supabase-js, resend all installed

## 2. Database
- [ ] All four tables exist in Supabase with correct columns and constraints
- [ ] RLS is enabled on all four tables
- [ ] At least one Leader and one Support exist in `team_members`
- [ ] `supabase/schema.sql` and `supabase/seed.sql` committed to repo

## 3. Participant Request Form (`/`)
- [ ] All fields render: name, email, topic, at least one time slot
- [ ] "Add another time" adds a slot row (max 5)
- [ ] Remove button removes a slot row (min 1 remains)
- [ ] Validation fires on submit: all fields required, valid email, end after start
- [ ] Successful submit redirects to `/meetings/[id]`
- [ ] Failed API call shows error message without clearing form
- [ ] Form is usable on mobile

## 4. Participant Status Page (`/meetings/[id]`)
- [ ] Loads for any valid meeting UUID
- [ ] Shows topic, participant name, status badge
- [ ] Pending: shows waiting message
- [ ] Confirmed: shows date, time, Leader first name, Support first name
- [ ] Unknown UUID: shows "Meeting not found"
- [ ] No login required

## 5. Team Voting Page
- [ ] Loads correctly with valid `meetingId` and `member` query params
- [ ] Shows team member name and role
- [ ] Lists all proposed time slots as selectable options
- [ ] Submit disabled until at least one slot selected
- [ ] On submit: votes recorded, thank-you state shown
- [ ] If meeting already confirmed: shows confirmation message, no form shown
- [ ] Usable on mobile

## 6. API Routes
- [ ] `POST /api/meetings` creates meeting + slots + sends team emails
- [ ] `POST /api/responses` records votes and runs quorum check
- [ ] Both routes return appropriate error responses for invalid input
- [ ] Quorum check does not run if meeting is already confirmed

## 7. Quorum Logic
- [ ] Meeting confirms when ≥1 Leader and ≥1 Support select the same slot
- [ ] Earliest qualifying slot is selected when multiple qualify
- [ ] Meeting does not confirm when only one role has responded
- [ ] Confirmed meeting cannot be re-confirmed

## 8. Emails
- [ ] Team notification email sent to all active members on meeting creation
- [ ] Voting link in email resolves to correct team voting page
- [ ] Participant confirmation email sent when quorum is met
- [ ] Leader and Support confirmation emails sent when quorum is met
- [ ] Resend failure logs error but does not crash the API route

## 9. Deployment
- [ ] App deployed to Vercel
- [ ] All env vars set in Vercel project settings
- [ ] Production URL loads request form without errors

============================================================
FILE: planning/sprints/001-discovery-architecture/handoff-prompt.md
============================================================

# Sprint 001 — Builder Handoff Prompt

Paste this prompt in full at the start of your Codex / Claude Code session.

---

You are building **Group Meet** — a lightweight meeting scheduling app.

## The Problem
An external Participant wants to meet with our team. Every confirmed meeting requires exactly one team member with the role of **Leader** and one with the role of **Support**. Today this is coordinated manually by email. Group Meet automates the entire flow.

## The Flow
1. Participant submits a request form: name, email, topic, up to 5 proposed time slots.
2. All active team members receive a notification email with a unique link to vote on their availability.
3. After each vote, the system checks if any slot now has both a Leader and a Support available (quorum).
4. If quorum is met, the earliest qualifying slot is confirmed. Confirmation emails go to the Participant, the assigned Leader, and the assigned Support.

## The Stack
- Next.js 14 (App Router) + TypeScript
- Supabase (Postgres + RLS) — database
- Resend — transactional email
- shadcn/ui + Tailwind CSS — UI
- react-hook-form + zod — forms and validation
- date-fns — date formatting
- Vercel — deployment

## Source of Truth
All requirements, schema, acceptance criteria, and decisions live in the planning folder:
- `planning/sprints/001-discovery-architecture/requirements.md` — what to build
- `planning/sprints/001-discovery-architecture/blueprint.md` — schema, routes, logic, email templates
- `planning/sprints/001-discovery-architecture/acceptance.md` — done means what
- `planning/DECISIONS.md` — house rules, do not override without reading
- `planning/RISKS.md` — known risks and mitigations
- `planning/QUESTIONS.md` — open questions, do not invent answers

## Build Order
Work in this sequence to minimize blockers:

1. Initialize Next.js project with all dependencies
2. Create `supabase/schema.sql` and `supabase/seed.sql` — run in Supabase dashboard
3. Set up `lib/supabase.ts`, `lib/types.ts`, `lib/quorum.ts`, `lib/email.ts`
4. Build `POST /api/meetings` route
5. Build `POST /api/responses` route (includes quorum check)
6. Build Participant request form at `/`
7. Build Participant status page at `/meetings/[id]`
8. Build Team voting page at `/team/meetings/[id]`
9. Test end-to-end locally
10. Deploy to Vercel

## Rules
- App Router only — no Pages Router
- TypeScript strict — no `any` unless genuinely necessary
- Validate all user input with zod
- No hardcoded secrets — all config via environment variables
- Keep components small, co-located with their page where possible
- Email failure must not crash an API route — catch and log
- Quorum check must verify `meeting.status === 'pending'` before confirming
- Do not add features not in requirements.md without flagging them

## Environment Variables Needed
```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
NEXT_PUBLIC_APP_URL=
```

## Voting Link Format
```
{NEXT_PUBLIC_APP_URL}/team/meetings/{meetingId}?member={teamMemberId}
```

Ready. Begin with Step 1: initialize the Next.js project.

============================================================
FILE: docs/ARCHITECTURE.md
============================================================

# Group Meet — Architecture

## System Overview

```
Participant (browser)
    └── POST /api/meetings
            ├── Supabase: insert meeting + slots
            └── Resend: team notification emails → each team member

Team Member (email link)
    └── GET /team/meetings/[id]?member=[uuid]
            └── POST /api/responses
                    ├── Supabase: insert response rows
                    ├── lib/quorum.ts: checkQuorum()
                    └── (if quorum) Resend: 3 confirmation emails
                                   Supabase: update meeting status
```

## Key Design Principles
- **No auth in Phase 1.** Voting links use a UUID query param. Trusted internal use only.
- **Email failure is non-fatal.** Meeting records are never rolled back due to email errors.
- **Quorum is idempotent.** The check can run multiple times safely — it only acts when `status === 'pending'`.
- **Earliest slot wins.** When multiple slots qualify, the one with the earliest `starts_at` is confirmed.

## Data Flow

### Meeting Creation
1. Participant submits form → `POST /api/meetings`
2. Zod validates input
3. Supabase inserts `meetings` row (status: pending)
4. Supabase inserts `time_slots` rows
5. Supabase fetches all active `team_members`
6. Resend sends one email per team member with voting link
7. API returns `{ meetingId }`
8. Browser redirects to `/meetings/[id]`

### Voting + Confirmation
1. Team member clicks email link → `/team/meetings/[id]?member=[uuid]`
2. Page loads meeting + slots from Supabase
3. Member selects available slots → `POST /api/responses`
4. Supabase inserts `responses` rows
5. `checkQuorum()` runs: queries slots + responses + team member roles
6. If quorum: Supabase updates meeting, Resend sends 3 emails
7. Browser shows confirmed or thank-you state

## Infrastructure
- **Frontend + API:** Next.js 14 on Vercel (serverless functions)
- **Database:** Supabase (managed Postgres, Sydney or nearest region)
- **Email:** Resend (transactional, SMTP-free)
- **Repo:** https://github.com/NaNo8831/Group-Meet

============================================================
FILE: docs/API.md
============================================================

# Group Meet — API Reference

## POST `/api/meetings`

Creates a new meeting request and notifies the team.

**Request body:**
```json
{
  "participantName": "string",
  "participantEmail": "string (valid email)",
  "topic": "string",
  "slots": [
    {
      "startsAt": "ISO 8601 datetime string",
      "endsAt": "ISO 8601 datetime string"
    }
  ]
}
```

**Validation rules:**
- All fields required
- `participantEmail` must be valid email format
- `slots` must have 1–5 items
- Each slot: `endsAt` must be after `startsAt`

**Success response (200):**
```json
{ "meetingId": "uuid" }
```

**Error response (400):**
```json
{ "error": "Validation error message" }
```

---

## POST `/api/responses`

Records a team member's availability votes and checks for quorum.

**Request body:**
```json
{
  "meetingId": "uuid",
  "slotIds": ["uuid", "uuid"],
  "teamMemberId": "uuid"
}
```

**Validation rules:**
- All fields required
- `slotIds` must have at least 1 item
- Meeting must exist and have `status === 'pending'`

**Success response — no quorum (200):**
```json
{ "confirmed": false }
```

**Success response — quorum met (200):**
```json
{
  "confirmed": true,
  "slot": {
    "id": "uuid",
    "startsAt": "ISO 8601",
    "endsAt": "ISO 8601"
  }
}
```

**Error response — already confirmed (409):**
```json
{ "error": "Meeting is already confirmed" }
```

============================================================
FILE: docs/VALIDATION.md
============================================================

# Group Meet — Validation Plan

## Approach
Phase 1 uses manual end-to-end testing. No automated test suite is required for v1 launch. The acceptance criteria in `planning/sprints/001-discovery-architecture/acceptance.md` serve as the validation checklist.

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
2. Submit request form with end time before start time — verify error
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
