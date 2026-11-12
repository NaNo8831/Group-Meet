============================================================
FILE: planning/sprints/007-stabilize-and-align/requirements.md
============================================================

# Sprint 007 - Stabilize and Align: Requirements

## Why

Group Meet now has two designs in one repo, and the plan for the beta has changed twice. The operator has decided the beta runs on the domain workflow, and that meeting types are admin-defined data (title, landing page, named durations, roles with required counts, a pool of professionals), not two fixed types. Before any more code, every planning document, the method files, and the git history must say the same thing. This sprint is documentation and housekeeping only. No application code, migrations, or SQL change.

## Scope

1. **Protect the method files.** The 120x method files, commands, skills, manifest, and updater are untracked or modified. Commit them so a checkout or clean cannot lose them.
2. **Stop ignoring Architect Packs.** `planning/architect-packs/` is git-ignored, so sprint history cannot be recovered. Track the `.md` packs; keep binaries ignored.
3. **Align the planning documents** to the decisions below.
4. **Close method gaps:** the referenced `docs/ARCHITECT_BRIEFING_SPEC.md` does not exist; `AGENTS.md` still says the project is in Discovery and lists stale tech.
5. **Record the decisions** in `planning/DECISIONS.md` as 047 to 056.

## Decisions to record (verbatim intent, Builder writes them as table rows dated 2026-11-06)

| # | Decision | Why | Implication |
|---|---|---|---|
| 047 | The beta runs on the domain workflow. The legacy meetings flow (`meetings`, `time_slots`, `team_members`, `responses`, `lib/quorum.ts`) is retired in Sprint 014. | Two parallel designs caused admin pages to be built on the wrong tables. | New pages use only domain tables. Legacy code stays untouched until Sprint 014. |
| 048 | Meeting types are admin-defined data, not an enum. A meeting type has a title, a landing page (description), a shareable slug, named duration options, roles with required counts, and a pool of professionals. | The operator wants a workspace where meetings are created without code changes. | The fixed `meeting_type` enum and the fixed In-depth / Short-form types are superseded. In-depth (75) and Short-form (45) become the first two seeded meeting types. |
| 049 | Duration options are named and defined per meeting type (for example Short 30, Normal 45, Long 60). The client picks one option and never types a number. End time is always start plus the chosen duration. | Keeps Decisions 001, 002, 006 intact while making durations configurable. | A request stores the chosen duration option. Slots still store only a start time. |
| 050 | Roles belong to the meeting type, each with a required count. A professional can fill a role only if they are in that meeting type's pool for that role. The In-depth / General tier concept is superseded. | Supports setups such as 1 Lead + 1 Support or 1 Lead + 2 Support. | Decisions 024 and the tier rules in 018 to 025 are superseded for matching. `professionals.tier` stays in the database until Sprint 008 migrates it. CSV import stays name + email (Decision 025). |
| 051 | Threshold is per meeting type. Default: every required role can be filled by a distinct qualified professional in at least 3 slots. The minimum number of matched slots (default 3) and a minimum number of responses are editable per meeting type. | Replaces the fixed "4 responses + 3 matched slots" (Decision 012). | Sprint 008 defines the exact fields and defaults. Open question Q-008 tracks the minimum responses default. |
| 052 | Admin and Super Admin can create and edit meeting types, durations, roles, and pools. Only Super Admin can edit email templates, platform settings, and invite or manage admins. | Matches the operator's answer; refines Decisions 009, 010, 011. | Permission checks on the meeting-type routes allow both roles. Template, settings, and invite routes stay Super Admin only. |
| 053 | Admin-created requests on a client's behalf are deferred, not dropped. The request model must stay flexible: the creator of a request is nullable and requests do not assume the public form is the only source. | The operator wants flexibility for the future without building it now. | No admin request-entry UI before the beta ends. Sprint 009 keeps a nullable creator reference. |
| 054 | The client still picks the final slot after admin approval. Professionals commit to client-proposed slots. | Avoids booking a time the client cannot make; confirms Decisions 019 to 023. | The flow in `DOMAIN.md` steps 1 to 7 is unchanged apart from roles and durations. |
| 055 | Each meeting type has one shareable link (slug). A public page lists the active meeting types. | The operator wants clients to click a link for a specific meeting. | Slug is unique and URL-safe. The home page becomes the list; the form lives under the slug. |
| 056 | Architect Pack `.md` files are tracked in git. Binaries in `planning/architect-packs/` stay ignored. | Sprint history was unrecoverable because packs were ignored. | `.gitignore` is changed per the blueprint. |

