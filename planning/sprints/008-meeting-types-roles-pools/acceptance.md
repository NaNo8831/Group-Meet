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
