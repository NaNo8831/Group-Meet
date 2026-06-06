# Group Meet Data Model

## Overview

Group Meet's future data model is centered on a client-submitted `requests` record, its proposed `slots`, and the professional availability needed for an admin to lock a final Lead/Support `pairing`. Clients and professionals do not have login accounts; they access request-specific pages through `magic_links`. Admins are the only login-backed users, with Super Admin permissions controlling admin management, email templates, and platform settings. This document describes the intended domain schema only; existing Sprint 001 tables are treated as legacy and are not used as design anchors here.

## Entities Table

| Entity | Purpose | Primary key type |
|---|---|---|
| `requests` | Stores each client-submitted meeting request and its workflow status. | UUID |
| `slots` | Stores client-proposed start times for a request. | UUID |
| `professionals` | Stores the admin-managed professional roster. | UUID |
| `professional_responses` | Stores a professional's role preference and selected available slots for a request. | UUID |
| `pairings` | Stores the admin-approved Lead/Support assignment, matched slots, location, and lock state. | UUID |
| `admins` | Stores login-backed admin users and role level. | UUID |
| `magic_links` | Stores tokenized access links for clients and professionals. | UUID |
| `email_templates` | Stores Super Admin-editable transactional email templates. | UUID |
| `platform_settings` | Stores platform-wide configuration such as business timezone. | Text key |

## Entity Definitions

### `requests`

**Purpose** — Represents a client-submitted meeting request from intake through completion or cancellation.

| Field | Type | Nullable | Notes |
|---|---|---:|---|
| `id` | uuid | No | Primary key. |
| `client_name` | text | No | Client's submitted name. |
| `client_email` | text | No | Client's submitted email address. |
| `meeting_type` | meeting_type | No | Determines duration and professional tier eligibility. |
| `status` | request_status | No | Defaults to `pending` for newly submitted requests. |
| `business_timezone` | text | No | Timezone used for all slots on this request; copied from platform setting at request creation. |
| `client_magic_link_sent_at` | timestamptz | Yes | Set when admin approval sends the client confirmation link. |
| `confirmed_slot_id` | uuid | Yes | References the slot selected by the client after pairing approval. |
| `confirmed_at` | timestamptz | Yes | Set when client confirms a final slot. |
| `cancelled_at` | timestamptz | Yes | Set when client clicks "No longer interested." |
| `completed_at` | timestamptz | Yes | Set when the meeting has occurred. |
| `created_at` | timestamptz | No | Creation timestamp. |
| `updated_at` | timestamptz | No | Last update timestamp. |

**Relationships**

| Relationship | Notes |
|---|---|
| Has many `slots` | Client-proposed times for this request. |
| Has many `professional_responses` | One response per professional per request. |
| Has one current `pairings` record | The admin-approved pairing for this request. |
| Has many `magic_links` | Client and professional links associated with this request. |
| `confirmed_slot_id` belongs to `slots` | Final client-selected slot. |

**Notes**

- `status` must follow the explicit workflow from Decision 029.
- `business_timezone` should preserve the timezone used when the request was created, even if the platform default changes later.
- Client identity is name and email only; there is no client account table.
- Duration is derived from `meeting_type`, not stored as user-entered input.

### `slots`

**Purpose** — Represents a specific client-proposed start time for a request in the request's business timezone.

| Field | Type | Nullable | Notes |
|---|---|---:|---|
| `id` | uuid | No | Primary key. |
| `request_id` | uuid | No | References `requests.id`. |
| `starts_at` | timestamptz | No | Proposed start time stored according to the platform business timezone convention. |
| `is_active` | boolean | No | Allows near-term slots to be pruned by the 3-business-day rule without deleting history. |
| `pruned_at` | timestamptz | Yes | Set when removed from client/professional selection by the non-confirmation rule. |
| `created_at` | timestamptz | No | Creation timestamp. |
| `updated_at` | timestamptz | No | Last update timestamp. |

**Relationships**

| Relationship | Notes |
|---|---|
| Belongs to `requests` | Each slot is proposed for one request. |
| Referenced by `professional_responses.selected_slot_ids` | Professionals select available slots. |
| Referenced by `pairings.matched_slot_ids` | Admin-approved pairing presents matched slots to the client. |
| May be referenced by `requests.confirmed_slot_id` | Final confirmed client choice. |

**Notes**

- End time is not user-entered; it is derived from `starts_at` plus the duration implied by request `meeting_type`.
- There is no slot count cap in the future domain model; date horizon validation is a separate application rule.
- Active slots should be indexed by `request_id` and `starts_at` for dashboard and matching views.

### `professionals`

