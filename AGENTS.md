# AGENTS.md

## Project

**Name:** Group Meet  
**Client:** Private  
**Description:** Group Meet lets external Participants request a meeting with a team, then automatically confirms the booking once one Leader and one Support have both indicated availability for the same time slot.  
**Tech stack:** - Next.js 14 (App Router)- TypeScript- Supabase (Postgres + Row Level Security)- Vercel (hosting)- Resend (transactional email)- shadcn/ui + Tailwind CSS- react-hook-form + zod- date-fns  
**Planning folder:** `group-meet/`  
**Implementation repo:** Downloaded project folder  
**Created:** 2026-06-05

---

## Operating Model

This project uses the 120x Architect / Builder methodology.

The handoff is a folder, not a conversation.

The Architect defines requirements, blueprint, acceptance criteria, risks, decisions, and Builder handoff prompts.

The Builder executes from written artifacts and must not redefine scope or invent product behavior.

---

## First Files to Read

Read these in order at the start of every Builder session:

1. `AGENTS.md`
2. `README.md`
3. `project-start.md`
4. `planning/STATE.md`
5. `planning/DECISIONS.md`
6. `planning/DOMAIN.md`
7. `planning/RISKS.md`
8. `planning/QUESTIONS.md`
9. Active sprint files under `planning/sprints/`
10. Relevant docs under `docs/`

---

## Project Structure

```text
.
├── docs/                  # Durable technical documentation
├── planning/              # Project planning, Architect Packs, domain context, decisions, risks, sprints
│   ├── architect-packs/   # Architect Pack files before importer dry-run/apply
│   └── sprints/           # Builder execution files after packs are applied
├── references/            # Raw reference material and source examples
├── samples/               # Sample project metadata or generated examples
├── scripts/               # Utility scripts, including Architect Pack importer
├── src/                   # Source code when implementation begins
├── templates/             # Reusable templates used by the project
└── tests/                 # Tests and validation fixtures
```

---

## Current Boundary

This folder was generated from:

`Hosted virtual scaffold`

The current phase is Discovery / Architecture.

Until an active sprint explicitly authorizes implementation, do not write production application code.

---

## Builder Rules

- Do not write production application code unless the active sprint explicitly authorizes it.
- Do not redefine scope or invent product behavior.
- Do not expand scope into a dashboard or project management system unless the Architect documents that scope.
- Do not add auth, database, cloud sync, CRM, invoicing, or GitHub API automation unless explicitly authorized by an active sprint.
- Do not overwrite existing user project folders without an explicit confirmation strategy.
- Do not delete user files.
- Do not store secrets, API keys, passwords, tokens, or private credentials.
- Prefer boring, local, file-based automation.
- Keep generated files plain Markdown where practical.
- Update `planning/STATE.md` at the end of each meaningful session.
- Record durable decisions in `planning/DECISIONS.md`.
- Update `docs/ARCHITECTURE.md` when architecture changes.
- Update `docs/VALIDATION.md` when validation behavior changes.

---

## Sprint Workflow

Each sprint lives in:

```text
planning/sprints/###-{sprint-name}/
```

Each sprint should include:

- `requirements.md` — what and why
- `blueprint.md` — how to build it
- `acceptance.md` — what done means
- `handoff-prompt.md` — exact Builder prompt

The Builder should read all four before implementation.

Architect Packs live in `planning/architect-packs/`. Builder execution lives in `planning/sprints/`.

After an Architect Pack is applied, do not implement directly from the pack file. Implement from the generated sprint files under `planning/sprints/`.

---

## Planning Document Updates

At the end of each sprint, review each planning and architecture document and update it only if the sprint's work makes the current content inaccurate or incomplete. Do not rewrite documents wholesale; make surgical updates.

| File | Update if... |
|---|---|
| `planning/STATE.md` | Always — update current sprint, status, recently completed, next actions, and any blockers |
| `planning/DECISIONS.md` | A decision was made during the build that is not already recorded |
| `planning/DOMAIN.md` | A domain rule was clarified or corrected during implementation |
| `docs/DATA_MODEL.md` | A field name, type, or relationship changed during implementation |
| `docs/ARCHITECTURE.md` | Any component status changed from Planned to Partial or Partial to Built; update the relevant component and directory tree entries |

Do not update a file just to say the sprint happened. Only update where the content would be wrong or misleading without the change.

---

## Completion Standard

A sprint is complete only when:

- The requested behavior is implemented or documented as intentionally deferred.
- Acceptance criteria are satisfied.
- Validation has been run or a clear reason is documented.
- State and documentation are updated.
- New decisions are recorded in `planning/DECISIONS.md`.
- New risks or open questions are recorded.
