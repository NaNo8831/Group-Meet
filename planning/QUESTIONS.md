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