**Purpose** — Stores the admin-managed roster of professionals eligible to respond to meeting requests.

| Field | Type | Nullable | Notes |
|---|---|---:|---|
| `id` | uuid | No | Primary key. |
| `name` | text | No | Professional display name. |
| `email` | text | No | Unique professional email address. |
| `tier` | professional_tier | No | Defaults to `general` after CSV import unless changed by admin. |
| `is_active` | boolean | No | Inactive professionals should not receive new request notifications. |
| `created_at` | timestamptz | No | Creation timestamp. |
| `updated_at` | timestamptz | No | Last update timestamp. |

**Relationships**

| Relationship | Notes |
|---|---|
| Has many `professional_responses` | One per request where the professional responds. |
| Has many `magic_links` | Request-specific links sent to the professional. |
| May be `pairings.lead_professional_id` | Assigned final Lead by admin. |
| May be `pairings.support_professional_id` | Assigned final Support by admin. |

**Notes**

- Professionals do not have login accounts and do not self-register.
- `tier` determines meeting type eligibility: `in_depth` qualifies for all requests; `general` qualifies for short-form requests only.
- Email should be unique among active roster records unless a future migration strategy explicitly supports historical duplicates.

### `professional_responses`

**Purpose** — Stores a professional's submitted availability and role preference for one request.

| Field | Type | Nullable | Notes |
|---|---|---:|---|
| `id` | uuid | No | Primary key. |
| `request_id` | uuid | No | References `requests.id`. |
| `professional_id` | uuid | No | References `professionals.id`. |
| `role_preference` | role_preference | No | Professional's preference: Lead, Support, or Either. |
| `selected_slot_ids` | uuid array | No | Slot IDs the professional marked available. Empty selections should not create a submitted response. |
| `submitted_at` | timestamptz | No | Timestamp of first submitted response. |
| `updated_at` | timestamptz | No | Timestamp of latest response edit. |

**Relationships**

| Relationship | Notes |
|---|---|
| Belongs to `requests` | Response is scoped to one request. |
| Belongs to `professionals` | Response is submitted by one professional. |
| References many `slots` | `selected_slot_ids` must reference slots for the same request. |

**Notes**

- Unique business rule: one response per `professional_id` and `request_id`.
- Responses remain editable until the request has a locked pairing.
- Leaving all slots blank equals no response; no explicit decline state is needed.
- Matching logic must account for professional tier eligibility and role preference visibility, while admin makes the final role assignment.

### `pairings`

**Purpose** — Stores the admin-selected Lead/Support assignment and matched slots offered to the client.

| Field | Type | Nullable | Notes |
|---|---|---:|---|
| `id` | uuid | No | Primary key. |
| `request_id` | uuid | No | References `requests.id`. |
| `lead_professional_id` | uuid | No | References `professionals.id`. |
| `support_professional_id` | uuid | No | References `professionals.id`. |
| `matched_slot_ids` | uuid array | No | Slots where the selected Lead and Support can both attend; client must see at least 3. |
| `location` | text | No | Admin-entered address or video link. |
| `is_locked` | boolean | No | True once admin approves the pairing and professional responses freeze. |
| `locked_at` | timestamptz | Yes | Set when admin approves the pairing. |
| `approved_by_admin_id` | uuid | No | References `admins.id`. |
| `created_at` | timestamptz | No | Creation timestamp. |
| `updated_at` | timestamptz | No | Last update timestamp. |

**Relationships**

| Relationship | Notes |
|---|---|
| Belongs to `requests` | One approved pairing belongs to one request. |
| Belongs to `professionals` as Lead | `lead_professional_id`. |
| Belongs to `professionals` as Support | `support_professional_id`. |
| Belongs to `admins` | Admin who approved the pairing. |
| References many `slots` | Client-confirmable matched slots. |

**Notes**

- Every meeting requires exactly one Lead and one Support.
- Lead and Support must be different professionals.
- `matched_slot_ids` should include at least 3 slots when the client confirmation link is sent.
- The pairing locks professional responses for the request.
- Location is captured at pairing time and included in confirmation emails.

### `admins`

**Purpose** — Stores login-backed admin users and their permission role.

| Field | Type | Nullable | Notes |
|---|---|---:|---|
| `id` | uuid | No | Primary key; may align with the auth provider user ID. |
| `email` | text | No | Unique admin email address. |
| `name` | text | Yes | Admin display name. |
| `role` | admin_role | No | Either `admin` or `super_admin`. |
| `invited_by_admin_id` | uuid | Yes | References `admins.id`; Super Admin invite source. |
| `invited_at` | timestamptz | Yes | Timestamp of invite. |
| `accepted_at` | timestamptz | Yes | Timestamp admin accepted invite or first logged in. |
| `is_active` | boolean | No | Inactive admins cannot manage requests. |
| `created_at` | timestamptz | No | Creation timestamp. |
| `updated_at` | timestamptz | No | Last update timestamp. |

