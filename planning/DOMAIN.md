# Domain Context
**Project:** Group Meet  
**Last updated:** 2026-11-06 (Sprint 007: aligned to Decisions 047 to 056 - admin-defined meeting types, named durations, roles with required counts, pools)

---

## Business Goal

Enable clients to request a meeting with a matched team of professionals, where the team is whatever roles the meeting type requires. The system coordinates availability across the professionals in that meeting type's pool, routes admin approval, and delivers a confirmed meeting to both the client and the assigned professionals — with no login required for either clients or professionals.

---

## Users / Roles

### Client
- Has no account; identified by name + email only
- Submits a meeting request via a public-facing form
- Proposes their own available dates and times
- Receives a magic link when admin approves a pairing
- Selects one slot from the presented matched options and confirms the meeting
- Can click "No longer interested" on the confirmation page to silently cancel their request — only admin is notified, no email sent to professionals
- If they do not confirm within 3 business days of receiving the magic link, any slots within the next 3 business days are automatically removed and their magic link switches to an editing view so they can adjust or add new dates
- Receives a confirmation email with date, time, location, and meeting type (professional names not included)

### Professional
- Has no account; identified by name + email only (managed by admin)
- Receives a magic-link email when a new request is for a meeting type whose pool they belong to
- Reviews the client's proposed slots and selects which they can attend
- Indicates which roles they can take for this request, from the roles they hold in that meeting type's pool (for example Lead, Support, or both)
- Can return to their magic link and update availability until admin locks the pairing
- The magic link page must clearly communicate it remains editable until locked
- Receives a "this request has been filled" email if not selected
- Receives a confirmation email with date, time, location, meeting type, and client name if selected
- Declining entirely is not supported — leaving all slots blank is equivalent to not responding

### Admin
- Login-protected dashboard, invite-only, invited by Super Admin
- Creates and edits meeting types: title, landing page, shareable link, named duration options, roles with required counts, and the pool of professionals (with the roles each can fill)
- Manages professional roster (CSV upload, manual entry, removal)
- Monitors all active requests across all statuses (no historical view of completed/cancelled)
- Receives notification when a request is ready for pairing review
- Receives notification when a request is flagged and can manually re-notify professionals
- Receives silent notification when a client cancels via "No longer interested"
- Selects the final professional for each required role from available professional responses
- Enters meeting location (physical address or video link) during pairing approval
- Approves pairing and triggers client magic link
- Cannot edit email templates (Super Admin only)

### Super Admin
- Separate role with elevated permissions above Admin
- Can do everything Admin can do (Admin and Super Admin can both create and edit meeting types)
- Only Super Admin can invite and manage admin accounts, edit email templates, and change platform settings
- Can edit email templates via the dashboard (templates stored in database, not hardcoded)
- Can configure platform-wide settings including the business timezone (default: US/Eastern)

---

## Meeting Types

Meeting types are admin-defined data, not a fixed list. Admin or Super Admin creates each one in the admin workspace. A meeting type has:

| Part | Meaning |
|---|---|
| Title and landing page | What the client sees at the meeting type's shareable link. |
| Shareable link (slug) | One unique, URL-safe link per meeting type. A public page lists the active meeting types. |
| Duration options | Named lengths defined per meeting type, for example Short 30 min, Normal 45 min, Long 60 min. The client picks one; the client never types a duration. |
| Roles | Named roles with a required count each, for example 1 Lead and 1 Support, or 1 Lead and 2 Support. Roles belong to the meeting type, not to a duration option. |
| Pool | The professionals assigned to this meeting type, with the roles each of them can fill. Only the pool is notified of a request. |
| Threshold settings | Minimum matched slots (default 3) and a minimum number of responses, editable per meeting type. |

The two original types, In-depth (75 min) and Short-form (45 min), become the first two seeded meeting types, each with one duration option.

### Role coverage rules
- Every required role must be filled, in the required count, by distinct professionals.
- A professional can fill a role only if they hold it in the meeting type's pool.
- The earlier professional tier concept is superseded by pools and roles (Decision 050).

## Professional Pool Membership

A professional's eligibility is decided per meeting type: they are in the pool, and the pool entry lists which roles they can fill. One global roster feeds every pool. The roster is managed by admin and a professional can be in many pools.

---

## Timezone

All slots are stored and displayed in the configured business timezone. Default is **US/Eastern**. Super Admin can change the platform timezone in settings. There is no per-user or per-client timezone conversion.

---

## Core Workflow

### 1. Client submits request
- Client opens the shareable link for one meeting type (or picks it from the public list of active meeting types)
- Public form: name, email, and one of the meeting type's named duration options — the client never types a duration
- Client proposes available dates and times using the date/time picker
- All times are in the platform business timezone

### 2. Professionals are notified
- All professionals in the requested meeting type's pool receive a magic-link email
- Magic link opens a response page showing the client's proposed slots in the business timezone
- Professional selects available slots and indicates which of their pool roles they can take (one or more)
- Professional can return to the same link and update response until admin locks the pairing
- Page clearly communicates the editable-until-locked status
- Leaving all slots blank is treated as no response (no explicit decline option)

### 3. System monitors response threshold
- Threshold, set per meeting type: **every required role can be filled, in its required count, by distinct qualified professionals in at least the minimum number of matched slots (default 3)**, and the minimum number of responses is reached
- No deadline — threshold is open-ended
- If threshold is not met: flag the request and notify admin to intervene
- Admin can manually re-notify all professionals on a flagged request

### 4. Admin reviews and approves pairing
- Admin notified when threshold is met
- Admin dashboard shows: client details, meeting type, all professional responses, matched slots
- Admin selects the professional for each required role
- Admin enters meeting location (free-text: physical address or video link)
- Admin approves — pairing locked, professional responses frozen, client magic link sent

