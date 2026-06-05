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

## Implemented Files
- `app/page.tsx` — participant request form with react-hook-form and zod validation.
- `app/meetings/[id]/page.tsx` — public participant status page.
- `app/team/meetings/[id]/page.tsx` and `TeamVotingForm.tsx` — team voting page and client-side submit flow.
- `app/api/meetings/route.ts` — meeting creation, slot insertion, active team lookup, team notification emails.
- `app/api/responses/route.ts` — response upsert, pending-state guard, quorum check, confirmation update, confirmation emails.
- `lib/quorum.ts` — earliest qualifying slot check.
- `lib/email.ts` — Resend helpers with non-fatal error logging.
- `supabase/schema.sql` and `supabase/seed.sql` — database tables, RLS policies, indexes, and initial Leader/Support seed data.

## Runtime Configuration
The app requires these environment variables in local development and Vercel:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
NEXT_PUBLIC_APP_URL=
```
