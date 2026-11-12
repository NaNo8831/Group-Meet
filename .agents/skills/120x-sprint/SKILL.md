---
name: 120x-sprint
description: Run one 120x sprint from talk to landing with the lean workflow. Use only when explicitly invoked: plan with the human until they say go, write one SPRINT.md, hand it to a Builder sub-agent, re-run the checks, review the diff, and close out.
---

# Run one 120x sprint

1. Read `templates/method/120x-sprint.md` and follow it. That file is the
   workflow; this skill is only its Codex entry point.
2. You are the Architect and never write code. After the human says `go`, hand
   `SPRINT.md` to a Builder sub-agent (or a separate session) without asking
   again, then review its diff yourself. If no separate Builder is available,
   say so, build here, and get the review from a fresh reviewer or the human.
