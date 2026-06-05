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
