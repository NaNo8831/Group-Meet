# Group Meet — Architecture

## Overview

Group Meet coordinates meeting requests between an external client and a qualified pair of professionals. The core system pattern is:

```text
Client submits request
  -> Professionals provide availability
  -> Admin reviews matched availability and locks a Lead/Support pairing
  -> Client chooses one approved slot
  -> Client and selected professionals receive confirmation emails
```

The current codebase is a Sprint 001 MVP that uses older Participant / Team Member naming and automatically confirms a meeting when one Leader and one Support share a proposed time. The planned domain architecture expands that MVP into the full Client / Professional / Admin / Super Admin workflow documented in `planning/DOMAIN.md`. This document distinguishes what is built now from what is planned.

## System Components

### Public Request Form — **Built**

**What it does:** Allows an external participant/client to submit a meeting request with contact details, a topic, and proposed time slots.

**Current files:**
- `app/page.tsx`
- `lib/validation.ts`
- `app/api/meetings/route.ts`

**Current behavior:** The form collects `participantName`, `participantEmail`, `topic`, and 1-5 explicit start/end time ranges. It validates with zod and posts to `POST /api/meetings`.

**Planned domain behavior:** The form should collect client name, client email, meeting type, and proposed start times. Duration is derived from meeting type, end time is not user-entered, and there is no slot-count cap within the 28-day horizon.

### Magic Link System — **Planned**

**What it does:** Generates, stores, and validates tokenized request-specific access links for clients and professionals without requiring client or professional accounts.

**Current files or directories:** None.

**Planned files or directories:** Future API/library code under `lib/`, future route handlers under `app/`, and future database tables/migrations for `magic_links`.

**Planned behavior:** Raw tokens should not be stored. The data model in `docs/DATA_MODEL.md` expects hashed tokens, request association, optional professional association, link purpose, usage tracking, revocation, and optional expiry behavior.

### Professional Response Flow — **Partial**

**What it does:** Lets invited professionals review proposed slots and submit availability.

**Current files:**
- `app/team/meetings/[id]/page.tsx`
- `app/team/meetings/[id]/TeamVotingForm.tsx`
- `app/api/responses/route.ts`

**Current behavior:** Team members use `/team/meetings/[id]?member=[uuid]` links and select available slots. The route checks the `member` query parameter against active `team_members`.

**Planned domain behavior:** Professionals access the page through magic links, indicate role preference (Lead / Support / Either), can edit responses until admin locks a pairing, and see clear editable-until-locked messaging. There is no explicit decline flow; leaving all slots blank means no response.

### Admin Dashboard — **Planned**

**What it does:** Gives admins a login-protected workspace for active request review, professional roster management, threshold/flag monitoring, pairing approval, and manual re-notification.

**Current files or directories:** None.

**Planned behavior:** The dashboard should show active requests only, display client details, meeting type, professional responses, matched slots, and request status. Admins select the final Lead and Support, enter the meeting location, and approve the pairing.

### Super Admin Settings — **Planned**

**What it does:** Gives Super Admins elevated controls for admin invitations, admin management, email template editing, and platform settings.

**Current files or directories:** None.

**Planned behavior:** Super Admin can manage invite-only admin accounts, edit database-stored email templates, and configure platform settings such as the business timezone. Default timezone is US/Eastern.

### Request Status Machine — **Partial**

**What it does:** Tracks each request through the workflow from submission through completion or cancellation.

**Current files:**
- `lib/types.ts`
- `supabase/schema.sql`
- `app/api/responses/route.ts`

**Current behavior:** The legacy `meetings.status` supports `pending`, `confirmed`, and `cancelled`. `POST /api/responses` only confirms when current status is `pending`.

**Planned domain behavior:** Decision 029 defines the fuller status flow: `pending`, `flagged`, `ready_for_pairing`, `paired`, `awaiting_confirmation`, `confirmed`, `completed`, and `cancelled`. Transitions should be explicit and should support admin pairing and client confirmation rather than direct automatic confirmation.

### Threshold Monitoring Logic — **Partial**

**What it does:** Determines when a request has enough professional availability for admin review.

**Current files:**
- `lib/quorum.ts`
- `app/api/responses/route.ts`

**Current behavior:** `checkQuorum()` finds the earliest slot where at least one legacy Leader and one legacy Support have submitted availability. If found, the API confirms the meeting immediately.

