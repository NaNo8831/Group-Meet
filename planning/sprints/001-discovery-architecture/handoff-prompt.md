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
