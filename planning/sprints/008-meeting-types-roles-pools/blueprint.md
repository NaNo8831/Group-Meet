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
