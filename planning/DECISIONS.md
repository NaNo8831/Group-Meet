# Group Meet — Decisions Log

## D-001: No auth on voting links (Phase 1)
**Decision:** Team member voting links use a `?member=[uuid]` query param. No login required.
**Why:** Speed of build. Audience is trusted internal team members receiving links via email.
**Trade-off:** Link could theoretically be forwarded and voted on by someone else.
**Phase 2 plan:** Replace with Supabase magic link auth.

## D-002: Email via Resend
**Decision:** Use Resend for all transactional email.
**Why:** Simple API, generous free tier, React email support for future use.
**Trade-off:** One additional service to configure.

## D-003: Quorum picks the earliest qualifying slot
**Decision:** When multiple slots have both a Leader and Support response, confirm the earliest one.
**Why:** Simple, unambiguous logic. No admin decision required.
**Trade-off:** May not always be the most convenient slot. Revisit in Phase 2 if needed.

## D-004: Email failure does not roll back meeting creation
**Decision:** If Resend fails, the meeting record is still saved and the error is logged.
**Why:** A DB write should not be undone due to a downstream email failure.
**Trade-off:** Team members may miss their voting link — monitoring recommended.

## D-005: Team members seeded directly in DB (Phase 1)
**Decision:** No admin UI. Team members inserted via Supabase dashboard or seed SQL.
**Why:** Reduces scope. Team composition is stable.
**Phase 2 plan:** Admin dashboard at `/admin` behind Supabase Auth.

## D-006: Next.js 14 App Router
**Decision:** Use App Router, not Pages Router.
**Why:** Modern pattern, better server component and API route co-location.
**Trade-off:** Some shadcn/ui components require `"use client"` — handle case by case.

## D-007: Full MVP in Sprint 001
**Decision:** Deliver the complete shippable v1 in one sprint.
**Why:** App is well-scoped, data model is clear, no ambiguous features in Phase 1.
**Trade-off:** Sprint is larger than a typical first sprint — Builder should work feature by feature in the order defined in handoff-prompt.md.

## D-008: Keep Next.js 14 for Sprint 001
**Decision:** Use Next.js 14 App Router as specified by the Sprint 001 stack.
**Why:** The handoff and acceptance criteria explicitly require Next.js 14.
**Trade-off:** `npm audit` reports Next.js advisories whose automated fix is a major upgrade to Next 16. Revisit during a dedicated dependency/security sprint.

## D-009: Upgrade runtime to Next.js 16.2.7
**Decision:** Upgrade the application runtime from Next.js 14 to Next.js 16.2.7.
**Why:** The installed app runtime is Next.js 16.2.7, and deployment behavior must match the actual runtime.
**Trade-off:** Dynamic App Router `params` and `searchParams` are asynchronous in Next.js 15+, so dynamic pages must await them before querying Supabase. `eslint-config-next` should be kept aligned with the installed Next.js version.
