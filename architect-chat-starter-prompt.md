# Architect Chat Starter Prompt

I am starting a new 120x Architect / Builder project.

Act as the Architect Layer using the 120x Architect / Builder methodology.

## Project Metadata

- Project name: Group Meet
- Client: Private
- Project slug: group-meet
- Planning folder: group-meet/
- Implementation repo: Downloaded project folder
- Canonical GitHub repo: https://github.com/NaNo8831/Group-Meet
- One-sentence description: Group Meet lets external Participants request a meeting with a team, then automatically confirms the booking once one Leader and one Support have both indicated availability for the same time slot.
- Project type: Internal tool
- Tech stack: - Next.js 14 (App Router)- TypeScript- Supabase (Postgres + Row Level Security)- Vercel (hosting)- Resend (transactional email)- shadcn/ui + Tailwind CSS- react-hook-form + zod- date-fns

## Current Status

- The project folder has been created from the reusable 120x scaffold.
- No application code has been written yet.
- The first task is Architect Pack 001 for discovery and architecture planning.

## 120x Methodology Context

- Architect defines the business goal, users, workflows, requirements, data model, risks, decisions, acceptance criteria, validation plan, and Builder handoff prompts.
- Builder executes from written artifacts.
- The handoff is a folder, not a conversation.
- The project folder is the durable source of truth.
- Every implementation sprint should include:
  - `requirements.md`
  - `blueprint.md`
  - `acceptance.md`
  - `handoff-prompt.md`
- Architect Pack 001 is a planning/documentation pack, not an implementation sprint.
- Do not write application code in Architect Pack 001.

## Optional Methodology Source References

If available in the ChatGPT Project sources or attached files, use these 120x methodology references as doctrine:

- `120x-architect-builder-philosophy.md`
- `120x-new-project-quickstart-v2.md`
- `120x-project-scaffold-instructions.md`
- `ARCHITECT_PACK_WORKFLOW.md`
- `templates/method/120x-architect-builder-method-starter.md`

Do not summarize those methodology files unless needed. Use them to keep the Architect Pack aligned with the 120x workflow.

## Source Material Folder Conventions

- `references/client-docs/` is for client documents, proposals, emails, meeting notes, and intake material.
- `references/source-app/` is for existing app, code, assets, exports, or source-system material.
- `references/platform/` is for platform notes, repo notes, hosting notes, and integration context.
- `samples/` is for sample data, exports, workbooks, fixtures, and generated examples.
- `docs/` is for durable technical documentation.
- `planning/` is for project state, decisions, domain context, risks, questions, file inventory, and sprint artifacts.

## Project Intake Context

Use the intake context below as the primary project context for Architect Pack 001.

If the intake is incomplete, do not invent details. Preserve unknowns in `planning/QUESTIONS.md` and label assumptions clearly.

### Business Problem

Scheduling meetings that require two specific internal roles (Leader and Support) is a manual, error-prone process driven by back-and-forth emails. There is no central place for Participants to submit a request or for team members to indicate availability, and no automation to trigger confirmation once the right people are free.

### Primary Users / Roles

- **Participant (external):** Submits a meeting request with their name, email, topic, and up to 5 proposed time slots. Receives a confirmation email when the meeting is locked in. Has a read-only status page to track their request. No account or login required.
- **Leader (internal team member):** Receives a notification email when a new request comes in. Clicks a unique link to select available time slots. One Leader must be confirmed for every meeting.
- **Support (internal team member):** Same voting flow as Leader. One Support must be confirmed for every meeting.

### Current Workflow

Scheduling is handled entirely by manual back-and-forth emails between the Participant and the team, with no structured process for confirming the right roles are available.

### Pain Points

- No single place for Participants to submit a request
- No visibility into which team members are available for a given slot
- Confirmation requires manual coordination between at least two internal people
- Easy to end up with a meeting that has the wrong role coverage or no coverage at all

### Target Workflow

1. Participant fills out a request form with their name, email, topic, and proposed time slots.
2. All active team members receive an email with a unique link to select their available slots.
3. After each vote, the system automatically checks if any slot now has both a Leader and a Support available.
4. If quorum is met, the earliest qualifying slot is confirmed, the meeting is locked, and confirmation emails are sent automatically to the Participant, the assigned Leader, and the assigned Support.

### Source Materials

