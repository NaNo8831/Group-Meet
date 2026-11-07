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
