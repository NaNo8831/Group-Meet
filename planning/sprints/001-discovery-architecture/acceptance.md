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
