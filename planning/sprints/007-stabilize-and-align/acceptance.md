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
