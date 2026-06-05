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
