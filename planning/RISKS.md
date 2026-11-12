# Group Meet — Risks

**Last updated:** 2026-11-06 (Sprint 007)

R-001 to R-005 described the Sprint 001 legacy quorum flow (no quorum reached, forwarded voting links, Resend failure, duplicate quorum trigger, duplicate requests). They are archived in this file's git history before Sprint 007 and are retired with the legacy flow in Sprint 014. R-004 and R-005 should be re-checked against the domain workflow when Sprints 009 and 012 are planned.

## R-006: Framework dependency advisories
**Risk:** `npm audit` has reported advisories. The app is now on Next.js 16.2.x (not 14, as first planned), so the original advisories may no longer apply and new ones are unreviewed.
**Likelihood:** Medium
**Impact:** Medium–High depending on deployment exposure.
**Mitigation:** Review `npm audit` output before the beta (Sprint 015) and record the result.

## R-007: Two parallel designs until Sprint 014
**Risk:** The legacy meetings flow (`meetings`, `time_slots`, `team_members`, `responses`) and the domain model both exist. New pages built on the wrong tables would be thrown away.
**Likelihood:** Medium
**Impact:** High — wasted sprints and confusing behavior.
**Mitigation:** Decision 047. Every blueprint from Sprint 008 on names the tables each page reads and writes. Legacy code is untouched until Sprint 014.

## R-008: Email delivery blocked on a verified sending domain
**Risk:** The Resend sending domain is not verified, so email reaches only the Resend account owner. Every workflow step after the request depends on email.
**Likelihood:** High until the operator verifies DNS (Google Workspace).
**Impact:** High — no real professional or client can be tested.
**Mitigation:** Sprint 010 is early on the road. Operator completes DNS verification before or during Sprint 010.

## R-009: Permissive access rules on legacy tables
**Risk:** Row Level Security policies on legacy tables use permissive rules, including public read on `meetings`, `time_slots`, and `responses`. Client names and emails stored there could be read publicly.
**Likelihood:** Medium
**Impact:** High — personal data exposure.
**Mitigation:** Retire or tighten these policies in Sprint 014. New domain tables must ship with restrictive policies from the start.

## R-010: Team voting links carry the member id with no token
**Risk:** `/team/meetings/[id]?member=[uuid]` gives access with only an id in the query string. A forwarded or guessed link acts as that professional.
**Likelihood:** Low (internal audience) but higher once real professionals take part.
**Impact:** Medium — wrong availability recorded.
**Mitigation:** Sprint 011 replaces it with tokenized magic links (hashed tokens, Decision 033).

## R-011: No automated tests
**Risk:** `tests/` holds only a README. Verification so far is typecheck, build, and manual checks.
**Likelihood:** High
**Impact:** Medium — regressions in the threshold and pairing logic would be silent.
**Mitigation:** Add tests for threshold and role-coverage logic in Sprint 012 and for business-day logic in Sprint 014. Blueprints name the tests.

## R-012: `npm audit` advisories not reviewed
**Risk:** Advisories flagged earlier have not been triaged.
**Likelihood:** Medium
**Impact:** Medium
**Mitigation:** See R-006; review before the beta.