## Plan corrections from the Builder briefing (now rules for later sprints)

- Every sprint blueprint from 008 on must name the tables each page or route reads and writes.
- Any sprint that changes form fields or stored data must name its migration in the blueprint and say who applies it.
- Sprint history must live in git (Decision 056).

## Out of scope

- No application code, no SQL, no migration files, no change under `app/`, `lib/`, `src/`, or `supabase/`.
- No edits to the managed method files under `templates/method/`, `.claude/`, `.agents/`, `.120x/`, or `scripts/` (they are committed as they are).
- No pushing, no pull request, no merge, no deletion of any file (including the large installer in the packs folder).
- No change to `next-env.d.ts` (auto-generated; leave it uncommitted).

## Success

A new person can read `AGENTS.md`, `DOMAIN.md`, `DECISIONS.md`, `DATA_MODEL.md`, and `ROADMAP.md` and get one consistent picture: domain workflow, admin-defined meeting types with named durations and roles, and the nine-sprint road.

============================================================
FILE: planning/sprints/007-stabilize-and-align/blueprint.md
============================================================

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

============================================================
FILE: planning/sprints/007-stabilize-and-align/acceptance.md
============================================================

# Sprint 007 - Stabilize and Align: Acceptance

1. `git log` on `chore/sprint-007-stabilize` shows three new commits on top of `6f29d3c3`: method files, `.gitignore` with packs, and planning documents. Nothing is pushed.
2. `git status --short` shows no untracked or modified files except `next-env.d.ts` (and the installer, which stays ignored).
3. `git check-ignore -v planning/architect-packs/CursorUserSetup-x64-3.7.12.exe` reports it is ignored. `git check-ignore -v planning/architect-packs/architect-pack-007-stabilize-and-align.md` prints nothing.
4. A hash check shows every file listed in `.120x/method-manifest.json` exists and its SHA-256 matches (after normalising line endings). Output is empty.
5. `planning/DECISIONS.md` has rows 047 to 056, all dated 2026-11-06, matching `requirements.md`. Rows 001 to 046 are unchanged except the supersession notes on 012 and 024.
6. `planning/DOMAIN.md` no longer describes two fixed meeting types, In-depth / General tier routing, or a fixed "4 responses and 3 matched slots" threshold as current rules. A search for `In-depth` in it finds only the seeded-examples note. The 3-business-day rule, request statuses, and email template list are still present.
7. `docs/DATA_MODEL.md` has a "Planned changes (Sprint 008)" section naming `meeting_types`, `meeting_type_durations`, `meeting_type_roles`, `meeting_type_pool`, and the `requests` changes. It contains no SQL.
8. `AGENTS.md` says Next.js 16, and no longer says the phase is Discovery or forbids auth and a database outright.
9. `docs/ARCHITECT_BRIEFING_SPEC.md` exists, is about one page, and states the four Mission Control shapes listed in the blueprint.
10. `planning/RISKS.md` and `planning/QUESTIONS.md` contain no open item that is only true of Sprint 001, and contain the new items R-007 to R-012 and Q-006 to Q-010.
11. `planning/ROADMAP.md` row 007 is `done`; `planning/STATUS.json` is `sprint-closed`; `planning/ARCHITECT_BRIEFING.md` records the evidence and plan corrections.
12. `git diff --stat 6f29d3c3..HEAD` shows no change under `app/`, `lib/`, `src/`, or `supabase/`, and `npm run build` still passes.

