# Group Meet — File Inventory

## Planning Folder
| File | Purpose |
|---|---|
| `planning/STATE.md` | Current project status and sprint goals |
| `planning/DECISIONS.md` | Architectural and product decisions with rationale |
| `planning/DOMAIN.md` | Domain terminology, status lifecycle, quorum logic |
| `planning/RISKS.md` | Known risks and mitigations |
| `planning/QUESTIONS.md` | Open questions and deferred decisions |
| `planning/FILE_INVENTORY.md` | This file |
| `planning/architect-packs/architect-pack-001-discovery.md` | This pack |
| `planning/sprints/001-discovery-architecture/requirements.md` | Sprint 001 requirements |
| `planning/sprints/001-discovery-architecture/blueprint.md` | Sprint 001 technical blueprint |
| `planning/sprints/001-discovery-architecture/acceptance.md` | Sprint 001 acceptance criteria |
| `planning/sprints/001-discovery-architecture/handoff-prompt.md` | Builder handoff prompt |

## Docs Folder
| File | Purpose |
|---|---|
| `docs/ARCHITECTURE.md` | System architecture overview |
| `docs/API.md` | API route reference |
| `docs/VALIDATION.md` | Validation and testing expectations |

## Application (to be created by Builder)
| Path | Purpose |
|---|---|
| `app/page.tsx` | Participant request form |
| `app/meetings/[id]/page.tsx` | Participant status page |
| `app/team/meetings/[id]/page.tsx` | Team member voting page |
| `app/api/meetings/route.ts` | POST: create meeting + slots, send team emails |
| `app/api/responses/route.ts` | POST: record vote, run quorum check |
| `lib/supabase.ts` | Supabase client (server + browser) |
| `lib/email.ts` | Resend email helpers |
| `lib/quorum.ts` | Quorum check logic |
| `lib/types.ts` | Shared TypeScript types |
| `.env.example` | Environment variable template |
| `supabase/schema.sql` | Database schema + RLS |
| `supabase/seed.sql` | Team member seed data |