- Rallly (https://rallly.co/) — referenced as UI/UX inspiration
- Project architecture documents: requirements.md, blueprint.md, acceptance.md, planning/STATE.md, planning/DECISIONS.md

### Systems / Tools Involved

- Supabase — database and Row Level Security
- Resend — transactional email (team notifications + confirmation emails)
- Vercel — hosting and deployment

### Data Inputs And Outputs

**Inputs:**
- Participant name, email, meeting topic, proposed time slots (date + start time + end time, up to 5)
- Team member availability votes (one or more slot selections per member)

**Outputs:**
- Meeting record stored in Supabase with status (pending / confirmed)
- Team notification emails with voting links (one per active team member)
- Participant confirmation email (confirmed date/time, assigned Leader and Support first names)
- Team confirmation emails to assigned Leader and Support (participant details, topic, confirmed date/time)
- Participant status page at /meetings/[id] (read-only, no login)

### Out Of Scope For First Version

- Ability for Participants to reschedule or cancel a confirmed meeting
- Admin dashboard for managing team members (team members seeded directly in the database for Phase 1)
- Calendar integration (Google Calendar, Outlook, .ics) — deferred to Phase 2
- Participant login or account creation
- Auth on voting links (Phase 1 uses ?member=[uuid] query param; magic link auth deferred to Phase 2)

### Success Criteria

- Zero back-and-forth emails required to schedule a meeting
- Every confirmed meeting is guaranteed to have exactly one Leader and one Support
- Participant receives a confirmation email with no manual intervention from the team

### Open Questions

- Where will the GitHub repository be hosted? (currently UNKNOWN)
- Will calendar integration (.ics, Google Calendar, Outlook) be added in Phase 2?
- Should the quorum logic ever prefer a slot other than the earliest qualifying one (e.g. highest team-member overlap)?
- What happens if no quorum is ever reached — is there a timeout or a manual override flow?

## Mandatory Discovery Gate

Before creating Architect Pack 001, check whether the intake is complete enough to produce useful Builder-ready planning documents.

If any of the following are TBD, vague, missing, or unclear, do not create the Architect Pack yet:

- business problem
- primary users / roles
- current workflow
- pain points
- target workflow
- systems / tools involved
- data inputs and outputs
- out-of-scope boundaries
- success criteria
- MVP / smallest useful next sprint

Instead, run a discovery brainstorm first.

The discovery brainstorm should:

- ask practical, targeted questions
- avoid overwhelming me
- group questions by business goal, workflow, users, data, success criteria, and MVP scope
- propose 2-3 possible project directions if the idea is vague
- help me choose the smallest useful first version
- preserve unknowns instead of inventing them
- challenge weak assumptions
- keep the project from becoming too broad

Do not generate the downloadable Architect Pack until I explicitly say one of the following:

- "Generate the pack"
- "Create the pack"
- "Make the Architect Pack"
- "Proceed with the pack"

If the intake is incomplete, your output should be a discovery conversation, not a file.

## Task

Begin the Architect Pack 001 process.

First, apply the Mandatory Discovery Gate.

If the intake is incomplete, run the discovery brainstorm and do not create the pack yet.

If the intake is complete enough and I have explicitly approved pack generation, create the downloadable Architect Pack file.

Save Architect Packs in `planning/architect-packs/`. The importer still runs from the project root with a relative pack path.

The pack should populate:

- `planning/STATE.md`
- `planning/DECISIONS.md`
- `planning/DOMAIN.md`
- `planning/RISKS.md`
- `planning/QUESTIONS.md`
- `planning/FILE_INVENTORY.md`
- `planning/sprints/001-discovery-architecture/requirements.md`
- `planning/sprints/001-discovery-architecture/blueprint.md`
- `planning/sprints/001-discovery-architecture/acceptance.md`
- `planning/sprints/001-discovery-architecture/handoff-prompt.md`
- `docs/ARCHITECTURE.md`
- `docs/API.md`, if useful
- `docs/VALIDATION.md`

## Builder-Ready Sprint Expectations

Any sprint created by Architect Pack 001 should be small enough for a Builder to execute from the folder without redefining scope.

The sprint artifacts should include:

- clear in-scope and out-of-scope boundaries
- requirements tied to the business goal
- a practical implementation blueprint
- acceptance criteria that can be checked
- validation expectations
- risks and open questions
- an exact Builder handoff prompt

## Architect Pack Output Requirement

Only after I explicitly say "Generate the pack," create a downloadable Markdown file named:

`architect-pack-001-discovery.md`

Do not paste the full Architect Pack into chat unless file creation is unavailable.

The file must be ready to use with:

`node scripts/apply-architect-pack.js planning/architect-packs/architect-pack-001-discovery.md --dry-run`

After dry-run review, it should be ready to apply with:

`node scripts/apply-architect-pack.js planning/architect-packs/architect-pack-001-discovery.md`

## Delimiter Rules

The Architect Pack must use this exact file section format:

```text
============================================================
FILE: relative/path/from/project-root.md
============================================================

File content goes here.
```

Important:

- Every separator line must be exactly 60 equals signs.
- Do not shorten the separator.
- Do not use markdown headings instead of `FILE:` sections.
- Do not wrap the entire Architect Pack in triple backticks.
- Do not include extra commentary inside the downloadable pack unless it belongs in a target file.

## Rules

- Do not write application code.
- Do not write application code in Architect Pack 001.
- Do not invent unknown facts.
- Use assumptions only when necessary and label them clearly.
- Keep first drafts practical and lightweight.
- Keep the MVP and next sprint practical.
- Create Builder-ready requirements, blueprint, acceptance criteria, and handoff prompt.
- Output should be ready for `scripts/apply-architect-pack.js`.
- After the pack is applied, Builders should implement from the generated files under `planning/sprints/`, not directly from the Architect Pack.