**Relationships**

| Relationship | Notes |
|---|---|
| Has many approved `pairings` | Through `pairings.approved_by_admin_id`. |
| May invite many `admins` | Through `invited_by_admin_id`. |

**Notes**

- Admins are invite-only.
- Super Admin is required for admin account management, email template editing, and platform settings.
- Public client and professional access does not use this table.

### `magic_links`

**Purpose** — Stores tokenized request-specific access for clients and professionals.

| Field | Type | Nullable | Notes |
|---|---|---:|---|
| `id` | uuid | No | Primary key. |
| `token_hash` | text | No | Hashed token value; raw token should not be stored. |
| `entity_type` | magic_link_entity_type | No | Identifies whether the link is for a client request or professional response. |
| `request_id` | uuid | No | References `requests.id`. |
| `professional_id` | uuid | Yes | References `professionals.id` for professional links only. |
| `purpose` | magic_link_purpose | No | Intended page/action for the link. |
| `expires_at` | timestamptz | Yes | Nullable if the domain keeps links open until lock/cancel. |
| `last_used_at` | timestamptz | Yes | Last successful use timestamp. |
| `revoked_at` | timestamptz | Yes | Set when the link is intentionally invalidated. |
| `created_at` | timestamptz | No | Creation timestamp. |

**Relationships**

| Relationship | Notes |
|---|---|
| Belongs to `requests` | Every link is request-specific. |
| May belong to `professionals` | Required for professional response links. |

**Notes**

- Client links are associated with the request and client email, not a client account.
- Professional links are request-specific and should remain writable until the pairing is locked.
- Expiry behavior is unresolved by the domain except where applicable; see Open Questions.

### `email_templates`

**Purpose** — Stores Super Admin-editable transactional email content.

| Field | Type | Nullable | Notes |
|---|---|---:|---|
| `id` | uuid | No | Primary key. |
| `template_key` | email_template_key | No | Unique identifier for the system email. |
| `recipient_type` | email_recipient_type | No | Intended recipient category. |
| `subject` | text | No | Email subject template. |
| `body` | text | No | Email body template. |
| `is_active` | boolean | No | Allows draft/replacement handling without deleting old records. |
| `updated_by_admin_id` | uuid | Yes | References `admins.id`; should be Super Admin for edits. |
| `created_at` | timestamptz | No | Creation timestamp. |
| `updated_at` | timestamptz | No | Last update timestamp. |

**Relationships**

| Relationship | Notes |
|---|---|
| May belong to `admins` as updater | Tracks the admin who last changed the template. |

**Notes**

- Email content must be read from database templates rather than hardcoded application strings.
- `template_key` should be unique among active templates.
- Required templates are listed in the Enum Definitions section.

### `platform_settings`

**Purpose** — Stores platform-wide configuration controlled by Super Admin.

| Field | Type | Nullable | Notes |
|---|---|---:|---|
| `key` | text | No | Primary key; for example `business_timezone`. |
| `value` | text | No | Setting value. |
| `description` | text | Yes | Operator-facing explanation of the setting. |
| `updated_by_admin_id` | uuid | Yes | References `admins.id`; should be Super Admin for restricted settings. |
| `created_at` | timestamptz | No | Creation timestamp. |
| `updated_at` | timestamptz | No | Last update timestamp. |

**Relationships**

| Relationship | Notes |
|---|---|
| May belong to `admins` as updater | Tracks the admin who last changed the setting. |

**Notes**

- Minimum required setting: `business_timezone`.
- Default business timezone is `US/Eastern`.
- Request creation should copy the current business timezone into `requests.business_timezone`.

## Enum Definitions

### `request_status`

| Value | Meaning |
|---|---|
| `pending` | Submitted; professionals notified; awaiting responses. |
| `flagged` | Threshold not met; admin intervention needed. |
| `ready_for_pairing` | Threshold met; awaiting admin approval. |
| `paired` | Admin approved a pairing and locked professional responses. |
| `awaiting_confirmation` | Client has received the magic link and has not confirmed or cancelled. |
| `confirmed` | Client selected a slot; meeting is booked. |
| `completed` | Meeting has occurred. |
| `cancelled` | Client clicked "No longer interested"; admin notified silently. |

### `meeting_type`

| Value | Duration | Eligibility |
|---|---:|---|
| `in_depth` | 75 minutes | Lead and Support must both be In-depth professionals. |
| `short_form` | 45 minutes | Any qualifying In-depth or General professional may fill either role. |