**Planned domain behavior:** Threshold is met only when at least 4 professionals have responded and at least 3 slots have both a qualified Lead and Support available. Meeting type, professional tier, and role preference visibility must be considered before notifying admin for pairing review.

### Scheduled Jobs — **Planned**

**What it does:** Handles time-based workflow actions.

**Current files or directories:** None.

**Planned behavior:** A scheduled job must enforce the 3-business-day non-confirmation rule: if the client has not confirmed or cancelled within 3 business days after the client magic link is sent, near-term slots are pruned, the client link switches to editing mode, and the client is emailed. Another scheduled or operator-triggered process may flag stale requests where threshold has not been met, according to future implementation details.

### Email System — **Partial**

**What it does:** Sends transactional emails for request notification, pairing/confirmation workflow, cancellation, and reminders.

**Current files:**
- `lib/email.ts`
- `app/api/meetings/route.ts`
- `app/api/responses/route.ts`

**Current behavior:** Resend helper functions send hardcoded text emails for team notification, participant confirmation, and team confirmation. Email delivery failures are logged and do not roll back meeting creation or response handling.

**Planned domain behavior:** Email content must be template-driven from database records editable by Super Admin. Required templates are listed in `planning/DOMAIN.md`: new request professional notification, request filled, client slot selection, meeting confirmation for professional, meeting confirmation for client, request flagged, client non-confirmation reminder, and request cancelled.

### API Routes — **Built**

**What they do:** Provide server-side mutation points for the Sprint 001 MVP.

**Current files:**
- `app/api/meetings/route.ts`
- `app/api/responses/route.ts`

**Current behavior:**
- `POST /api/meetings` validates input, inserts a legacy `meetings` row, inserts `time_slots`, loads active `team_members`, and sends notification emails.
- `POST /api/responses` validates input, checks pending status, upserts legacy `responses`, runs quorum logic, updates confirmation fields, and sends confirmation emails.

**Planned domain behavior:** Future routes will be needed for magic link validation, professional response editing, admin pairing approval, client confirmation/cancellation, admin roster management, Super Admin settings, email template management, and scheduled-job actions.

### Database / Data Layer — **Partial**

**What it does:** Stores requests, users/actors, availability, pairings, settings, and email/template state.

**Current files:**
- `supabase/schema.sql`
- `supabase/seed.sql`
- `lib/supabase.ts`
- `lib/types.ts`

**Current behavior:** Supabase is integrated through public anon and service-role clients. The current SQL creates legacy Sprint 001 tables: `team_members`, `meetings`, `time_slots`, and `responses`, with RLS enabled and simple public/service policies.

**Planned domain behavior:** `docs/DATA_MODEL.md` defines the future domain model: `requests`, `slots`, `professionals`, `professional_responses`, `pairings`, `admins`, `magic_links`, `email_templates`, and `platform_settings`. Migration strategy from the Sprint 001 legacy tables is intentionally deferred.

### Authentication (Admin Login) — **Planned**

**What it does:** Protects admin and Super Admin routes.

**Current files or directories:** None. No middleware or admin auth provider is implemented.

**Planned behavior:** Admins are invite-only and login-backed. Super Admin is a distinct role with elevated permission checks for admin management, email templates, and platform settings. Clients and professionals should not have accounts.

## Data Flow

The full request lifecycle is planned around the 7-step workflow in `planning/DOMAIN.md`. Current implementation covers only an older subset.

### 1. Client submits request

**Current status: Partial.** The public form is built, but it uses legacy fields: participant name, participant email, topic, and user-entered start/end slot ranges with a five-slot cap.

**Planned flow:** Client submits name, email, meeting type, and proposed start times. Duration is derived from meeting type: In-depth = 75 minutes, Short-form = 45 minutes. All times use the platform business timezone.

### 2. Professionals are notified

**Current status: Partial.** `POST /api/meetings` emails all active legacy `team_members` with `/team/meetings/[id]?member=[uuid]` links.

**Planned flow:** Only professionals whose tier qualifies for the requested meeting type receive a magic-link email. They review client-proposed slots, select available slots, indicate role preference, and can edit until admin locks the pairing.

### 3. System monitors response threshold

**Current status: Partial.** The system checks for one Leader and one Support on the same slot after each response.

**Planned flow:** The system waits for at least 4 professional responses and at least 3 matched slots with both a qualified Lead and Support available. If threshold is met, admin is notified for pairing review. If threshold is not met and the request becomes stale or flagged according to future rules, admin can manually re-notify professionals.

