# Decisions
**Project:** Group Meet  
**Last updated:** [INSERT DATE]

Record of durable decisions future builders must respect. Do not re-litigate these without explicit operator approval.

---

## Decision Log

| # | Date | Decision | Reason | Impact |
|---|---|---|---|---|
| 001 | [DATE] | Meeting duration is fixed by type: In-depth = 75 min, Short-form = 45 min | Simplifies UX; client picks meeting type, duration is implicit | No free-form duration input; endsAt is always derived as startsAt + duration |
| 002 | [DATE] | End time is never set by the user | Derived server-side from startsAt + duration | UI never shows an end time input during request creation |
| 003 | [DATE] | No all-day date support | All meetings require a specific start time; max duration is 75 min | Rallly-style all-day PollOption pattern is not used; every slot must have a time |
| 004 | [DATE] | Calendar date cap = 28 days (4 weeks) from today | Professionals need reasonable advance notice; prevents far-future noise | Calendar disables any date beyond today + 28 days |
| 005 | [DATE] | No slot count cap | Constraint is time horizon (28 days), not number of slots | Removes the old 5-slot limit; any number of slots within the window is valid |
| 006 | [DATE] | Components live in src/components/ | Cleaner separation from Next.js route files in app/; establishes project convention | All future reusable UI components go in src/components/, not app/ |
| 007 | [DATE] | Clients have no account — identified by email only | Reduces friction for inbound requests | No auth system for clients; magic link is the only access mechanism |
| 008 | [DATE] | Professionals have no account — magic link only | Same friction reduction; professionals are managed by admin, not self-serve | No self-registration for professionals; admin controls the roster entirely |
| 009 | [DATE] | Admin is invite-only, login-protected, invited by Super Admin | Control and trust — not a public-facing role | No public admin registration flow |
| 010 | [DATE] | Super Admin is a distinct role with elevated permissions | Some permissions (invite admins, edit email templates, configure timezone) must be restricted | Role column on admin table; permission checks required on restricted routes |
| 011 | [DATE] | Email templates are Super Admin-editable, stored in database | Makes the system reusable and brand-flexible without code changes | Email content must never be hardcoded; all templates are database records |
| 012 | [DATE] | Response threshold = 4+ professionals responded AND 3+ matched slots | Ensures enough coverage and options before admin reviews | Threshold check runs after every professional response is saved |
| 013 | [DATE] | No professional response deadline — open-ended until threshold met | Avoids artificial urgency; threshold is the natural trigger | No deadline cron job needed; only a job for flagging stale/inactive requests |
| 014 | [DATE] | Leaving all slots blank = no response; no explicit decline option | Keeps the professional UX simple | No decline state needed in data model; absence of response is sufficient |
| 015 | [DATE] | Admin can manually re-notify professionals on flagged requests | Gives admin a recovery tool when threshold isn't met organically | Re-notify button on flagged request detail view; re-sends magic link emails |
| 016 | [DATE] | Professional responses are editable until admin locks the pairing | Professionals may need to update availability | Professional magic link stays live and writeable until locked status is set |
| 017 | [DATE] | Professional magic link page must clearly communicate editable-until-locked status | Prevents professionals from thinking their response is final prematurely | UI must show a visible status message on the professional response page |
| 018 | [DATE] | Professionals indicate role preference; admin makes final role assignment | Professionals know their strengths; admin has final accountability | Professional response includes role preference field (Lead / Support / Either); shown to admin during pairing |
| 019 | [DATE] | Client confirmation email does not include professional names | Product decision — names withheld from client | Confirmation email template for clients omits professional identity |
| 020 | [DATE] | Client can cancel via "No longer interested" on confirmation page only | No separate cancel flow needed; decline at confirmation is sufficient | Button on confirmation page; triggers silent cancel — admin notified only, no email to professionals |
| 021 | [DATE] | 3-business-day non-confirmation rule: near-term slots pruned, magic link switches to editing view, client emailed | Keeps slots practical; professionals need lead time | Requires scheduled job; business day calculation must exclude weekends (Sat/Sun) |
| 022 | [DATE] | Admin enters meeting location (address or video link) at pairing time | Location not known at request creation; admin determines it | Free-text location field on pairing approval screen; stored on confirmed meeting record; included in all confirmation emails |
| 023 | [DATE] | Client sees minimum 3 matched slots when confirming | Gives client meaningful choice | Threshold rule (3 matched slots) directly enforces this |
| 024 | [DATE] | In-depth professionals can fill any role on any meeting type | Tier is a capability ceiling, not a restriction | Role-matching logic: In-depth qualifies for all; General qualifies for Short-form only |
| 025 | [DATE] | Professional CSV import requires name + email only; tier defaults to General post-import | Keeps import simple; tier changes over time | CSV parser expects name and email columns; tier set manually after import via dashboard |
| 026 | [DATE] | Admin dashboard shows only active requests — no historical view | Admin focus is on action items, not history | Completed and cancelled requests are not surfaced in the dashboard |
| 027 | [DATE] | All slots stored and displayed in platform business timezone | Eliminates per-user timezone complexity | No timezone conversion logic needed; all times treated as business timezone throughout |
| 028 | [DATE] | Default platform timezone = US/Eastern; configurable by Super Admin in settings | Sensible US default; flexibility for future without code change | Timezone stored as a platform setting in the database; used in all slot formatting and business-day calculations |
| 029 | [DATE] | Request statuses: Pending → Flagged or Ready for pairing → Paired → Awaiting confirmation → Confirmed → Completed / Cancelled | Covers all known states in the workflow | Status field is an enum; all transitions must be explicit and logged |