# Sprint 007 - Stabilize and Align: Requirements

## Why

Group Meet now has two designs in one repo, and the plan for the beta has changed twice. The operator has decided the beta runs on the domain workflow, and that meeting types are admin-defined data (title, landing page, named durations, roles with required counts, a pool of professionals), not two fixed types. Before any more code, every planning document, the method files, and the git history must say the same thing. This sprint is documentation and housekeeping only. No application code, migrations, or SQL change.

## Scope

1. **Protect the method files.** The 120x method files, commands, skills, manifest, and updater are untracked or modified. Commit them so a checkout or clean cannot lose them.
2. **Stop ignoring Architect Packs.** `planning/architect-packs/` is git-ignored, so sprint history cannot be recovered. Track the `.md` packs; keep binaries ignored.
3. **Align the planning documents** to the decisions below.
4. **Close method gaps:** the referenced `docs/ARCHITECT_BRIEFING_SPEC.md` does not exist; `AGENTS.md` still says the project is in Discovery and lists stale tech.
5. **Record the decisions** in `planning/DECISIONS.md` as 047 to 056.

## Decisions to record (verbatim intent, Builder writes them as table rows dated 2026-11-06)

| # | Decision | Why | Implication |
|---|---|---|---|
| 047 | The beta runs on the domain workflow. The legacy meetings flow (`meetings`, `time_slots`, `team_members`, `responses`, `lib/quorum.ts`) is retired in Sprint 014. | Two parallel designs caused admin pages to be built on the wrong tables. | New pages use only domain tables. Legacy code stays untouched until Sprint 014. |
| 048 | Meeting types are admin-defined data, not an enum. A meeting type has a title, a landing page (description), a shareable slug, named duration options, roles with required counts, and a pool of professionals. | The operator wants a workspace where meetings are created without code changes. | The fixed `meeting_type` enum and the fixed In-depth / Short-form types are superseded. In-depth (75) and Short-form (45) become the first two seeded meeting types. |
| 049 | Duration options are named and defined per meeting type (for example Short 30, Normal 45, Long 60). The client picks one option and never types a number. End time is always start plus the chosen duration. | Keeps Decisions 001, 002, 006 intact while making durations configurable. | A request stores the chosen duration option. Slots still store only a start time. |
| 050 | Roles belong to the meeting type, each with a required count. A professional can fill a role only if they are in that meeting type's pool for that role. The In-depth / General tier concept is superseded. | Supports setups such as 1 Lead + 1 Support or 1 Lead + 2 Support. | Decisions 024 and the tier rules in 018 to 025 are superseded for matching. `professionals.tier` stays in the database until Sprint 008 migrates it. CSV import stays name + email (Decision 025). |
| 051 | Threshold is per meeting type. Default: every required role can be filled by a distinct qualified professional in at least 3 slots. The minimum number of matched slots (default 3) and a minimum number of responses are editable per meeting type. | Replaces the fixed "4 responses + 3 matched slots" (Decision 012). | Sprint 008 defines the exact fields and defaults. Open question Q-008 tracks the minimum responses default. |
| 052 | Admin and Super Admin can create and edit meeting types, durations, roles, and pools. Only Super Admin can edit email templates, platform settings, and invite or manage admins. | Matches the operator's answer; refines Decisions 009, 010, 011. | Permission checks on the meeting-type routes allow both roles. Template, settings, and invite routes stay Super Admin only. |
| 053 | Admin-created requests on a client's behalf are deferred, not dropped. The request model must stay flexible: the creator of a request is nullable and requests do not assume the public form is the only source. | The operator wants flexibility for the future without building it now. | No admin request-entry UI before the beta ends. Sprint 009 keeps a nullable creator reference. |
| 054 | The client still picks the final slot after admin approval. Professionals commit to client-proposed slots. | Avoids booking a time the client cannot make; confirms Decisions 019 to 023. | The flow in `DOMAIN.md` steps 1 to 7 is unchanged apart from roles and durations. |
| 055 | Each meeting type has one shareable link (slug). A public page lists the active meeting types. | The operator wants clients to click a link for a specific meeting. | Slug is unique and URL-safe. The home page becomes the list; the form lives under the slug. |
| 056 | Architect Pack `.md` files are tracked in git. Binaries in `planning/architect-packs/` stay ignored. | Sprint history was unrecoverable because packs were ignored. | `.gitignore` is changed per the blueprint. |

## Plan corrections from the Builder briefing (now rules for later sprints)

- Every sprint blueprint from 008 on must name the tables each page or route reads and writes.
- Any sprint that changes form fields or stored data must name its migration in the blueprint and say who applies it.
- Sprint history must live in git (Decision 056).

## Out of scope

- No application code, no SQL, no migration files, no change under `app/`, `lib/`, `src/`, or `supabase/`.
- No edits to the managed method files under `templates/method/`, `.claude/`, `.agents/`, `.120x/`, or `scripts/` (they are committed as they are).
- No pushing, no pull request, no merge, no deletion of any file (including the large installer in the packs folder).
- No change to `next-env.d.ts` (auto-generated; leave it uncommitted).

## Success

A new person can read `AGENTS.md`, `DOMAIN.md`, `DECISIONS.md`, `DATA_MODEL.md`, and `ROADMAP.md` and get one consistent picture: domain workflow, admin-defined meeting types with named durations and roles, and the nine-sprint road.