### 4. Admin reviews and approves pairing

**Current status: Planned.** No admin dashboard or pairing approval flow exists.

**Planned flow:** Admin reviews client details, meeting type, professional responses, and matched slots. Admin selects final Lead and Support, enters a physical address or video link, approves the pairing, locks professional responses, and triggers the client magic link.

### 5. Client confirms or cancels

**Current status: Planned.** The current status page shows pending or confirmed status, but there is no post-admin client selection flow and no "No longer interested" action.

**Planned flow:** Client receives a magic link with 3+ matched slots, selects one final slot to book the meeting, or clicks "No longer interested" to silently cancel. Cancellation notifies admin only.

### 6. Client non-confirmation (3-business-day rule)

**Current status: Planned.** No scheduled job or client editing view exists.

**Planned flow:** If the client does not confirm or cancel within 3 business days of receiving the magic link, slots within the next 3 business days are pruned, the magic link switches to editing mode, the client is emailed, and the process returns to professional notification after updated dates are submitted.

### 7. Confirmation emails sent

**Current status: Partial.** Current confirmation emails are sent immediately after legacy quorum is met, and client-facing text includes selected team member names.

**Planned flow:** After the client confirms, emails go to the confirmed Lead, confirmed Support, the client, and non-selected professionals. Selected professionals receive date, time, location, meeting type, and client name. The client receives date, time, location, and meeting type, without professional names.

## Tech Stack

Actual installed dependencies from `package.json`:

| Package | Role |
|---|---|
| `next` `^16.2.7` | Next.js App Router framework for pages, layouts, and route handlers. |
| `react` `^18.3.1` | UI library used by Next.js pages and components. |
| `react-dom` `^18.3.1` | React DOM runtime used by Next.js. |
| `typescript` `^5.7.2` | Static typing for application and library code. |
| `@supabase/supabase-js` `^2.46.1` | Supabase client for public and service-role database access. |
| `resend` `^4.0.1` | Transactional email delivery. |
| `react-hook-form` `^7.53.2` | Client-side form state for the request form. |
| `@hookform/resolvers` `^3.9.1` | Integrates zod validation with react-hook-form. |
| `zod` `^3.23.8` | Runtime validation for form and API inputs. |
| `date-fns` `^4.1.0` | Date formatting for slot display. |
| `lucide-react` `^0.468.0` | Icon components used in the UI. |
| `clsx` `^2.1.1` | Conditional class-name helper. |
| `tailwind-merge` `^2.5.5` | Merges Tailwind utility classes in `lib/utils.ts`. |
| `class-variance-authority` `^0.7.1` | Installed for shadcn-style component variants; not meaningfully used yet. |
| `tailwindcss-animate` `^1.0.7` | Installed Tailwind animation plugin; not meaningfully used yet. |
| `tailwindcss` `^3.4.16` | Utility-first styling framework. |
| `postcss` `^8.4.49` | CSS processing pipeline used by Tailwind. |
| `autoprefixer` `^10.4.20` | Adds vendor prefixes during CSS processing. |
| `eslint` `^9.39.1` | Linting tool. |
| `eslint-config-next` `^16.2.7` | Next.js linting configuration. |
| `@types/node` `^20.17.9` | Node.js TypeScript types. |
| `@types/react` `^18.3.12` | React TypeScript types. |
| `@types/react-dom` `^18.3.1` | React DOM TypeScript types. |

## Directory Structure

Current project structure, with planned areas marked where they do not exist yet:

