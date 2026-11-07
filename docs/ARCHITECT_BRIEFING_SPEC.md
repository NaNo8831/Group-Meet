# Architect Briefing Spec

`planning/ARCHITECT_BRIEFING.md` is the return half of the 120x handoff. The Architect Pack and sprint files flow down from Architect to Builder. The briefing flows back up from Builder to Architect at every sprint close. This file describes it; the blank shape is `templates/method/ARCHITECT_BRIEFING.template.md`, and the method context is `templates/method/120x-architect-builder-method-starter.md`.

## Purpose

A bounded, current-state snapshot that lets the Architect re-ground at the start of a session without re-reading the repo. It is a derived abstraction: it describes, and git proves. When the briefing and the repo disagree, the repo wins.

## Rules

- The Builder writes or refreshes it at every sprint close; the Architect reads it first at every session.
- It is a snapshot, not a log. Each close overwrites the previous one.
- It never contains source code, secrets, API keys, passwords, tokens, or credentials. Paths, structure, decisions, and state only.
- Attention is an honest result. A failing signal is reported as `attention`, never hidden.
- Never invent a judgment the completed work cannot support; leave it visibly empty instead.

## Required sections, in order

1. Header: `Project`, `Sprint just completed`, `Last updated`.
2. `## Where things stand`: two to four plain-English sentences, no jargon.
3. `## Executive summary`: exactly four lines, `Business outcome`, `Current focus`, `What is proven`, `What is not live`.
4. `## Current status`
5. `## Since last sprint`: the delta only.
6. `## Architecture / file map`
7. `## Decisions`
8. `## Risks / watch-items`
9. `## Open questions for the Architect`
10. `## Validation / test status`
11. `## Readiness signals`
12. `## Evidence`
13. `## Plan corrections`
14. `## Recommended next Architect action`

## Shapes Mission Control reads

- **Executive summary:** the four lines named above, each starting with its bold label.
- **Readiness signals:** a table with columns `Signal`, `Status`, `Detail`. Two to four rows. `Status` is exactly `passed` or `attention`.
- **Tests line:** `**Tests:** N passing, N failing.` at the start of `## Validation / test status`.
- **Next action:** `Do`, `Owner`, and `Decision` lines above the supporting prose in `## Recommended next Architect action`.

## Evidence and Plan corrections

`## Evidence` lists the exact validation commands run and what each reported (counts, exit codes, build results), so the next reader can re-run them and expect the same answers. `## Plan corrections` says in plain language what the plan got wrong or left ambiguous, or "None — the plan held." The Architect reads it before planning new work and proposes any plan amendments as visible edits in git.
