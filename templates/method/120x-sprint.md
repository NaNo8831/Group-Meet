# 120x Sprint: one sprint, talk to landing

This is the default way to run a 120x sprint with current frontier coding models
(Claude Opus 5.5, Fable, current Codex models). It keeps what makes the method
trustworthy and drops the paperwork those models no longer need. `/architect`,
`/build`, and `/fly` still work; use them when you want the older, more gated flow.

## What stays true

- **The folder is the record.** Anything that matters ends up in a file. Git beats
  prose: when a file claims something the repo contradicts, believe the repo and
  fix the file.
- **Contract before code.** Every sprint has a short written contract the work is
  held to.
- **The writer never grades their own work.** A reviewer that did not write the
  code checks the diff before anything is called done.
- **Evidence is a command that ran.** Not a claim that it would pass.
- **Plain English with the person.** Many operators have never shipped code.

Everything below serves those five. If a step would not change the outcome, skip
it.

## Two roles, run automatically

This session is the **Architect**. It talks with the person, writes `SPRINT.md`,
checks the evidence, reviews the diff, and closes out. It never writes code.

A **Builder** writes the code. In Claude Code, it is a subagent. In Codex, it is a
sub-agent or a separate session. The Builder works from `SPRINT.md` and the repo,
not from the conversation, so the sprint file is the whole handoff. Because the
Architect did not write the code, its review of the diff is independent.

The person's `go` authorizes the whole loop. After `go`, do not stop to ask
whether to build: the Architect hands `SPRINT.md` to the Builder and the loop runs
to landing. The only human stop after `go` is plan approval on a guarded sprint
(see below). This is the `/sprint` exception to the standalone code gate
described in `120x-agent-identity.md`.

If your tool cannot start a separate Builder, say so, build in this session, and
get the diff review from a fresh reviewer (a subagent or separate session) or
from the person. Never substitute self-review.

## Where you are working

- **Ordinary folder:** the method files and the code are the same folder.
- **Existing project:** the coding tool is open at the repository root and the
  method lives in a child folder named by the root launcher (for example
  `120x-cora/`). Planning files are written inside that folder; code changes go
  in the surrounding repository. Every path below is relative to the method
  folder.

## 1. Talk

Read `AGENTS.md`, then `planning/ARCHITECT_BRIEFING.md`, `planning/ROADMAP.md`,
and `planning/STATUS.json` if they exist. Read other planning files, docs, and
code only when the conversation needs them, and prefer searching to reading whole
files. Do not read `planning/archive/` unless the work touches something it
records.

Open with two or three short plain-English paragraphs: where the project stands,
what finished last and why it mattered, and what we are deciding today. No paths,
branch names, or jargon in the opening.

Then think it through together. Recommend rather than interrogate. Ask only
questions whose answer would change what gets built, and give your recommendation
with each one. "Do what you recommend" is a valid answer.

If there is no roadmap yet, or the planning files are still seeds, this first
conversation is discovery: the business problem, who uses it, today's workflow,
the data involved, what is out of scope, what success looks like, and the
smallest useful first version. Then lay out the road as "about N sprints" and
write `planning/ROADMAP.md` from `templates/method/ROADMAP.template.md` with the
first sprint. For an already-built codebase that has never met the method, use
`/onboard` first.

**Guarded sprints.** If the work touches login or permissions, money or pricing,
personal data, database migrations, deleting data, or anything irreversible
outside the repo (sending email, charging cards, deploying), say so plainly. That
sprint is guarded: the person approves the build plan before any code is written.

