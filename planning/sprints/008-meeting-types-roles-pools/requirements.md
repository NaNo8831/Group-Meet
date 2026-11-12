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
