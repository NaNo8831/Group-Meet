# Project Start

## Project Metadata

| Field | Value |
|---|---|
| Project name | Group Meet |
| Client name | Private |
| Project slug | group-meet |
| One-sentence description | Group Meet lets external Participants request a meeting with a team, then automatically confirms the booking once one Leader and one Support have both indicated availability for the same time slot. |
| Project type | Internal tool |
| Planning folder | group-meet/ |
| Implementation repo path | Downloaded project folder |
| Canonical GitHub repo | https://github.com/NaNo8831/Group-Meet |
| Tech stack | - Next.js 14 (App Router)- TypeScript- Supabase (Postgres + Row Level Security)- Vercel (hosting)- Resend (transactional email)- shadcn/ui + Tailwind CSS- react-hook-form + zod- date-fns |
| Scaffold source | Hosted virtual scaffold |

## Created Structure

- `planning/architect-packs/`
- `references/client-docs/`
- `references/source-app/`
- `references/platform/`
- `samples/`

## Personalized Files

- `README.md`
- `AGENTS.md`
- `planning/STATE.md`
- `planning/DOMAIN.md`
- `planning/FILE_INVENTORY.md`

## Generated Files

- `planning/INTAKE.md`
- `project-start.md`
- `architect-chat-starter-prompt.md`

## Architect Intake

`planning/INTAKE.md` captures the guided intake context collected before project creation. Use it as primary discovery context when creating Architect Pack 001.


## Next Steps

1. Open the new project folder.
2. Review `project-start.md`.
3. Review `planning/INTAKE.md`.
4. Open `architect-chat-starter-prompt.md`.
5. Start a new Architect chat.
6. Start Architect Pack 001 discovery.
7. Generate Architect Pack 001 only after explicit approval.
8. Save the Architect Pack in `planning/architect-packs/`.
9. Dry-run the importer.
10. Apply the Architect Pack after review.

## Architect Pack Commands

Save Architect Packs in `planning/architect-packs/`.

Dry-run from the project root:

`node scripts/apply-architect-pack.js planning/architect-packs/architect-pack-###-{sprint-name}.md --dry-run`

Apply from the project root after reviewing the dry-run:

`node scripts/apply-architect-pack.js planning/architect-packs/architect-pack-###-{sprint-name}.md`

After a pack is applied, Builders implement from the generated sprint files under `planning/sprints/`, not directly from the Architect Pack.