============================================================
FILE: planning/sprints/007-stabilize-and-align/handoff-prompt.md
============================================================

# Sprint 007 - Builder Handoff Prompt

You are the Builder for Group Meet, Sprint 007: Stabilize and Align. This is a documentation and housekeeping sprint. You write no application code.

## Read first, in order

1. `AGENTS.md`
2. `templates/method/120x-agent-identity.md`
3. `planning/ARCHITECT_BRIEFING.md`
4. `planning/STATE.md`, `planning/DECISIONS.md`, `planning/DOMAIN.md`, `planning/RISKS.md`, `planning/QUESTIONS.md`, `planning/ROADMAP.md`
5. `planning/sprints/007-stabilize-and-align/requirements.md`, `blueprint.md`, `acceptance.md`
6. `docs/DATA_MODEL.md`, `docs/ARCHITECTURE.md`

Check git before starting and trust it over any prose. If the branch or working tree differs from the blueprint's "Verified at planning time" list, report the difference in your plan.

## Code gate

Post your plan before editing anything: the exact file list, what you will not do, each acceptance criterion, and the commands you will run. Wait for the operator to approve that plan. This sprint is not guarded (no login, money, personal data, migration, or delete), so in an active `/sprint` session the operator's `go` is the approval.

## Task contract

- **objective:** Make the repo, the method files, and every planning and architecture document describe one product: the domain workflow with admin-defined meeting types (named durations, roles with required counts, pools), on the nine-sprint road in `planning/ROADMAP.md`.
- **owns:** `.gitignore`; `AGENTS.md`; `planning/DOMAIN.md`; `planning/DECISIONS.md`; `planning/RISKS.md`; `planning/QUESTIONS.md`; `planning/STATE.md`; `planning/ROADMAP.md` (row 007 only); `planning/ARCHITECT_BRIEFING.md`; `planning/STATUS.json`; `planning/archive/`; `docs/DATA_MODEL.md`; `docs/ARCHITECTURE.md` (one line); `docs/ARCHITECT_BRIEFING_SPEC.md` (new); git commits on a new local branch `chore/sprint-007-stabilize`.
- **must_not:** change anything under `app/`, `lib/`, `src/`, `supabase/`, or `public/`; edit the managed method files (`templates/`, `.claude/`, `.agents/`, `.120x/`, `scripts/`), which are committed as they are; touch `next-env.d.ts`; use `git add -A` or `git add .`; push, open a pull request, merge, rebase, or amend existing commits; delete or move any file, including the installer in `planning/architect-packs/`; write SQL or migration files; store secrets; rewrite documents wholesale or drop rules that still hold; invent product behavior beyond Decisions 047 to 056.
- **acceptance:** the twelve numbered criteria in `acceptance.md`.
- **verification:** run each from the project root and report the exact command and result.
  1. `git status --short`
  2. `git log --oneline 6f29d3c3..HEAD`
  3. `git diff --stat 6f29d3c3..HEAD -- app lib src supabase` (expect no output)
  4. `git check-ignore -v planning/architect-packs/CursorUserSetup-x64-3.7.12.exe planning/architect-packs/architect-pack-007-stabilize-and-align.md` (expect only the installer reported)
  5. A Node check that reads `.120x/method-manifest.json`, hashes each listed file with SHA-256 after normalising line endings, and prints any file that is missing or differs (expect no output). If a file differs, report it; do not edit it.
  6. `grep -n "^| 04[7-9]\|^| 05[0-6]" planning/DECISIONS.md` (expect ten rows)
  7. `npx tsc --noEmit`
  8. `npm run build`

Stop after two focused repair attempts on any failing check and report what you tried. At close, write the briefing and STATUS as described in the blueprint, and report any divergence from this pack with reasons.