### `professional_tier`

| Value | Meaning |
|---|---|
| `in_depth` | Can serve as Lead or Support on In-depth and Short-form meetings. |
| `general` | Can serve as Lead or Support on Short-form meetings only. |

### `professional_role`

| Value | Meaning |
|---|---|
| `lead` | Final primary role assigned by admin. |
| `support` | Final secondary role assigned by admin. |

### `role_preference`

| Value | Meaning |
|---|---|
| `lead` | Professional prefers Lead. |
| `support` | Professional prefers Support. |
| `either` | Professional is open to either role. |

### `admin_role`

| Value | Meaning |
|---|---|
| `admin` | Can manage roster and active request workflow. |
| `super_admin` | Can do everything Admin can do, plus manage admins, email templates, and platform settings. |

### `magic_link_entity_type`

| Value | Meaning |
|---|---|
| `client` | Link grants access to the client request/confirmation flow. |
| `professional` | Link grants access to a professional response flow. |

### `magic_link_purpose`

| Value | Meaning |
|---|---|
| `professional_response` | Professional selects or edits availability. |
| `client_confirmation` | Client selects a final matched slot or cancels. |
| `client_edit_request` | Client adjusts proposed slots after the 3-business-day non-confirmation rule. |

### `email_template_key`

| Value | Recipient | Trigger |
|---|---|---|
| `new_request_professional_notification` | Matching professionals | Client submits request. |
| `request_filled` | Non-selected professionals | Admin locks pairing. |
| `client_slot_selection` | Client | Admin approves pairing. |
| `meeting_confirmation_professional` | Selected Lead and Support | Client confirms. |
| `meeting_confirmation_client` | Client | Client confirms. |
| `request_flagged` | Admin | Threshold not met. |
| `client_non_confirmation_reminder` | Client | 3-business-day rule triggered. |
| `request_cancelled` | Admin | Client clicks "No longer interested." |

### `email_recipient_type`

| Value | Meaning |
|---|---|
| `client` | Client recipient. |
| `professional` | Professional recipient. |
| `admin` | Admin or Super Admin recipient. |

## Relationships Diagram

- `requests` has many `slots`.
- `requests` has many `professional_responses`.
- `requests` has many `magic_links`.
- `requests` has one locked `pairings` record for the approved Lead/Support assignment.
- `requests.confirmed_slot_id` references the final client-selected `slots.id`.
- `slots` belong to `requests`.
- `professionals` have many `professional_responses`.
- `professionals` have many professional `magic_links`.
- `professionals` can appear as `pairings.lead_professional_id`.
- `professionals` can appear as `pairings.support_professional_id`.
- `professional_responses` belong to one `requests` record and one `professionals` record.
- `professional_responses.selected_slot_ids` references `slots` for the same request.
- `pairings` belongs to one `requests` record.
- `pairings.matched_slot_ids` references `slots` for the same request.
- `pairings.approved_by_admin_id` references `admins.id`.
- `admins` can approve many `pairings`.
- `admins` can invite other `admins`.
- `email_templates.updated_by_admin_id` references `admins.id`.
- `platform_settings.updated_by_admin_id` references `admins.id`.

## Open Questions

1. Legacy Sprint 001 tables exist: `team_members`, `meetings`, `time_slots`, and `responses`. Migration is required, but the strategy is intentionally deferred to a future sprint. The future decision must choose whether to rename, transform, replace, or archive these tables.
2. Should `professional_responses.selected_slot_ids` remain an array field, or should a future migration normalize selected slots into a separate join entity? This document uses an array for planning clarity, but reporting and RLS behavior may favor a join table.
3. Should `pairings.matched_slot_ids` remain an array field, or should client-offered matched slots be normalized into a separate entity? A join table may better support slot-level expiration and audit history.
4. Should magic links expire by default, or remain valid until request cancellation/completion or pairing lock? The domain only specifies expiry "if applicable."
5. Should `paired` and `awaiting_confirmation` both be used as persisted statuses, or should one status represent admin-approved/client-waiting state? Decision 029 lists both, but the transition boundary needs operator confirmation.
6. Should email template edits preserve version history, or is one active template per key sufficient for the first migration?
7. Should removed professionals be hard-deleted or retained with `is_active = false` for historical pairings and responses?
8. Should completed requests be marked by a scheduled job based on confirmed slot time, or only by manual/admin action?
9. Should `requests.business_timezone` store the IANA value `America/New_York` while displaying "US/Eastern", or store the label exactly as `US/Eastern`? The domain names the default as US/Eastern, but implementation may need an IANA timezone.
