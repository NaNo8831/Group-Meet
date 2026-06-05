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
