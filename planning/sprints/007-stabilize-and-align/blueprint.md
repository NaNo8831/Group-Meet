# Sprint 007 - Stabilize and Align: Blueprint

Documentation and housekeeping only. Work in this order. Make small, separate commits on one branch.

## Verified at planning time (2026-11-06, read-only)

- Branch `fix/relax-legacy-meeting-columns`, two local commits (`71945703`, `6f29d3c3`), not pushed.
- Untracked: `.120x/`, `.agents/`, `.claude/`, `planning/ARCHITECT_BRIEFING.md`, `scripts/update-method.js`, and seven files under `templates/method/`. Modified: `scripts/apply-architect-pack.js`, `templates/method/120x-architect-builder-method-starter.md`, five files under `templates/prompts/`, and the auto-generated `next-env.d.ts`.
- Every file in `.120x/method-manifest.json` (method version 22) exists and matches its recorded hash. The method is intact; it is only uncommitted.
- `.gitignore` line 25 ignores the whole `planning/architect-packs/` folder. That folder also holds a 186 MB installer (`CursorUserSetup-x64-3.7.12.exe`) that must not be deleted or committed.
- Missing: `docs/ARCHITECT_BRIEFING_SPEC.md` (referenced by the briefing and the method files). `planning/STATUS.json` and `planning/ROADMAP.md` were absent; the Architect has now written the roadmap and STATUS.
- `AGENTS.md` says the phase is Discovery / Architecture, says Next.js 14, and forbids auth and a database, all stale since Sprints 004 to 006.

## Step 1 - Branch

Create `chore/sprint-007-stabilize` from the current branch tip (so the two unpushed fix commits are included). Do not push.

## Step 2 - Commit the method files (one commit)

Stage exactly: `.120x/`, `.agents/`, `.claude/`, `scripts/update-method.js`, `scripts/apply-architect-pack.js`, everything under `templates/` (method and prompts), and `planning/ARCHITECT_BRIEFING.md`. Do not stage `next-env.d.ts`. Do not edit any of these files. Commit message: `chore: commit 120x method v22 files`.

## Step 3 - Track Architect Packs

Replace the `planning/architect-packs/` line in `.gitignore` with rules that ignore everything in that folder except Markdown files:

- ignore `planning/architect-packs/*`
- un-ignore `planning/architect-packs/*.md`

Then confirm with `git check-ignore -v`: the `.exe` is still ignored; the `.md` packs are not. Commit `.gitignore` plus the packs `README.md`, `architect-pack-001-discovery.md`, and `architect-pack-007-stabilize-and-align.md`. Tell the operator in the final report that the installer should be moved out of the repo folder (do not move or delete it yourself).

## Step 4 - Planning documents

Edit surgically. Do not rewrite wholesale.

- `planning/DOMAIN.md`: update Meeting Types, Professional Tiers, Tier coverage, Business Rules 1 to 6 and 9, Key Terms, and the workflow steps to reflect Decisions 047 to 055. Meeting types become admin-defined with named durations and roles with required counts. "Lead" and "Support" become example role names. A professional marks which roles (among those they hold in the pool) they can take for each request; "Either" means more than one. Admin still assigns final roles. Keep the 3-business-day rule, Super Admin scope (narrowed per Decision 052), statuses, and email template list as they are. Update `Last updated`.
- `planning/DECISIONS.md`: append rows 047 to 056 exactly as in `requirements.md`, dated 2026-11-06. Add a note in the "Implication" cell of 012 and 024 saying "Superseded by 050/051". Do not delete or reorder rows.
- `docs/DATA_MODEL.md`: add a clearly marked "Planned changes (Sprint 008)" section. Do not write SQL. Describe, with field names, types, nullability, and relationships:
  - `meeting_types`: id, title, slug (unique), landing_description, is_active, min_matched_slots (default 3), min_responses, created_by (nullable), timestamps.
  - `meeting_type_durations`: id, meeting_type_id, label, minutes, sort_order.
  - `meeting_type_roles`: id, meeting_type_id, name, required_count, sort_order.
  - `meeting_type_pool`: meeting_type_id, professional_id, plus which roles that professional can fill (a join to roles).
  - `requests`: replace the `meeting_type` enum field with `meeting_type_id` and add `duration_id`; add a nullable `created_by_admin_id` (Decision 053).
  - What happens to the existing enum values and `professionals.tier`: seeded In-depth and Short-form meeting types and a data migration plan, to be detailed in the Sprint 008 blueprint.
- `docs/ARCHITECTURE.md`: only if a component status changes. This sprint changes none; add one line noting the legacy flow retires in Sprint 014 and the roadmap exists.
- `planning/RISKS.md`: replace the stale Sprint 001 content. Keep R-001 to R-005 only as a one-line archived note pointing at git history. Add: R-007 (two parallel designs until Sprint 014), R-008 (Resend domain unverified, email reaches the account owner only), R-009 (legacy RLS policies are permissive, including public read on legacy tables), R-010 (voting links carry the member id with no token until Sprint 011), R-011 (no automated tests), R-012 (`npm audit` advisories unreviewed). Update R-006 to say the app is on Next.js 16.2.x.
- `planning/QUESTIONS.md`: close or update Q-001 to Q-005 (note each is superseded, still open, or deferred). Add open questions: Q-006 live database state of migrations 005 and 006 and the first Super Admin bootstrap is unconfirmed; Q-007 which of the eight email templates the beta needs; Q-008 default minimum responses per meeting type; Q-009 how many real professionals and clients take part in the beta; Q-010 whether the old `team_members` data needs migrating or can be dropped at Sprint 014.
- `AGENTS.md`: update the tech stack line to the real versions (Next.js 16, as in `package.json`), change "Current Boundary" to say implementation is authorized only by an active sprint listed in `planning/ROADMAP.md`, and reword the rule that forbids auth, database, and cloud sync to say they are authorized only when an active sprint names them. Make no other change.
- `docs/ARCHITECT_BRIEFING_SPEC.md` (new, about one page): describe the briefing's purpose, the required sections as they appear in `templates/method/ARCHITECT_BRIEFING.template.md`, the exact shapes Mission Control reads (four Executive summary lines, Readiness signals table with status `passed` or `attention`, the Tests line, the Do / Owner / Decision lines), and the rule that it never holds source code or secrets. Derive it only from the template and the method starter. Do not invent new rules.

## Step 5 - Close-out

- `planning/STATE.md`: rewrite the top status for Sprint 007 and the current picture. Keep one prior sprint (the follow-up fix) and move older finished history verbatim into `planning/archive/STATE-through-sprint-005.md`. Copy first, verify the copy, then trim. If the copy cannot be verified, leave STATE untrimmed and say so.
- `planning/ROADMAP.md`: change row 007 from `planned` to `done`.
- `planning/ARCHITECT_BRIEFING.md`: refresh per the method (Executive summary, Readiness signals, Tests line, Evidence, Plan corrections, Recommended next Architect action: Sprint 008). Drop the answered open questions.
- `planning/STATUS.json`: set phase to `sprint-closed` with sprint `007-stabilize-and-align` and a current ISO timestamp.
- One final commit for the planning documents: `docs: align planning docs to domain workflow and meeting-type model`.

## Verification tooling

All commands run from the project root. No dev server is needed.

## Risks

- Staging too broadly commits `next-env.d.ts` or the installer. Stage by explicit path, never with `git add -A`.
- The `.gitignore` negation can fail if the folder itself is ignored. Verify with `git check-ignore -v` before committing.
- `DOMAIN.md` edits can silently delete rules that still hold (3-business-day rule, statuses). Edit only the rules named above.
