# Group Meet

**Client:** Private  
**Description:** Group Meet lets external Participants request a meeting with a team, then automatically confirms the booking once one Leader and one Support have both indicated availability for the same time slot.  
**Project type:** Internal tool  
**Tech stack:** - Next.js 14 (App Router)- TypeScript- Supabase (Postgres + Row Level Security)- Vercel (hosting)- Resend (transactional email)- shadcn/ui + Tailwind CSS- react-hook-form + zod- date-fns

---

## Purpose

This project folder was created by the 120x Project Launcher for the 120x Architect / Builder workflow.

It is ready for project-specific discovery and architecture planning.

---

## Project Metadata

| Field | Value |
|---|---|
| Project name | Group Meet |
| Client name | Private |
| Project slug | group-meet |
| One-sentence description | Group Meet lets external Participants request a meeting with a team, then automatically confirms the booking once one Leader and one Support have both indicated availability for the same time slot. |
| Project type | Internal tool |
| Planning folder | group-meet/ |
| Implementation repo | Downloaded project folder |
| Canonical GitHub repo | https://github.com/NaNo8831/Group-Meet |
| Tech stack | - Next.js 14 (App Router)- TypeScript- Supabase (Postgres + Row Level Security)- Vercel (hosting)- Resend (transactional email)- shadcn/ui + Tailwind CSS- react-hook-form + zod- date-fns |

---

## Current Status

- Sprint 001 MVP application has been implemented on the Next.js 14 App Router stack.
- Supabase schema and seed SQL are available under `supabase/`.
- Local validation passed: `npm run build` and a dev-server smoke test.
- Live end-to-end validation still requires Supabase, Resend, and Vercel environment configuration.

---

## Next Steps

1. Create or open the Supabase project.
2. Run `supabase/schema.sql`, then `supabase/seed.sql`.
3. Copy `.env.example` to `.env.local` and fill in Supabase, Resend, and app URL values.
4. Run `npm run dev`.
5. Deploy to Vercel after setting the same environment variables.

Dry-run command shape:

`node scripts/apply-architect-pack.js planning/architect-packs/architect-pack-###-{sprint-name}.md --dry-run`

Apply command shape:

`node scripts/apply-architect-pack.js planning/architect-packs/architect-pack-###-{sprint-name}.md`

After a pack is applied, Builders implement from the generated sprint files under `planning/sprints/`, not directly from the Architect Pack.
# Group-Meet