```text
.
├── app/                                    # Built: Next.js App Router routes
│   ├── api/
│   │   ├── meetings/
│   │   │   └── route.ts                    # Built: legacy meeting creation API
│   │   └── responses/
│   │       └── route.ts                    # Built: legacy availability/quorum API
│   ├── meetings/
│   │   └── [id]/
│   │       └── page.tsx                    # Built: legacy participant status page
│   ├── team/
│   │   └── meetings/
│   │       └── [id]/
│   │           ├── page.tsx                # Built: legacy team voting page
│   │           └── TeamVotingForm.tsx      # Built: legacy slot-selection form
│   ├── globals.css                         # Built: global Tailwind styles
│   ├── layout.tsx                          # Built: root layout and metadata
│   └── page.tsx                            # Built: public request form
├── lib/                                    # Built: shared Sprint 001 modules
│   ├── email.ts                            # Partial: Resend helpers, hardcoded templates
│   ├── format.ts                           # Built: slot/name formatting helpers
│   ├── quorum.ts                           # Partial: legacy quorum check
│   ├── supabase.ts                         # Built: Supabase client factories
│   ├── types.ts                            # Partial: legacy table TypeScript types
│   ├── utils.ts                            # Built: Tailwind class merge helper
│   └── validation.ts                       # Partial: legacy form/API schemas
├── src/
│   └── README.md                           # Built: notes that source currently lives in app/lib
├── supabase/
│   ├── schema.sql                          # Partial: legacy Sprint 001 schema
│   └── seed.sql                            # Partial: legacy team member seed data
├── docs/
│   ├── API.md                              # Documentation
│   ├── ARCHITECTURE.md                     # This file
│   ├── DATA_MODEL.md                       # Future domain data model
│   └── VALIDATION.md                       # Validation documentation
├── planning/                               # Architect/Builder planning source
├── public/                                 # Static assets
├── references/                             # Raw reference material
├── samples/                                # Sample project metadata/examples
├── scripts/                                # Utility scripts
├── templates/                              # Reusable templates
└── tests/                                  # Test/validation fixtures

Planned directories/routes not present yet:
├── app/admin/                              # Planned: admin dashboard and settings
├── app/professional/ or app/respond/       # Planned: magic-link professional response flow
├── app/client/ or app/requests/            # Planned: client confirmation/editing flow
├── app/api/admin/                          # Planned: admin-only APIs
├── app/api/magic-links/                    # Planned: token generation/validation APIs
├── app/api/jobs/                           # Planned: scheduled-job endpoints
└── supabase/migrations/                    # Planned: future domain migrations
```

## External Services

| Service | Status | Purpose |
|---|---|---|
| Supabase | **Integrated** | Managed Postgres data store with RLS. Current schema is Sprint 001 legacy; future schema is documented in `docs/DATA_MODEL.md`. |
| Resend | **Integrated** | Transactional email delivery. Current content is hardcoded in `lib/email.ts`; future content should use database templates. |
| Vercel | **Planned/TBD** | Hosting target named in project docs; external project/environment setup remains pending in `planning/STATE.md`. |
| Admin auth provider | **Planned/TBD** | Needed for invite-only Admin and Super Admin login. No provider or middleware is currently implemented. |

## Architecture Decisions

Durable architectural decisions live in `planning/DECISIONS.md` and should not be duplicated here. Relevant decision references include:

- Decisions 001-006: meeting duration, slot behavior, date horizon, and component location conventions.
- Decisions 007-010: no client/professional accounts, invite-only admin, and Super Admin role.
- Decisions 011-013: database email templates, response threshold, and no professional response deadline.
- Decisions 014-018: professional response semantics, editability until lock, and role preference.
- Decisions 019-023: client-facing confirmation/cancellation, 3-business-day rule, location, and minimum matched slots.
- Decisions 024-029: professional tier rules, CSV import, active-request dashboard, platform timezone, and request statuses.

## Known Gaps

- Sprint 001 legacy tables exist and are not the future domain model: `team_members`, `meetings`, `time_slots`, and `responses`. Migration strategy is intentionally deferred and must not design around these tables as the long-term model.
- Current public request form does not match the future domain form: it collects topic, user-entered end times, and at most five slots; it does not collect meeting type or derive duration.
- Current system has no magic link storage, hashed tokens, validation, revocation, or purpose-specific client/professional links.
- Current professional response flow is a legacy team voting page with a `member` query parameter, not a magic-link-gated professional flow.
- Current response logic confirms automatically after one Leader and one Support share a slot; the domain requires 4+ professional responses, 3+ matched slots, admin review, and client final confirmation.
- Current status machine only supports `pending`, `confirmed`, and `cancelled`, not the full domain workflow.
- Current email content is hardcoded and does not use Super Admin-editable database templates.
- Current client-facing confirmation/status can expose team member names, while the domain says client confirmation email should omit professional names.
- No admin dashboard exists.
- No Super Admin settings exist.
- No admin authentication provider, invite flow, middleware, or authorization layer exists.
- No professional roster management UI or CSV import exists.
- No scheduled jobs exist for the 3-business-day non-confirmation rule or stale/flagged request handling.
- No platform settings table or business-timezone configuration exists.
- No admin pairing record, lock state, meeting location capture, or pairings table exists.
- No request cancellation flow exists for "No longer interested."
- No request-filled emails for non-selected professionals exist.
