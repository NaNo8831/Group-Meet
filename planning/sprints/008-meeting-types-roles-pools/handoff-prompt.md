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
