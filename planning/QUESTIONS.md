# Group Meet — Open Questions

**Last updated:** 2026-11-12 (Sprint 008)

## Q-001: What happens if the threshold is never reached?
**Status:** Superseded by the domain workflow
**Context:** The domain model flags the request and notifies admin, who can re-notify professionals (Decisions 013 to 015). The legacy "no quorum" question no longer applies.

## Q-002: Calendar integration (.ics or calendar link)
**Status:** Open — deferred past the beta
**Context:** A calendar file or link in confirmation emails was flagged as a later goal.
**Decision needed:** Which format — `.ics` only, Google Calendar link, or both?

## Q-003: Slot selection preference
**Status:** Superseded
**Context:** The client picks the final slot from the matched slots (Decision 054). Earliest-wins no longer applies.

## Q-004: Team member management
**Status:** Resolved by Sprints 005 and 006
**Context:** Admins manage the roster at `/admin/professionals`. Pool assignment per meeting type arrives in Sprint 008. Old `team_members` data: see Q-010.

## Q-005: Client-facing branding
**Status:** Open
**Context:** The app name is Group Meet but no logo, color scheme, or brand voice is defined. Meeting type landing pages (Sprint 008) make this more visible.
**Decision needed:** Neutral shadcn/ui defaults or custom branding?

## Q-006: Live database state
**Status:** Resolved (2026-11-12)
**Context:** The Sprint 008 preflight confirmed the `professionals`, `requests`, `slots`, and `admins` tables, the Sprint 006 admin policies, and one Super Admin row. Migration `008` was applied by the operator (twice, no error) and the post-check passed. Migration `007` was reported applied earlier.

## Q-007: Which email templates does the beta need?
**Status:** Open
**Context:** `DOMAIN.md` lists eight templates. The `email_templates` table exists but has no UI or wiring.
**Decision needed:** Which are required for the beta (Sprint 010 scope).

## Q-008: Default minimum responses per meeting type
**Status:** Resolved by Decision 057 (2026-11-12)
**Context:** No default minimum; `min_responses` is optional per meeting type. Minimum matched slots defaults to 3.

## Q-009: Beta size
**Status:** Open
**Context:** How many real professionals and clients take part, and what counts as ready for the beta.
**Decision needed:** Operator answer; shapes the defaults in Q-008 and the Sprint 015 checklist.

## Q-010: Legacy `team_members` data
**Status:** Open
**Context:** The legacy flow uses `team_members` seeded by SQL. They are not the same records as the `professionals` roster.
**Decision needed:** Migrate them into `professionals` or drop them at Sprint 014.

## Q-011: Development email safeguard
**Status:** Open — for Sprint 010 planning
**Context:** Real testing needs 4 or 5 inboxes. Proposal: a development setting that sends all outgoing mail to one operator inbox with the intended recipient in the subject, plus plus-addressing (`name+pro1@domain`) once the Resend domain is verified. Until then Resend's test sender can only reach the account owner.
**Decision needed:** Adopt the redirect setting? Which inboxes and addresses for the beta check?

## Q-012: Where does admin password reset go on the road?
**Status:** Open — for the next Architect session
**Context:** No "Forgot password" link or reset page exists (R-015). Recommendation: a small guarded sprint before the beta.
**Decision needed:** Add it as its own sprint, or fold it into Sprint 015.
