# Roadmap - {{PROJECT_NAME}}

> A living estimate, not a contract. Sprints get added, split, re-ordered, or dropped as the work teaches us. The Architect updates this file at every session and shows the change in git; the Builder marks a row `done` when that sprint closes.

**About:** N sprints on the road
**Last estimated:** YYYY-MM-DD

| # | Sprint | Phase | Status | Why it matters |
| --- | --- | --- | --- | --- |
| 001 | First useful step | Foundation | planned | Explain in one line what this unlocks for the person using the project. |
| 002 | Next useful step | Launch | planned | Explain why this should follow the first sprint. |

## Notes

- Keep this short. Note only sequencing risks or ideas that may change the road.
- Status is always `planned` or `done`. Mission Control shows any other word as
  `planned`.
- `Phase` is optional. A roadmap without it remains valid.
- Consecutive rows with the same short, human phase name form one band. Its
  sprint range and detail come from those rows; do not author a second summary.
- The road is one table. Mission Control reads only the first table in this
  file; a second table is invisible to it. A new phase gets `Phase` values on
  new rows, never a new table.

## Splitting a sprint

Numbers are names, not positions, and table order is flight order. To split a
sprint, give each half the next unused plain number and place both rows where
the split sprint sat in the table. Suffixed ids like `004a` keep working in
`planning/sprints/`, but Mission Control cannot read them and will not show
them. Renumbering the halves also works when nothing frozen refers to the old
numbers.

## Mid-flight adoption

For a project that already shipped work before adopting this roadmap, add this
line below `Last estimated` and start the table with the road ahead:

**Completed before this roadmap existed:** sprints NNN-NNN (the record lives in
`planning/sprints/` and `planning/STATE.md`)

Do not add all earlier sprints as `done` rows. The sprint folders and
`planning/STATE.md` already hold that history.