### 5. Client confirms or cancels
- Client receives magic-link email with 3+ matched slots
- Magic link opens their personal request page
- Client selects one slot → meeting is booked
- Client clicks "No longer interested" → request silently cancelled, admin notified only

### 6. Client non-confirmation (3-business-day rule)
- If client has not confirmed or cancelled within 3 business days of receiving their magic link:
  - Any proposed slots within the next 3 business days are automatically removed
  - The magic link switches to an editing view
  - Client receives an email asking them to review and adjust their proposed times
  - Process resets to Step 2 with updated dates

### 7. Confirmation emails sent
- Each confirmed professional (every filled role): date, time, location, meeting type, client name
- Client: date, time, location, meeting type (no professional names)
- Professionals not selected: "This request has been filled"

---

## Key Terms

| Term | Meaning |
|---|---|
| Request | A client-submitted meeting request with proposed slots |
| Slot | A specific date + start time proposed by the client |
| Meeting type | Admin-defined data: title, landing page, shareable link, named duration options, roles with required counts, and a pool |
| Duration option | A named length (for example Short 30, Normal 45) defined per meeting type; the client picks one |
| Role | A named position a meeting type requires, with a required count (for example Lead, Support) |
| Pool | The professionals assigned to a meeting type, with the roles each can fill |
| Pairing | Admin-selected professionals, one per required role slot, for a request |
| Matched slot | A slot where every required role can be filled by distinct qualified professionals who indicated availability |
| Magic link | A unique tokenized URL giving a user access to their specific page without a password |
| Response threshold | Per meeting type: required roles coverable in at least the minimum matched slots (default 3) and the minimum responses reached — triggers admin pairing review |
| Locked | Admin has approved a pairing; professional responses can no longer be updated |
| Flagged | Threshold not met; admin intervention required |
| Business timezone | Platform-wide timezone used for all slot storage and display; default US/Eastern; configurable by Super Admin |
| 3-business-day rule | If client doesn't confirm within 3 business days of pairing: near-term slots pruned, magic link switches to editing view |
| No longer interested | Client-facing cancellation option on confirmation page; silently cancels request, notifies admin only |
| Email template | Super Admin-editable content stored in database; drives all system emails |

---

## Business Rules

1. Every meeting requires each of its meeting type's roles to be filled in the required count, by distinct professionals
2. A professional can fill a role only if they hold it in the meeting type's pool
3. Meeting types, duration options, roles, and pools are admin-defined data (Admin or Super Admin)
4. The earlier professional tier concept is superseded by pools and roles (Decision 050)
5. Only the meeting type's pool is notified of a request
6. Duration comes from the duration option the client picks, defined per meeting type — never typed by the user
7. End time is always derived as startsAt + duration — never entered manually
8. All slots are stored and displayed in the platform business timezone (default US/Eastern)
9. Admin pairing review only triggered after the meeting type's threshold is met (default: required roles coverable in at least 3 matched slots)
10. No professional response deadline — threshold is open-ended
11. Leaving all slots blank equals no response — there is no explicit decline option
12. Professional responses are editable until admin locks the pairing
13. Professional magic link page must clearly communicate it is editable until locked
14. Admin can manually re-notify professionals on any flagged request
15. Admin enters location (address or video link) at pairing time; included in all confirmation emails
16. Client sees minimum 3 matched slots when confirming
17. Client confirmation email does not include professional names
18. Client can cancel via "No longer interested" on confirmation page — silently cancels, admin notified only, no email to professionals
19. If client does not confirm within 3 business days: slots within next 3 business days removed, magic link switches to editing view, client emailed to adjust
20. Business day calculation must exclude weekends (Saturday and Sunday)
21. Email templates are editable by Super Admin via dashboard — content stored in database, not hardcoded
22. Super Admin is the only role that can invite or manage admin accounts
23. Admin dashboard shows only active requests — no historical view of completed or cancelled meetings
24. Professional CSV import requires name + email; pool membership and roles are assigned manually after import
25. Platform timezone is configurable by Super Admin; default is US/Eastern

---

## Professional Roster Management (Admin)

- **CSV upload:** columns = name, email; pool membership and roles are assigned manually after import
- **Manual entry:** name + email form for one-off additions
- **Pool assignment:** per meeting type, the admin chooses which professionals are in the pool and which roles each can fill; editable at any time
- **Remove professional:** admin can deactivate or remove a professional from the roster

---

## Email Templates (Super Admin)

All system emails are driven by Super Admin-editable templates stored in the database. Templates include:

| Template | Recipient | Trigger |
|---|---|---|
| New request — professional notification | Matching professionals | Client submits request |
| Request filled | Non-selected professionals | Admin locks pairing |
| Client slot selection | Client | Admin approves pairing |
| Meeting confirmation — professional | Selected professionals (every filled role) | Client confirms |
| Meeting confirmation — client | Client | Client confirms |
| Request flagged | Admin | Threshold not met |
| Client non-confirmation reminder | Client | 3-business-day rule triggered |
| Request cancelled | Admin | Client clicks "No longer interested" |

---

## Request Statuses

| Status | Meaning |
|---|---|
| Pending | Submitted; professionals notified; awaiting responses |
| Flagged | Threshold not met; admin intervention needed |
| Ready for pairing | Threshold met; awaiting admin approval |
| Paired | Admin approved; client notified via magic link |
| Awaiting confirmation | Client received magic link; has not yet confirmed |
| Confirmed | Client selected a slot; meeting booked |
| Completed | Meeting has occurred |
| Cancelled | Client clicked "No longer interested"; admin notified silently |