Nothing is written until the person clearly tells you to proceed ("go", "build
it", "do it"). General agreement such as "sounds good" is not that; ask "Say go
and I will build it."

## 2. Write the sprint

After `go`, create `planning/sprints/NNN-short-name/SPRINT.md` from
`templates/method/SPRINT.template.md`. `NNN` is the next sprint number, zero
padded like the existing folders.

Write it for a capable engineer: the outcome, the contract, the non-obvious
decisions, and numbered acceptance criteria someone can check. Do not write
step-by-step instructions the builder can work out. Most sprints fit in 150 to
400 words; go longer only when the risk calls for it.

If the sprint is large (an app-wide change or a long file list), split it into
two sprints, or into stages with a pause for the person to look at real output
between them.

If `planning/ROADMAP.md` exists, make sure the sprint has a `planned` row. Write
`planning/STATUS.json`:

```json
{ "schemaVersion": 1, "phase": "building", "sprint": "<sprint folder name>", "updated": "<ISO-8601 time>" }
```

Then go straight to the build.

## 3. Build (Builder)

Start the Builder with: the path to `SPRINT.md`, the instruction to read
`AGENTS.md` and whatever else in the repo it needs, and what to return (the files
it changed, each verification command with its result, and anything in
`SPRINT.md` that was unclear or wrong). Do not paste the conversation; if the
Builder needs something that is not in `SPRINT.md`, the sprint file has a gap, so
fix the file and tell the Builder.

The Builder:

- builds to the contract: changes only what `owns` covers and nothing `must_not`
  forbids;
- checks git before starting, preserves unrelated work, and does not invent
  product behavior;
- may use its own helpers for independent pieces, each with its own files, and
  verifies their work itself;
- runs the `verification` commands for real and reports each command and its
  result (exit code, pass and fail counts);
- makes at most two focused repair attempts on a failing check, then stops and
  reports what it tried;
- does not commit, push, merge, deploy, or delete user files unless the person
  asked.

**Guarded sprint.** The Builder first returns its build plan without editing
anything: the files it will change, the approach, what could go wrong, and the
checks it will run. The Architect checks that plan against `SPRINT.md`, shows it
to the person in plain English, writes STATUS with `"phase": "awaiting-approval"`,
and waits for the person to approve it. Then STATUS goes back to `building` and
the same Builder proceeds.

## 4. Check (Architect)

The Builder's report is a claim. Re-run the `verification` commands yourself and
keep each command and its result. If the change is something a person judges by
eye, look at it now (or ask the person to) so any problems ride the same repair
round as the review.

## 5. Review (Architect)

Read the full diff against `SPRINT.md` and the check results, and judge each
acceptance criterion by number. The Architect did not write the code, so this is
the independent review. Return one verdict:

- `pass`: every criterion is met, the work stays in scope, and the evidence is
  real.
- `fix`: the specific defects, sent back to the same Builder. A defect is an
  unmet criterion, a wrong result, a scope breach, or security or data harm.
  Preferences and nice-to-haves go in the report as suggestions and do not block
  `pass`.
- `ask`: one blocking question for the person, with a recommendation.

After a `fix`, the Builder repairs only those defects and you re-check only the
repair. If the same defect survives two rounds, stop and ask the person.

If `SPRINT.md` itself turns out wrong in a way that stays within what the person
approved, correct it and note the change under `## Result`. If the fix would
change scope, stop and ask.

## 6. Close

Keep it short. Only write what changed.

1. Fill in `## Result` in `SPRINT.md`: the commands you ran and what they
   reported, the review verdict, and what differed from the plan (or "Plan
   held").
2. Refresh `planning/ARCHITECT_BRIEFING.md` from
   `templates/method/ARCHITECT_BRIEFING.template.md`. Mission Control reads four
   parts of it, so keep their exact shape: the four `## Executive summary` lines,
   the `## Readiness signals` table (status is exactly `passed` or `attention`),
   `**Tests:** N passing, N failing.` at the top of `## Validation / test status`,
   and the `Do` / `Owner` / `Decision` lines. Other sections can be one line, and
   "No change" is fine. Report a failing signal as `attention`; never hide it.
3. Mark the sprint's roadmap row `done`. If the work showed that the road should
   change, say so in the briefing's `## Plan corrections`.
4. Update `planning/STATE.md` in a few lines. Add to `DECISIONS.md`, `RISKS.md`,
   or `QUESTIONS.md` only when something real happened.
5. If STATE, DECISIONS, or QUESTIONS has grown long, move finished history
   verbatim into `planning/archive/`: copy it, check the copy, then trim. Never
   summarize history away.
6. Write STATUS with `"phase": "sprint-closed"`.
7. Tell the person in plain English what shipped, what is proven, and what you
   recommend next.

A new sprint starts with a new conversation and a new `go`.

## Planning in a chat app

If the planning conversation happens in ChatGPT or Claude.ai without file access,
the Architect produces the same `SPRINT.md` as an Architect Pack with a single
`FILE:` section, and the person applies it with
`node scripts/apply-architect-pack.js <pack> --dry-run`, then without
`--dry-run`. In the coding tool, run `/sprint` and say the sprint is already
written: that session becomes the Architect and runs build, check, review, and
close exactly as above.
