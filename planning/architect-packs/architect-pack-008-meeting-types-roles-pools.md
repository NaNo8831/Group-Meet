============================================================
FILE: planning/sprints/008-meeting-types-roles-pools/requirements.md
============================================================

# Sprint 008 - Meeting Types, Roles, and Pools: Requirements

**Guarded:** yes. This sprint changes the live database (a migration the operator applies), changes who can read personal data (professionals' names and emails), and adds permission-checked admin routes.

## Why

Every later sprint reads from the meeting type: the client link, the professional notifications, the threshold, and the pairing. Today meeting types are two hard-coded values and professionals carry a single tier. The operator wants a workspace where an admin or Super Admin creates a meeting type with a title and landing page, named durations (for example Short 30, Normal 45, Long 60), roles with required counts, and a pool of professionals who can fill each role. This sprint builds that workspace and its tables, seeds today's two types so nothing is lost, and tightens a data access rule on the professionals table.

## Scope

**Stage A (database and API, ends at an operator checkpoint)**

1. A read-only preflight SQL file the operator runs first, to confirm the live schema.
2. One migration, applied by the operator, that creates the new tables, seeds the two existing types and their pools, adds nullable links on `requests`, and locks the new tables and `professionals` to the server only.
3. A rollback SQL file and a post-check SQL file for the operator.
4. Admin API routes for meeting types, durations, roles, and pool entries.
5. The roster API and types stop reading or writing tier.

**Stage B (admin screens, after the operator confirms Stage A)**

6. Admin navigation links, a meeting type list, a create page, and an editor page (details, thresholds, durations, roles, pool).
7. The roster page loses its tier controls.
8. Documentation and close-out.

## Behavior rules

- Meeting types, durations, roles, and pool entries are managed by any active Admin or Super Admin (Decision 052).
- A new meeting type starts inactive. Activating it requires at least one duration and at least one role. If a role has fewer active pool professionals than its required count, the editor shows a warning but does not block activation.
- The slug is generated from the title (lowercase letters, digits, hyphens), is editable, and is unique. The planned public link is `/meet/<slug>`; the page itself is built in Sprint 009.
- Role names are free text (Lead and Support are suggested defaults). Each role has a required count of 1 or more.
- Duration labels are free text; minutes are whole numbers from 5 to 480 in steps of 5.
- The landing description is plain text (no HTML).
- Minimum matched slots defaults to 3. Minimum responses is optional and has no default (Q-008 resolved).
- A pool entry is one professional in one meeting type plus the set of that type's roles they can fill. A role must belong to the same meeting type as the pool entry.
- The seeded pools reproduce today's behavior: the In-depth pool holds the professionals whose tier is in_depth; the Short-form pool holds all professionals. Each seeded pool entry can fill both Lead and Support.
- Professionals are never hard-deleted (Decision 031). Deactivating one leaves their pool entries in place; later sprints skip inactive professionals when notifying.
- The old `meeting_type` column on `requests` stays but is no longer required, so Sprint 009 can write requests with the new link fields. `professionals.tier` stays in the database (rollback safety) but is no longer shown or written by the app.

## Decisions to record (the Builder writes them as rows in `planning/DECISIONS.md`, dated 2026-11-12)

| # | Decision | Why | Implication |
|---|---|---|---|
| 057 | Minimum responses per meeting type is optional with no default. Default readiness is every required role coverable in at least `min_matched_slots` (default 3) slots. | Resolves Q-008. A fixed minimum could block requests in a small beta. | `meeting_types.min_responses` is nullable. Sprint 012 treats null as no minimum. |
| 058 | The tier toggle is removed from the roster page and roster API in Sprint 008. The `professionals.tier` column stays until Sprint 014. | Pools replace tiers (Decision 050). Keeping the column makes the migration reversible. | Roster routes and components no longer read or write tier. Sprint 014 drops the column. |
| 059 | Role names and duration labels are free text. The slug is generated from the title and is editable and unique. New meeting types start inactive. Activation requires at least one duration and one role. Pool coverage shortfalls warn but do not block. | Keeps setup flexible without letting a broken type go public. | Validation lives in the admin API and in `lib/meeting-types.ts`. |
| 060 | The public link for a meeting type is `/meet/<slug>`. The home page `/` becomes the list of active meeting types in Sprint 009. | Fixes the path so Sprint 009 and the editor agree. | No public route is added in Sprint 008. |
| 061 | New domain tables are readable and writable by the server only (service role). Public pages read them through server code, never directly from the browser with the public key. | Protects personal data and keeps one access path. | New tables ship with a single service_role policy. |
| 062 | The seeded pools are derived from tier: In-depth pool = in_depth professionals; Short-form pool = all professionals; each entry can fill Lead and Support. | Preserves today's behavior (former Decisions 024, 025). | Admins reshape pools afterwards in the editor. |

## Risks and questions to record

- **R-013 (new):** the Sprint 005 migration created a `professionals` policy that allows all roles, not just the server. If it exists in the live database, anyone holding the public key could read or edit professionals' names and emails. Likelihood unknown until the preflight runs; impact high (personal data). Mitigation: this sprint's migration removes it and leaves only a service-role policy; the post-check proves it. After the operator confirms, the Builder rewrites R-013 with the actual finding.
- **R-014 (new):** the migration is applied by hand in the Supabase SQL editor and there is no local database to test it against. Mitigation: preflight, transaction-wrapped idempotent migration, post-check, rollback file.
- **Q-008:** mark resolved by Decision 057.
- **Q-006:** update with the preflight findings (which migrations are present).

## Plan corrections applied (from the Sprint 007 briefing)

This blueprint names every table each route and page reads or writes, names the migration, and says the operator applies it.

## Out of scope

- No public pages and no change to the client request form (Sprint 009).
- No email, no magic links, no professional response page (Sprints 010 and 011).
- No change to the legacy meetings flow, `lib/quorum.ts`, `lib/email.ts`, or the date/time picker.
- No Super Admin-only screens, templates, or settings (Sprint 015).
- No new npm dependencies and no test framework.
- Dropping `professionals.tier` (Sprint 014).

## Success

An Admin signs in, creates a meeting type, adds named durations and roles, assigns professionals to the pool with the roles they can fill, and activates it. The two original types exist with the right pools. Professionals' contact details can no longer be reached with the public key.

============================================================
FILE: planning/sprints/008-meeting-types-roles-pools/blueprint.md
============================================================

# Sprint 008 - Meeting Types, Roles, and Pools: Blueprint

Guarded. Two operator-gated stages. Commit locally per stage on branch `sprint-008-meeting-types` created from `main`. Do not push.

## Verified at planning time (2026-11-12, read-only)

- `main` is at `b68b86ed` (Sprint 007 merged). Working tree clean except the auto-generated `next-env.d.ts`.
- Stack: Next.js 16.2.x, React 18, `@supabase/supabase-js`, `@supabase/ssr`, `zod`, `react-hook-form`, Tailwind. There is no `components/ui` folder; admin screens use plain Tailwind classes (see `src/components/ProfessionalRoster/`).
- Admin routes call `getAuthenticatedAdminFromRequest(request)` from `lib/auth.ts` and use `createServiceSupabaseClient()` from `lib/supabase.ts`. `proxy.ts` protects `/admin/*` and `/api/admin/*`. The admin layout (`app/admin/(protected)/layout.tsx`) redirects when no active admin is found. Any active Admin or Super Admin passes these helpers.
- Tier is used only in: `app/api/admin/professionals/route.ts`, `app/api/admin/professionals/[id]/route.ts`, `app/api/admin/professionals/import/route.ts`, `src/components/ProfessionalRoster/types.ts`, `ProfessionalTable.tsx`, `AddProfessionalForm.tsx`.
- Two SQL files can have created `professionals`: `supabase/migrations/005_professionals.sql` (tier as an enum type, plus a policy named `service all` using `true` for all roles) and `supabase/Phase 1 Domain Schema for Request & Pairings.sql` (tier as text with a check). Whichever ran first decides the live column type. `supabase/Enable servis_role row security policies.sql` adds `auth.role() = 'service_role'` policies on the Phase 1 tables.
- `requests` (Phase 1 SQL) has `meeting_type text NOT NULL CHECK (in_depth, short_form)`, a `status` check, and no link to the new tables. It is not written by any code yet.
- Unknown until the operator runs the preflight: which of these SQL files actually ran, the live `tier` type and default, existing policies, and row counts.

## Tables used (every route and page)

| Route or page | Reads | Writes |
|---|---|---|
| `GET/POST /api/admin/meeting-types` | `meeting_types`, `meeting_type_durations`, `meeting_type_roles`, `meeting_type_pool` (counts) | `meeting_types` |
| `GET/PATCH /api/admin/meeting-types/[id]` | all four above, `meeting_type_pool_roles`, `professionals` (names for the pool) | `meeting_types` |
| `.../durations` and `.../durations/[durationId]` | `meeting_type_durations` | `meeting_type_durations` |
| `.../roles` and `.../roles/[roleId]` | `meeting_type_roles` | `meeting_type_roles` (and cascades `meeting_type_pool_roles`) |
| `PUT/DELETE .../pool/[professionalId]` | `professionals`, `meeting_type_roles` | `meeting_type_pool`, `meeting_type_pool_roles` |
| roster routes | `professionals` | `professionals` (no tier) |
| list, create, editor pages | via the routes above only | via the routes above only |

No admin page or route in this sprint reads or writes `meetings`, `time_slots`, `team_members`, or `responses`.

## Stage A - database and API

### A1. Preflight SQL (`supabase/preflight/008_preflight.sql`)

Read-only: only `select` statements, no DDL or DML. It must report, as labeled result sets:

1. Which tables exist among: `professionals`, `requests`, `slots`, `admins`, `meeting_types`, `meeting_type_durations`, `meeting_type_roles`, `meeting_type_pool`, `meeting_type_pool_roles`.
2. `professionals.tier`: data type, default, and the check constraints on the table.
3. All policies from `pg_policies` for `professionals`, `requests`, and `admins` (name, roles, command, qual, with_check).
4. Row counts: `professionals` total, active, by tier; `requests`; `admins` by role.
5. Columns of `requests`.

If the preflight shows `requests` or `admins` missing, the Builder must stop and report; do not invent a table-creation path (that is a separate decision).

### A2. Migration (`supabase/migrations/008_meeting_types.sql`)

Wrapped in a single transaction (`begin` ... `commit`). Idempotent: safe to run twice, no duplicate rows, no error. Contains no `drop table`, `delete from`, or `truncate`. Begin with a guard that raises a clear error if `requests`, `professionals`, or `admins` does not exist.

New tables (service role only, see RLS below):

- `meeting_types`: `id uuid pk default gen_random_uuid()`, `title text not null` (length 1 to 120), `slug text not null unique` with a check for lowercase letters, digits, and single hyphens (length 3 to 60), `landing_description text` (max 2000), `is_active boolean not null default false`, `min_matched_slots integer not null default 3` (at least 1), `min_responses integer` (null or at least 1), `created_by_admin_id uuid references admins(id) on delete set null`, `created_at`, `updated_at`.
- `meeting_type_durations`: `id`, `meeting_type_id uuid not null references meeting_types(id) on delete cascade`, `label text not null` (1 to 40), `minutes integer not null` (check: between 5 and 480 and a multiple of 5), `sort_order integer not null default 0`, unique on (`meeting_type_id`, `label`).
- `meeting_type_roles`: `id`, `meeting_type_id` (cascade), `name text not null` (1 to 40), `required_count integer not null default 1` (at least 1), `sort_order integer not null default 0`, unique on (`meeting_type_id`, `name`), and unique on (`id`, `meeting_type_id`) so pool roles can enforce same-type membership.
- `meeting_type_pool`: primary key (`meeting_type_id`, `professional_id`); `meeting_type_id` references `meeting_types(id)` on delete cascade; `professional_id` references `professionals(id)` on delete cascade; `created_at`.
- `meeting_type_pool_roles`: primary key (`meeting_type_id`, `professional_id`, `role_id`); foreign key (`meeting_type_id`, `professional_id`) to `meeting_type_pool` on delete cascade; foreign key (`role_id`, `meeting_type_id`) to `meeting_type_roles(id, meeting_type_id)` on delete cascade. This makes a role from another meeting type impossible to attach.

Changes to `requests` (all additive or relaxing):

- `meeting_type_id uuid references meeting_types(id) on delete restrict` (nullable).
- `duration_id uuid references meeting_type_durations(id) on delete restrict` (nullable).
- `created_by_admin_id uuid references admins(id) on delete set null` (nullable; Decision 053).
- Drop NOT NULL on `meeting_type` (keep the column and its check).
- Backfill: if any `requests` rows exist, set `meeting_type_id` from the old value (in_depth to the In-depth type, short_form to the Short-form type) where it is null.

Seed (guarded by slug, so it runs once):

- Meeting type slug `in-depth`, title "In-depth meeting", inactive; duration label "Standard", 75 minutes; roles Lead (1) and Support (1).
- Meeting type slug `short-form`, title "Short-form meeting", inactive; duration label "Standard", 45 minutes; roles Lead (1) and Support (1).
- Pool: every professional whose `tier::text = 'in_depth'` goes into the In-depth pool; every professional (any tier) goes into the Short-form pool. Each pool entry gets both roles of its type. Use `tier::text` so the migration works whether the live column is an enum or text. Do not alter the `tier` column.

Row Level Security:

- Enable RLS on the five new tables. Each gets exactly one policy, for the `service_role` role only, for all commands.
- On `professionals`: drop the policy named `service all` if it exists, and ensure a policy for `service_role` only exists (create it if no equivalent). After the migration, no policy on `professionals` may apply to `anon`, `authenticated`, or `public`. Do not change policies on other tables in this sprint (Sprint 014 owns the legacy tables).

### A3. Rollback (`supabase/rollbacks/008_meeting_types_rollback.sql`)

Not applied unless the operator chooses. Drops the five new tables and the three new `requests` columns, and restores NOT NULL on `requests.meeting_type` only if no row has it null. It does not recreate the old open `professionals` policy, because that policy is the unsafe one; say so in a comment. Wrapped in a transaction.

### A4. Post-check (`supabase/preflight/008_postcheck.sql`)

Select-only checks the operator runs after applying, as labeled result sets: the five tables exist with RLS enabled; policies on the five tables and on `professionals` (expect service_role only); the two seeded types with their durations, roles, and pool counts; In-depth pool members versus professionals with tier in_depth (expect equal sets); Short-form pool members versus all professionals (expect equal); `requests` new columns present and nullable; a role-integrity check. The role-integrity check may use one `begin ... rollback` block that tries to attach a role from the other meeting type and expects a foreign key error; label it clearly and keep it self-contained. If that block cannot be made safe, leave it out and rely on constraint inspection instead.

### A5. Shared library (`lib/meeting-types.ts`)

Types for the five entities and the editor payload; zod schemas for create and patch of a meeting type, duration, role, and pool entry (rules from the requirements); `slugify(title)`; a `readiness(detail)` helper returning `{ hasDuration, hasRole, roleCoverage: [{ roleId, name, needed, available }] }` where `available` counts active professionals in the pool who can fill that role.

### A6. API routes (all call `getAuthenticatedAdminFromRequest`, return 401 if null, allow Admin and Super Admin, use the service client)

- `app/api/admin/meeting-types/route.ts`: `GET` lists meeting types with counts of durations, roles, and pool members. `POST` creates a type (title, optional slug, optional description), inactive, `created_by_admin_id` = the signed-in admin; if no slug is given, generate one from the title; if it collides, return 409 with a plain message (do not silently rename).
- `app/api/admin/meeting-types/[id]/route.ts`: `GET` returns the type with durations (ordered), roles (ordered), pool entries (professional name, email, is_active, role ids), and `readiness`. `PATCH` updates title, slug, landing_description, is_active, min_matched_slots, min_responses. Setting `is_active` to true returns 400 with a plain message unless the type has at least one duration and one role. Set `updated_at` on every update.
- `app/api/admin/meeting-types/[id]/durations/route.ts` (`POST`) and `.../durations/[durationId]/route.ts` (`PATCH`, `DELETE`). Deleting returns 409 ("in use") when the foreign key from `requests` blocks it. Deleting the last duration of an active type returns 400.
- `app/api/admin/meeting-types/[id]/roles/route.ts` (`POST`) and `.../roles/[roleId]/route.ts` (`PATCH`, `DELETE`). Deleting the last role of an active type returns 400. Deleting a role removes pool role links by cascade.
- `app/api/admin/meeting-types/[id]/pool/[professionalId]/route.ts`: `PUT` with body `{ roleIds: string[] }` upserts the pool entry and replaces its role links; an empty array removes the professional from the pool. Every role id must belong to this meeting type (400 otherwise) and the professional must exist and be active to be added (400 otherwise). `DELETE` removes the entry.

Return JSON errors in the existing shape (`{ error: string }`). Map Postgres code `23505` to 409 and `23503` to 409 or 400 as above; never return raw SQL error text for other codes (return a generic 500 message and log the detail).

### A7. Roster API and types

- `app/api/admin/professionals/route.ts`: remove `tier` from the create schema and the insert. `GET` keeps `select("*")` but the response type no longer declares tier.
- `app/api/admin/professionals/[id]/route.ts`: the update schema accepts only `is_active`; the message becomes "is_active is required".
- `app/api/admin/professionals/import/route.ts`: stop inserting `tier` (the database default applies).
- `src/components/ProfessionalRoster/types.ts`: remove `ProfessionalTier` and tier fields.

### Stage A checkpoint (operator)

Stop after Stage A. Set `planning/STATUS.json` to `awaiting-approval`. Report: the files created or changed, the verification output, and these operator steps:

1. In the Supabase SQL editor run `supabase/preflight/008_preflight.sql` and send the results back.
2. If the results show nothing surprising, run `supabase/migrations/008_meeting_types.sql` once, then a second time (must succeed with no changes).
3. Run `supabase/preflight/008_postcheck.sql` and send the results.
4. Say "stage A confirmed" in chat.

Do not start Stage B until the operator confirms. If the preflight or post-check shows a problem, fix the SQL (two repair attempts at most) and give the operator the corrected file.

## Stage B - admin screens

Plain Tailwind in the style of `src/components/ProfessionalRoster/`. All data goes through the Stage A routes (client components using `fetch`). Show loading and error states. No new dependencies.

- `app/admin/(protected)/AdminNav.tsx`: add links "Meeting types" (`/admin/meeting-types`) and "Professionals" (`/admin/professionals`) next to the title.
- `app/admin/(protected)/meeting-types/page.tsx`: list page with a "New meeting type" button. Each row: title, slug, Active or Inactive badge, durations summary (for example "Short 30, Normal 45"), roles summary (for example "Lead x1, Support x1"), pool size. Rows link to the editor.
- `app/admin/(protected)/meeting-types/new/page.tsx`: form with title, slug (auto-filled from the title, editable), and landing description. On success go to the editor.
- `app/admin/(protected)/meeting-types/[id]/page.tsx`: the editor.
- `src/components/MeetingTypes/`: `types.ts`, `MeetingTypeList.tsx`, `NewMeetingTypeForm.tsx`, `MeetingTypeEditor.tsx` (details, active toggle, thresholds, planned link text "/meet/<slug> (goes live in Sprint 009)"), `DurationsEditor.tsx`, `RolesEditor.tsx`, `PoolEditor.tsx`.
- `PoolEditor.tsx`: lists active professionals (name, email). Each has a checkbox per role of this meeting type; checking any box adds them to the pool, unchecking all removes them. Saves immediately per change with an error message on failure. Shows per-role coverage ("Lead: 3 of 1 needed") using `readiness`.
- Activation: the toggle shows the API's plain message when it is refused. Coverage shortfalls show a warning only.
- Roster: `src/components/ProfessionalRoster/ProfessionalTable.tsx` and `AddProfessionalForm.tsx` lose the tier column, toggle, and select. Everything else on the roster page is unchanged.

### Stage B checkpoint (operator)

Stop after Stage B for the operator to walk through the screens (see acceptance criteria B7) before close-out.

## Close-out (after the operator accepts Stage B)

Per `AGENTS.md`: update `planning/STATE.md` (archive older history verbatim if it grows), `planning/DECISIONS.md` (057 to 062), `planning/RISKS.md` (R-013 with the actual finding, R-014), `planning/QUESTIONS.md` (Q-008 resolved, Q-006 updated), `docs/DATA_MODEL.md` (change "Planned changes (Sprint 008)" to built, with the final field names), `docs/ARCHITECTURE.md` (new Meeting Types component, roster change, Built status), `docs/API.md` (the new admin routes), `docs/VALIDATION.md` (Sprint 008 checks). Mark roadmap row 008 `done`. Refresh `planning/ARCHITECT_BRIEFING.md` with real evidence and Plan corrections. Write `planning/STATUS.json` `sprint-closed`.

## Flight evidence

- **Invariant at risk:** a role in a pool must belong to that pool's meeting type; seeded pools must reproduce today's tier behavior; no policy outside the server role may reach `professionals` or the new tables.
- **Discriminating example (pool seeding):** professionals A (in_depth), B (general). Correct result: In-depth pool = {A}; Short-form pool = {A, B}. A plausible wrong implementation (everyone in both pools, or only general in Short-form) gives In-depth = {A, B} or Short-form = {B}. The post-check must compare these sets.
- **Discriminating example (role integrity):** attaching the In-depth Lead role id to a Short-form pool entry must fail at the database. A wrong implementation that only checks role ids exist would accept it.
- **Source of truth:** the migration and the constraints. API validation is a second layer.
- **Known uncertainty:** the live `tier` column type and the existing policies (resolved by the preflight); whether `requests` has rows.

## Risks

- A failing mid-script migration leaves partial state. The transaction and idempotency guard against this.
- Removing the old `professionals` policy cannot break the app because the app uses the service role (bypasses RLS) for all roster access. Confirm in the Builder plan that no code reads `professionals` through the public client (search for `createPublicSupabaseClient` use).
- Large file list: the stage gates exist for this reason.

============================================================
FILE: planning/sprints/008-meeting-types-roles-pools/acceptance.md
============================================================

# Sprint 008 - Meeting Types, Roles, and Pools: Acceptance

## Stage A

1. `supabase/preflight/008_preflight.sql` exists and contains only `select` statements (no `insert`, `update`, `delete`, `alter`, `drop`, `create`, `truncate`).
2. `supabase/migrations/008_meeting_types.sql` exists, is wrapped in one transaction, and contains no `drop table`, `delete from`, or `truncate`.
3. After the operator runs the migration twice, the second run reports no error and the post-check counts are unchanged.
4. The five new tables exist with the columns, checks, and uniqueness rules in the blueprint. `meeting_type_pool_roles` cannot reference a role from a different meeting type.
5. Exactly two meeting types are seeded: `in-depth` (Standard, 75 minutes; Lead x1, Support x1) and `short-form` (Standard, 45 minutes; Lead x1, Support x1), both inactive.
6. The In-depth pool equals the set of professionals with tier in_depth; the Short-form pool equals the set of all professionals; every seeded pool entry has both roles (post-check output shows the set comparison).
7. All five new tables have RLS enabled and only a `service_role` policy. `professionals` has no policy that applies to `anon`, `authenticated`, or `public` (post-check output).
8. `requests` has nullable `meeting_type_id`, `duration_id`, and `created_by_admin_id`, and `meeting_type` no longer rejects nulls.
9. `supabase/rollbacks/008_meeting_types_rollback.sql` and `supabase/preflight/008_postcheck.sql` exist.
10. Every new admin route returns 401 when no admin is signed in, and works for both Admin and Super Admin. Each route's validation rules match the blueprint, including: duplicate slug returns 409; activation without a duration or a role returns 400; a pool role id from another meeting type returns 400; removing the last duration or role of an active type returns 400.
11. `lib/meeting-types.ts` exports the schemas, `slugify`, and `readiness`; `slugify("In-Depth Intro, Part 2!")` returns `in-depth-intro-part-2`.
12. The roster routes and `src/components/ProfessionalRoster/types.ts` contain no reference to tier (`grep -rn "tier"` over those paths returns nothing).
13. `npx tsc --noEmit` and `npm run build` pass. No file outside the Stage A `owns` list changed.

## Stage B

14. The admin nav shows "Meeting types" and "Professionals" links on every protected admin page.
15. `/admin/meeting-types` lists all meeting types with title, slug, Active or Inactive, durations summary, roles summary, and pool size.
16. `/admin/meeting-types/new` creates an inactive meeting type and redirects to its editor. A duplicate slug shows a plain error and keeps the form values.
17. The editor lets an admin edit title, slug, description, thresholds, and the active toggle; add, rename, and delete durations and roles; and assign professionals to roles from the pool editor. Each change saves immediately and shows an error message when it fails.
18. Turning on Active for a type with no duration or no role is refused with a plain message. A role with fewer pool professionals than its required count shows a warning but does not block activation.
19. The roster page shows no tier column, toggle, or select; adding, importing, and activating or deactivating professionals still work.
20. Visiting any new admin page signed out redirects to `/admin/login`.
21. Operator walkthrough (B7): the operator creates a test meeting type "Beta test" with durations Short 30 and Long 60, roles Lead x1 and Support x2, adds three professionals to the pool, activates it, and confirms the list shows it. Then deletes the test type through the database or leaves it inactive (the operator decides; there is no delete screen in this sprint).
22. The documents named in the close-out section are updated, and the roadmap row 008 is `done`.

## Always

23. Nothing under `app/page.tsx`, `app/api/meetings`, `app/api/responses`, `app/meetings`, `app/team`, `lib/quorum.ts`, `lib/email.ts`, or `src/components/DateTimePicker` changed.
24. No new dependency in `package.json`.

============================================================
FILE: planning/sprints/008-meeting-types-roles-pools/handoff-prompt.md
============================================================

# Sprint 008 - Builder Handoff Prompt

You are the Builder for Group Meet, Sprint 008: Meeting Types, Roles, and Pools. This sprint is guarded (it includes a database migration, changes access to personal data, and adds permission-checked routes). It runs in two operator-gated stages.

## Read first, in order

1. `AGENTS.md`
2. `templates/method/120x-agent-identity.md`
3. `planning/ARCHITECT_BRIEFING.md`, `planning/STATE.md`, `planning/DECISIONS.md`, `planning/DOMAIN.md`, `planning/RISKS.md`, `planning/QUESTIONS.md`, `planning/ROADMAP.md`
4. `planning/sprints/008-meeting-types-roles-pools/requirements.md`, `blueprint.md`, `acceptance.md`
5. `docs/DATA_MODEL.md` (the "Planned changes (Sprint 008)" section), `docs/ARCHITECTURE.md`
6. The existing code you will touch or imitate: `lib/auth.ts`, `lib/supabase.ts`, `app/api/admin/professionals/**`, `src/components/ProfessionalRoster/**`, `app/admin/(protected)/**`
7. `supabase/migrations/005_professionals.sql`, `006_admin_auth.sql`, `007_relax_legacy_meeting_columns.sql`, and `supabase/Phase 1 Domain Schema for Request & Pairings.sql`

Check git first and trust it over prose. Create branch `sprint-008-meeting-types` from `main`. If the working tree or `main` differs from the blueprint's "Verified at planning time" section, report it in your plan.

## Code gate

Because this sprint is guarded, post your build plan before editing anything: the exact file list per stage, the approach, what could go wrong, the checks you will run, and any deviation from this pack with reasons. Include the result of searching for any use of `createPublicSupabaseClient` that reads `professionals`. Wait for the operator to approve that plan. The operator then approves Stage A's checkpoint and Stage B's checkpoint separately.

## Task contract

- **objective:** Give admins a meeting type workspace backed by new database tables: meeting types with named durations, roles with required counts, and pools of professionals with the roles they can fill. Seed today's two types and pools, and lock `professionals` and the new tables to the server only.
- **owns:**
  - Stage A: `supabase/preflight/008_preflight.sql`, `supabase/preflight/008_postcheck.sql`, `supabase/migrations/008_meeting_types.sql`, `supabase/rollbacks/008_meeting_types_rollback.sql`, `lib/meeting-types.ts`, `app/api/admin/meeting-types/**` (the seven route files in the blueprint), `app/api/admin/professionals/route.ts`, `app/api/admin/professionals/[id]/route.ts`, `app/api/admin/professionals/import/route.ts`, `src/components/ProfessionalRoster/types.ts`.
  - Stage B: `app/admin/(protected)/AdminNav.tsx`, `app/admin/(protected)/meeting-types/**`, `src/components/MeetingTypes/**`, `src/components/ProfessionalRoster/ProfessionalTable.tsx`, `src/components/ProfessionalRoster/AddProfessionalForm.tsx`.
  - Close-out: `planning/STATE.md`, `planning/DECISIONS.md`, `planning/RISKS.md`, `planning/QUESTIONS.md`, `planning/ROADMAP.md` (row 008 only), `planning/ARCHITECT_BRIEFING.md`, `planning/STATUS.json`, `planning/archive/`, `docs/DATA_MODEL.md`, `docs/ARCHITECTURE.md`, `docs/API.md`, `docs/VALIDATION.md`; local git commits on `sprint-008-meeting-types`.
- **must_not:** touch the legacy flow (`app/page.tsx`, `app/api/meetings`, `app/api/responses`, `app/meetings`, `app/team`, `lib/quorum.ts`, `lib/email.ts`) or `src/components/DateTimePicker`; add any public page or route; send or wire any email; edit existing migrations (`005` to `007`) or the older SQL files; drop, alter, or retype `professionals.tier`; use `drop table`, `delete from`, or `truncate` in the migration; change policies on tables other than `professionals` and the five new tables; render the landing description as HTML; gate meeting-type routes to Super Admin only; add npm dependencies or a test framework; run SQL against the live database (you have no credentials; the operator applies SQL); store secrets; edit managed method files (`templates/`, `.claude/`, `.agents/`, `.120x/`, `scripts/`); push, open a pull request, merge, rebase, or amend commits; delete user files; invent behavior beyond Decisions 047 to 062.
- **acceptance:** the 24 numbered criteria in `acceptance.md`.
- **verification:** run each from the project root and report the exact command and result.
  1. `npx tsc --noEmit`
  2. `npm run build`
  3. `grep -rn "tier" app/api/admin/professionals src/components/ProfessionalRoster` (expect no output)
  4. `grep -in "drop table\|delete from\|truncate" supabase/migrations/008_meeting_types.sql` (expect no output)
  5. `grep -inE "^\s*(insert|update|delete|alter|drop|create|truncate)\b" supabase/preflight/008_preflight.sql` (expect no output)
  6. `git diff --stat main..HEAD` and confirm every changed path is in `owns`; also `git diff --stat main..HEAD -- app/page.tsx app/api/meetings app/api/responses app/meetings app/team lib/quorum.ts lib/email.ts src/components/DateTimePicker package.json` (expect no output)
  7. A small Node or `npx tsx`-free check of `slugify` is not required; instead read the function and show the example from criterion 11 in your report.
  8. Operator-run, reported by the operator: the preflight, the migration twice, and the post-check (Stage A); the walkthrough in criterion 21 (Stage B).

Two honest repair attempts per failure, then stop and report. Stop at each checkpoint and wait. At close, write the briefing, update the roadmap, and write `planning/STATUS.json` as described in the blueprint, and report any divergence from this pack with reasons.
