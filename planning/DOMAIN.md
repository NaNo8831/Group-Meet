# Domain Context
**Project:** Group Meet  
**Last updated:** 6-6-2026

---

## Business Goal

Enable clients to request a meeting with a matched pair of professionals. The system coordinates availability across all qualified professionals, routes admin approval, and delivers a confirmed meeting to both the client and the assigned professionals — with no login required for either clients or professionals.

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
- Receives a magic-link email when a new request matches their tier
- Reviews the client's proposed slots and selects which they can attend
- Indicates role preference (Lead / Support / Either)
- Can return to their magic link and update availability until admin locks the pairing
- The magic link page must clearly communicate it remains editable until locked
- Receives a "this request has been filled" email if not selected
- Receives a confirmation email with date, time, location, meeting type, and client name if selected
- Declining entirely is not supported — leaving all slots blank is equivalent to not responding

### Admin
- Login-protected dashboard, invite-only, invited by Super Admin
- Manages professional roster (CSV upload, manual entry, tier assignment, removal)
- Monitors all active requests across all statuses (no historical view of completed/cancelled)
- Receives notification when a request is ready for pairing review
- Receives notification when a request is flagged and can manually re-notify professionals
- Receives silent notification when a client cancels via "No longer interested"
- Selects final Lead/Support pairing from available professional responses
- Enters meeting location (physical address or video link) during pairing approval
- Approves pairing and triggers client magic link
- Cannot edit email templates (Super Admin only)

### Super Admin
- Separate role with elevated permissions above Admin
- Can do everything Admin can do
- Can invite and manage admin accounts
- Can edit email templates via the dashboard (templates stored in database, not hardcoded)
- Can configure platform-wide settings including the business timezone (default: US/Eastern)

---

## Meeting Types

| Type | Duration | Lead Requirement | Support Requirement |
|---|---|---|---|
| In-depth | 75 min | In-depth professional | In-depth professional |
| Short-form | 45 min | In-depth OR General | In-depth OR General |

### Tier coverage rules
- **In-depth professionals** can fill Lead or Support on any meeting type
- **General professionals** can only fill roles on Short-form meetings
- Every meeting requires exactly one Lead and one Support
- Short-form requires at least one Lead; Support can be any qualifying tier

---

## Professional Tiers

| Tier | Can Lead | Can Support | Meeting Types |
|---|---|---|---|
| In-depth | Yes | Yes | In-depth + Short-form |
| General | Yes | Yes | Short-form only |

Tier is set by admin and can be changed at any time on the professional management page.

---

## Timezone

All slots are stored and displayed in the configured business timezone. Default is **US/Eastern**. Super Admin can change the platform timezone in settings. There is no per-user or per-client timezone conversion.

---

## Core Workflow

### 1. Client submits request
- Public form: name, email, meeting type (In-depth or Short-form)
- Duration is implicit from meeting type (75 min or 45 min) — client does not set it
- Client proposes available dates and times using the date/time picker
- All times are in the platform business timezone

### 2. Professionals are notified
- All professionals whose tier qualifies them for the requested meeting type receive a magic-link email
- Magic link opens a response page showing the client's proposed slots in the business timezone
- Professional selects available slots and indicates role preference (Lead / Support / Either)
- Professional can return to the same link and update response until admin locks the pairing
- Page clearly communicates the editable-until-locked status
- Leaving all slots blank is treated as no response (no explicit decline option)

### 3. System monitors response threshold
- Threshold: **at least 4 professionals have responded** AND **at least 3 slots have both a qualified Lead and Support available**
- No deadline — threshold is open-ended
- If threshold is not met: flag the request and notify admin to intervene
- Admin can manually re-notify all professionals on a flagged request

### 4. Admin reviews and approves pairing
- Admin notified when threshold is met
- Admin dashboard shows: client details, meeting type, all professional responses, matched slots
- Admin selects Lead and Support professional
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
- Confirmed Lead professional: date, time, location, meeting type, client name
- Confirmed Support professional: same
- Client: date, time, location, meeting type (no professional names)
- Professionals not selected: "This request has been filled"

---

## Key Terms

| Term | Meaning |
|---|---|
| Request | A client-submitted meeting request with proposed slots |
| Slot | A specific date + start time proposed by the client |
| In-depth meeting | 75-min meeting; requires In-depth tier for both roles |
| Short-form meeting | 45-min meeting; any qualifying tier for either role |
| Lead | Primary professional role in a meeting |
| Support | Secondary professional role in a meeting |
| Pairing | Admin-selected Lead + Support combination for a request |
| Matched slot | A slot where both a qualified Lead and Support have indicated availability |
| Magic link | A unique tokenized URL giving a user access to their specific page without a password |
| Response threshold | 4+ professional responses AND 3+ matched slots — triggers admin pairing review |
| Locked | Admin has approved a pairing; professional responses can no longer be updated |
| Flagged | Threshold not met; admin intervention required |
| Business timezone | Platform-wide timezone used for all slot storage and display; default US/Eastern; configurable by Super Admin |
| 3-business-day rule | If client doesn't confirm within 3 business days of pairing: near-term slots pruned, magic link switches to editing view |
| No longer interested | Client-facing cancellation option on confirmation page; silently cancels request, notifies admin only |
| Email template | Super Admin-editable content stored in database; drives all system emails |

---

## Business Rules

1. Every meeting requires exactly one Lead and one Support professional
2. In-depth meetings: both roles must be filled by In-depth tier professionals
3. Short-form meetings: any qualifying tier can fill either role
4. In-depth professionals can fill any role on any meeting type
5. General professionals can only fill roles on Short-form meetings
6. Duration is derived from meeting type — never set by the user
7. End time is always derived as startsAt + duration — never entered manually
8. All slots are stored and displayed in the platform business timezone (default US/Eastern)
9. Admin pairing review only triggered after threshold is met (4 responses + 3 matched slots)
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
24. Professional CSV import requires name + email; tier defaults to General and is assigned manually post-import
25. Platform timezone is configurable by Super Admin; default is US/Eastern

---

## Professional Roster Management (Admin)

- **CSV upload:** columns = name, email; tier defaults to General post-import and is set manually
- **Manual entry:** name + email form for one-off additions
- **Tier assignment:** checkbox per professional (In-depth / General); editable at any time
- **Remove professional:** admin can deactivate or remove a professional from the roster

---

## Email Templates (Super Admin)

All system emails are driven by Super Admin-editable templates stored in the database. Templates include:

| Template | Recipient | Trigger |
|---|---|---|
| New request — professional notification | Matching professionals | Client submits request |
| Request filled | Non-selected professionals | Admin locks pairing |
| Client slot selection | Client | Admin approves pairing |
| Meeting confirmation — professional | Selected Lead + Support | Client confirms |
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